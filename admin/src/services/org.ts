import { JOB_TITLES } from "@/data/employees";
import { api } from "@/lib/api";
import { polygonAreaM2 } from "@/lib/geo";
import { useData } from "@/store/data";
import { employeesRemote, useEmployees } from "@/store/employees";
import { useLeave } from "@/store/leave";
import { useSchedule } from "@/store/schedule";
import { useUsers } from "@/store/users";
import { sitesRemote, useSites } from "@/store/sites";
import type { Geofence, LatLng } from "@/types/domain";
import type { AppStatus, Contract, Employee, EmployeeDraft, EmployeeStatus, JobTitle } from "@/types/employee";
import type { ManagedBranch, ManagedSite } from "@/types/site";

// --- API shapes (snake_case, as the backend sends them) --------------------------------------------------

interface ApiBranch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  timezone: string;
  status: string;
}

interface ApiSite {
  id: string;
  name: string;
  code: string;
  branch_id: string;
  address: string | null;
  timezone: string;
  status: string;
  require_selfie: boolean;
  require_qr: boolean;
  device_binding: boolean;
  allow_offline: boolean;
  min_accuracy_m: number;
  default_start: string | null;
  default_end: string | null;
  geofence_kind: "circle" | "polygon";
  radius_m: number | null;
  center: [number, number];
  geofence_geojson: { coordinates: [number, number][][] } | null;
  managers: { user_id: string; name: string; phone: string | null }[];
  employees_count: number;
}

interface ApiEmployee {
  id: string;
  full_name: string;
  employee_no: string;
  email: string | null;
  phone: string | null;
  branch_id: string;
  job_title: string | null;
  contract_type: string | null;
  start_date: string | null;
  has_smartphone: boolean;
  require_selfie: boolean;
  status: string;
  app_status: string;
  site_ids: string[];
  badge_pin?: string | null;
}

// --- mapping ----------------------------------------------------------------------------------------------

/** Admin positions are [lat, lng]; the API uses GeoJSON order [lng, lat]. */
const toLatLng = ([lng, lat]: [number, number]): LatLng => [lat, lng];
const toLngLat = ([lat, lng]: LatLng): [number, number] => [lng, lat];
const hhmm = (t: string | null, fallback: string) => (t ? t.slice(0, 5) : fallback);

export function toBranch(b: ApiBranch): ManagedBranch {
  return { id: b.id, name: b.name, code: b.code, address: b.address ?? "", timezone: b.timezone, admins: [], holidays: "custom", workflow: "default", rate: 0, archived: b.status !== "active" };
}

export function toSite(s: ApiSite): ManagedSite {
  let geofence: Geofence;
  if (s.geofence_kind === "polygon" && s.geofence_geojson) {
    const points = s.geofence_geojson.coordinates[0].slice(0, -1).map(toLatLng);
    geofence = { kind: "polygon", points, hectares: Math.round((polygonAreaM2(points) / 10_000) * 10) / 10 };
  } else geofence = { kind: "circle", radius: s.radius_m ?? 100 };
  return {
    id: s.id, name: s.name, code: s.code, branchId: s.branch_id, address: s.address ?? "", timezone: s.timezone, position: toLatLng(s.center), geofence,
    managers: s.managers.map((m) => m.name), phone: s.managers[0]?.phone ?? "", employees: s.employees_count,
    expected: 0, present: 0, late: 0, absent: 0, flagged: 0, leave: 0,
    requireSelfie: s.require_selfie, requireQr: s.require_qr, registeredDeviceOnly: s.device_binding, allowOffline: s.allow_offline, minAccuracy: s.min_accuracy_m,
    active: s.status === "active", hours: { start: hhmm(s.default_start, "08:00"), end: hhmm(s.default_end, "17:00"), breakMinutes: 30 },
  };
}

const CONTRACTS: Contract[] = ["cdi", "cdd", "interim", "intern", "part"];
const APP: AppStatus[] = ["installed", "invited", "none"];
const STATUS: EmployeeStatus[] = ["active", "invited", "deactivated"];
const pick = <T extends string>(list: readonly T[], v: string | null, fallback: T): T => (list.includes(v as T) ? (v as T) : fallback);

export function toEmployee(e: ApiEmployee): Employee {
  return {
    id: e.employee_no, name: e.full_name, branchId: e.branch_id, siteIds: e.site_ids, title: pick<JobTitle>(JOB_TITLES, e.job_title, "technician"),
    phone: e.phone ?? "—", email: e.email ?? undefined, app: e.has_smartphone ? pick(APP, e.app_status, "none") : "none", attendance: 0, status: pick(STATUS, e.status, "active"),
    access: "employee", contract: pick(CONTRACTS, e.contract_type, "cdi"), startDate: e.start_date ?? "", selfie: e.require_selfie ? "on" : "inherit", pin: e.badge_pin ?? undefined,
  };
}

/** Employees are shown by employee number but the API addresses them by uuid. */
const employeeUuid = new Map<string, string>();
const employeeNo = new Map<string, string>();
const remember = (list: ApiEmployee[]) =>
  list.forEach((e) => {
    employeeUuid.set(e.employee_no, e.id);
    employeeNo.set(e.id, e.employee_no);
  });
/** API employee id for an employee number ("E-001"), when known. */
export const employeeUuidOfNo = (no: string): string | undefined => employeeUuid.get(no);

/** API employee id for a name shown in the planner (names are the planner's key for people). */
export const employeeUuidByName = (name: string): string | undefined => {
  const no = useEmployees.getState().employees.find((e) => e.name === name)?.id;
  return no ? employeeUuid.get(no) : undefined;
};

/** Name for an API employee id, when known. */
export const employeeNameByUuid = (uuid: string): string | undefined => {
  const no = employeeNo.get(uuid);
  return no ? useEmployees.getState().employees.find((e) => e.id === no)?.name : undefined;
};

/** Replace the employees assigned to a site, then re-read the organisation. */
export async function setSiteEmployees(siteId: string, employeeNos: string[]): Promise<void> {
  await api.put(`/sites/${siteId}/employees`, { ids: employeeNos.map(uuidOf) });
  await loadOrg();
}

/** Add or remove one site manager (a dashboard user), keeping the others. */
export async function setSiteManager(siteId: string, userId: string, add: boolean): Promise<void> {
  const site = await api.get<ApiSite>(`/sites/${siteId}`);
  const current = site.managers.map((m) => m.user_id);
  const next = add ? [...new Set([...current, userId])] : current.filter((id) => id !== userId);
  await api.put(`/sites/${siteId}/managers`, { ids: next });
  await loadOrg();
}

/** Set the full manager and employee lists of a site in one go (used by the site editor). */
export async function setSiteMembers(siteId: string, members: { managerIds?: string[]; employeeNos?: string[] }): Promise<void> {
  if (members.managerIds) await api.put(`/sites/${siteId}/managers`, { ids: members.managerIds });
  if (members.employeeNos) await api.put(`/sites/${siteId}/employees`, { ids: members.employeeNos.map(uuidOf) });
  await loadOrg();
}

/** Employee number ("E-001") for an API employee id, when known. */
export const employeeNoOf = (uuid: string): string | undefined => employeeNo.get(uuid);
const uuidOf = (no: string): string => {
  const id = employeeUuid.get(no);
  if (!id) throw new Error(`Unknown employee ${no}`);
  return id;
};

function geofenceBody(g: Geofence, position: LatLng) {
  if (g.kind === "circle") return { type: "circle", center: toLngLat(position), radius_m: g.radius };
  const ring = g.points.map(toLngLat);
  return { type: "polygon", geojson: { type: "Polygon", coordinates: [[...ring, ring[0]]] } };
}

function siteBody(s: Partial<ManagedSite>) {
  const body: Record<string, unknown> = {};
  if (s.name !== undefined) body.name = s.name;
  if (s.code !== undefined) body.code = s.code;
  if (s.branchId !== undefined) body.branch_id = s.branchId;
  if (s.address !== undefined) body.address = s.address;
  if (s.timezone !== undefined) body.timezone = s.timezone;
  if (s.requireSelfie !== undefined) body.require_selfie = s.requireSelfie;
  if (s.requireQr !== undefined) body.require_qr = s.requireQr;
  if (s.registeredDeviceOnly !== undefined) body.device_binding = s.registeredDeviceOnly;
  if (s.allowOffline !== undefined) body.allow_offline = s.allowOffline;
  if (s.minAccuracy !== undefined) body.min_accuracy_m = s.minAccuracy;
  if (s.hours) {
    body.default_start = s.hours.start;
    body.default_end = s.hours.end;
  }
  if (s.geofence && s.position) {
    body.geofence = geofenceBody(s.geofence, s.position);
    body.center = toLngLat(s.position);
  }
  return body;
}

function employeeBody(d: EmployeeDraft, create: boolean) {
  return {
    full_name: d.name,
    employee_no: d.id,
    email: d.email || null,
    phone: d.phone || null,
    branch_id: d.branchId,
    job_title: d.title,
    contract_type: d.contract,
    start_date: d.startDate || null,
    has_smartphone: d.smartphone,
    require_selfie: d.selfie === "on",
    site_ids: d.siteIds,
    default_site_id: d.siteIds[0] ?? null,
    ...(create ? { send_invite: d.invite } : {}),
  };
}

interface ApiLiveSite {
  site_id: string;
  counters: { expected: number; present: number; absent: number; flagged: number; on_leave: number };
  rows: { status: string }[];
}

/** Today's per-site headcount from the live board; empty when the user may not see attendance. */
async function loadHeadcounts(): Promise<Map<string, ApiLiveSite>> {
  try {
    return new Map((await api.get<ApiLiveSite[]>("/attendance/live")).map((l) => [l.site_id, l]));
  } catch {
    return new Map();
  }
}

function withHeadcount(site: ManagedSite, l: ApiLiveSite | undefined): ManagedSite {
  if (!l) return site;
  const { expected, present, absent, flagged, on_leave } = l.counters;
  return { ...site, expected, present, absent, flagged, leave: on_leave, late: l.rows.filter((r) => r.status === "late").length };
}

/** Re-read only today's headcounts, so the site screens stay current without reloading the whole organisation. */
export async function refreshHeadcounts(): Promise<void> {
  const live = await loadHeadcounts();
  if (live.size === 0) return;
  useSites.setState((st) => ({ sites: st.sites.map((s) => withHeadcount(s, live.get(s.id))) }));
}

// --- loading ----------------------------------------------------------------------------------------------

const EMPLOYEE_PAGE = 200;

/** The API caps a page at 200, so keep asking until a page comes back short. */
async function loadAllEmployees(): Promise<ApiEmployee[]> {
  const all: ApiEmployee[] = [];
  for (let offset = 0; ; offset += EMPLOYEE_PAGE) {
    const page = await api.get<ApiEmployee[]>("/employees", { params: { limit: EMPLOYEE_PAGE, offset } });
    all.push(...page);
    if (page.length < EMPLOYEE_PAGE) return all;
  }
}

/** Replace the demo org with the company's real branches, sites and employees. */
export async function loadOrg(): Promise<void> {
  const [branches, sites, employees, live] = await Promise.all([
    api.get<ApiBranch[]>("/branches"),
    api.get<ApiSite[]>("/sites"),
    loadAllEmployees(),
    loadHeadcounts(),
  ]);
  remember(employees);
  const withCounts = (s: ApiSite): ManagedSite => withHeadcount(toSite(s), live.get(s.id));
  useSites.setState({ branches: branches.map(toBranch), sites: sites.map(withCounts) });
  useEmployees.setState({ employees: employees.map(toEmployee) });
}

// --- writes (installed into the stores) -------------------------------------------------------------------

export function installOrgRemotes(): void {
  sitesRemote.current = {
    async createSite(input) {
      const body = { ...siteBody(input), employee_ids: [] as string[], manager_ids: [] as string[] };
      return toSite(await api.post<ApiSite>("/sites", body));
    },
    async updateSite(id, patch) {
      if (patch.active !== undefined) await api.post(`/sites/${id}/${patch.active ? "activate" : "deactivate"}`);
      const body = siteBody(patch);
      if (Object.keys(body).length) await api.patch(`/sites/${id}`, body);
    },
    async saveBranch(b, isNew) {
      const body = { name: b.name, code: b.code, address: b.address || null, timezone: b.timezone };
      return toBranch(isNew ? await api.post<ApiBranch>("/branches", body) : await api.patch<ApiBranch>(`/branches/${b.id}`, body));
    },
    async retireBranch(id, mode, moveTo) {
      if (moveTo) {
        const [sites, employees] = await Promise.all([
          api.get<ApiSite[]>("/sites", { params: { branch_id: id } }),
          api.get<ApiEmployee[]>("/employees", { params: { branch_id: id, limit: 200 } }),
        ]);
        await Promise.all([
          ...sites.map((x) => api.patch(`/sites/${x.id}`, { branch_id: moveTo })),
          ...employees.map((x) => api.patch(`/employees/${x.id}`, { branch_id: moveTo })),
        ]);
      }
      await api.post(`/branches/${id}/archive`);
      if (mode === "delete") await api.delete(`/branches/${id}`, { data: { reason: "Deleted from the dashboard" } });
    },
    restoreBranch: async (id) => void (await api.post(`/branches/${id}/restore`)),
    reload: loadOrg,
  };

  employeesRemote.current = {
    async create(draft) {
      const created = await api.post<ApiEmployee>("/employees", employeeBody(draft, true));
      remember([created]);
      return toEmployee(created);
    },
    async update(no, draft) {
      const updated = await api.patch<ApiEmployee>(`/employees/${uuidOf(no)}`, employeeBody(draft, false));
      remember([updated]);
      return toEmployee(updated);
    },
    async setStatus(no, status) {
      if (status === "deactivated") await api.post(`/employees/${uuidOf(no)}/deactivate`);
      else if (status === "active") await api.post(`/employees/${uuidOf(no)}/reactivate`);
    },
    reload: loadOrg,
  };
}

/**
 * Empty the demo data of modules that are not on the API yet. It points at the demo company's site ids, which
 * no longer exist once the real org is loaded.
 */
export function clearDemoData(): void {
  useData.setState({ today: [], history: [] });
  useLeave.setState({ requests: [] });
  useSchedule.setState({ shifts: [], interventions: [], dirty: {} });
  useUsers.setState({ users: [], roles: [] });
}
