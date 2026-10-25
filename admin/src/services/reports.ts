import { api } from "@/lib/api";
import { emptyReport, nextDelivery, parseDay, rangeOf, REPORTS, type ReportData } from "@/features/reports/model";
import { employeeNameByUuid, employeeUuidByName } from "@/services/org";
import { reportsRemote, useReports } from "@/store/reports";
import type { GroupBy, RangeKey, ReportConfig, ReportSchedule, ReportType, SavedReport } from "@/types/reports";

interface ApiDefinition {
  type: string;
  date_from: string;
  date_to: string;
  group_by: GroupBy;
  site_ids: string[] | null;
  branch_ids: string[] | null;
  employee_ids: string[] | null;
  columns: string[] | null;
  range_key: string | null;
}

const UI_TYPE = Object.fromEntries(Object.entries(REPORTS).map(([ui, spec]) => [spec.server, ui])) as Record<string, ReportType>;

/** The report definition the server understands. */
function definitionOf(c: ReportConfig): ApiDefinition {
  const [from, to] = rangeOf(c);
  const emps = c.emps.map(employeeUuidByName).filter((x): x is string => !!x);
  return {
    type: REPORTS[c.type].server, date_from: from, date_to: to, group_by: c.group, site_ids: c.sites.length ? c.sites : null, branch_ids: c.branches.length ? c.branches : null,
    employee_ids: emps.length ? emps : null, columns: c.cols, range_key: c.range,
  };
}

/** Run a report on the server. A bad date range or an empty column choice gives an empty report. */
export async function previewReport(c: ReportConfig): Promise<ReportData> {
  const [from, to] = rangeOf(c);
  if (!from || !to || parseDay(to) < parseDay(from) || !c.cols.length) return emptyReport(c);
  const out = await api.post<{ columns: string[]; rows: Record<string, string | number>[] }>("/reports/preview", definitionOf(c));
  const cols = REPORTS[c.type].cols.filter((x) => c.cols.includes(x.key) && out.columns.includes(x.key));
  const days = Math.round((parseDay(to) - parseDay(from)) / 864e5) + 1;
  return { cols, days, rows: out.rows.map((r) => ({ key: String(r.label), vals: cols.map((col) => Number(r[col.key] ?? 0)) })) };
}

// --- saved reports -----------------------------------------------------------------------------------------

interface ApiSaved {
  id: string;
  name: string;
  definition: ApiDefinition;
  schedule: ReportSchedule | null;
}

function toSaved(r: ApiSaved): SavedReport {
  const d = r.definition;
  const type = UI_TYPE[d.type] ?? "timesheet";
  const range = (["month", "last", "7", "q", "custom"].includes(d.range_key ?? "") ? d.range_key : "custom") as RangeKey;
  return {
    id: r.id, name: r.name, type, range, from: d.date_from, to: d.date_to, branches: d.branch_ids ?? [], sites: d.site_ids ?? [],
    emps: (d.employee_ids ?? []).map((id) => employeeNameByUuid(id)).filter((x): x is string => !!x), group: d.group_by, cols: d.columns ?? REPORTS[type].defaults,
    schedule: r.schedule, delivery: r.schedule ? nextDelivery(r.schedule) : { kind: "never" },
  };
}

export async function loadSavedReports(): Promise<void> {
  const rows = await api.get<ApiSaved[]>("/reports/saved");
  useReports.setState({ saved: rows.map(toSaved) });
}

export function installReportsRemote(): void {
  reportsRemote.current = {
    async create(name, cfg, schedule) {
      const out = await api.post<{ id: string }>("/reports/saved", { name, definition: definitionOf(cfg), schedule });
      await loadSavedReports();
      return out.id;
    },
    async update(id, cfg, name, schedule) {
      await api.patch(`/reports/saved/${id}`, { name, definition: definitionOf(cfg), schedule });
      await loadSavedReports();
    },
    async remove(id) {
      await api.delete(`/reports/saved/${id}`);
    },
    reload: loadSavedReports,
  };
}
