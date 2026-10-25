import { ApiError, api } from "@/lib/api";
import { markSignedIn } from "@/lib/auth-cookie";
import { loadMe } from "@/services/auth";
import type { FieldErrors, OnboardingForm } from "@/features/onboarding/types";

/** What the wizard has created so far, so later steps can attach to it. */
const created: { branchId?: string; siteId?: string; employeeIds: string[] } = { employeeIds: [] };

export type CommitResult = { error?: FieldErrors; failure?: string };

const COUNTRY: Record<string, string> = { france: "FR", belgium: "BE", switzerland: "CH", canada: "CA", uk: "GB" };
const slug = (s: string, fallback: string) => s.replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase() || fallback;

/** An international phone number from what a person typed ("06 12 34 56 78" with +33 -> "+33612345678"). */
function international(raw: string, dial: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  return `${dial}${digits.replace(/^0+/, "")}`;
}

const failureOf = (e: unknown): CommitResult => ({ failure: e instanceof ApiError && e.isNetwork ? "offline" : "serverFailed" });

/** Run the server side of one wizard step. Resolves with field errors (or a general failure) when it did not work. */
export async function commitStep(step: number, f: OnboardingForm, code: string[]): Promise<CommitResult> {
  try {
    switch (step) {
      case 1:
        await api.post("/auth/signup", { full_name: f.name.trim(), email: f.email.trim(), password: f.password, phone: international(f.phone, f.dial), company_name: f.company.trim() || "My company", accept_terms: f.terms, locale: f.language }, { public: true });
        return {};
      case 2: {
        const out = await api.post<{ access_token: string }>("/auth/verify-email", { email: f.email.trim(), code: code.join("") }, { public: true });
        api.setAccessToken(out.access_token);
        markSignedIn();
        return {};
      }
      case 3:
        await api.patch("/company", { name: f.company.trim(), industry: f.industry, size: f.size, country: COUNTRY[f.country] ?? "FR", timezone: f.timezone, locale: f.language, onboarding_step: 3 });
        return {};
      case 4: {
        const branch = await api.post<{ id: string }>("/branches", { name: f.branch.trim(), code: slug(f.branch, "HQ"), address: [f.street, f.zip, f.city].map((x) => x.trim()).filter(Boolean).join(", "), timezone: f.timezone });
        created.branchId = branch.id;
        return {};
      }
      case 5: {
        if (!created.branchId) return { failure: "serverFailed" };
        const [lat, lng] = f.pin;
        const site = await api.post<{ id: string }>("/sites", {
          name: f.siteName.trim(), code: `${slug(f.siteName, "SITE")}1`.slice(0, 10), branch_id: created.branchId, address: f.siteAddress.trim(), timezone: f.timezone,
          geofence: { type: "circle", center: [lng, lat], radius_m: Math.min(2000, Math.max(20, f.radius)) }, center: [lng, lat],
        });
        created.siteId = site.id;
        return {};
      }
      case 6: {
        if (created.siteId) await api.patch(`/sites/${created.siteId}`, { default_start: f.start, default_end: f.end });
        await api.patch("/settings/attendance", { grace_min: f.grace });
        return {};
      }
      case 7:
        return await inviteTeam(f);
      case 8:
        await api.patch("/company", { onboarding_step: 8, onboarding_done: true });
        await loadMe();
        return {};
      default:
        return {};
    }
  } catch (e) {
    if (e instanceof ApiError) {
      if (step === 1 && e.code === "EMAIL_TAKEN") return { error: { email: "emailTaken" } };
      if (step === 1 && e.code === "PHONE_TAKEN") return { error: { phone: "phoneTaken" } };
      if (step === 1 && e.status === 429) return { error: { email: "tooMany" } };
      if (step === 2 && (e.code === "OTP_INVALID" || e.status === 400 || e.status === 429 || e.code === "INVALID_CODE")) return { error: { code: "codeWrong" } };
      if (step === 2 && e.status === 404) return { error: { code: "codeWrong" } };
    }
    return failureOf(e);
  }
}

/** Create the people from the team step as employees (or dashboard users for manager roles) and give them a first schedule. */
async function inviteTeam(f: OnboardingForm): Promise<CommitResult> {
  if (f.mode !== "manual") return {}; // CSV import runs from Employees → Import once the workspace is open
  const people = f.people.filter((p) => p.name.trim() && p.contact.trim());
  if (!people.length || !created.branchId || !created.siteId) return {};
  const roles = await api.get<{ id: string; key: string | null }[]>("/roles").catch(() => []);
  const errors: FieldErrors = {};
  let n = 0;
  for (const [i, p] of f.people.entries()) {
    if (!p.name.trim() || !p.contact.trim()) continue;
    const isEmail = p.contact.includes("@");
    try {
      if (p.role === "employee" || !isEmail) {
        n += 1;
        const emp = await api.post<{ id: string }>("/employees", {
          full_name: p.name.trim(), employee_no: `E-${String(n).padStart(3, "0")}`, email: isEmail ? p.contact.trim() : null, phone: isEmail ? null : international(p.contact, f.dial),
          branch_id: created.branchId, site_ids: [created.siteId], default_site_id: created.siteId, has_smartphone: true, send_invite: true,
        });
        created.employeeIds.push(emp.id);
      } else {
        const key = p.role === "admin" ? "owner" : p.role === "branch" ? "branch_admin" : "site_manager";
        const role = roles.find((r) => r.key === key);
        if (!role) throw new Error("role");
        const scope = key === "owner" ? { scope_type: "company", scope_ids: [] } : key === "branch_admin" ? { scope_type: "branches", scope_ids: [created.branchId] } : { scope_type: "sites", scope_ids: [created.siteId] };
        await api.post("/users/invite", { email: p.contact.trim(), full_name: p.name.trim(), role_id: role.id, ...scope });
      }
    } catch {
      errors[`p${i}`] = "personFailed";
      errors[`p${i}:field`] = "contact";
    }
  }
  if (Object.keys(errors).length) return { error: errors };
  if (created.employeeIds.length) {
    const days = f.days.map((on, i) => (on ? i : -1)).filter((i) => i >= 0);
    const today = new Date().toISOString().slice(0, 10);
    const schedule = await api.post<{ id: string }>("/schedules", {
      type: "recurring", site_id: created.siteId, title: "Default hours", days_of_week: days, start_time: f.start, end_time: f.end, crosses_midnight: false,
      grace_min: f.grace, valid_from: today, employee_ids: created.employeeIds,
    }).catch(() => null);
    if (schedule) await api.post("/schedules/publish", { schedule_ids: [schedule.id], notify: false, confirm_conflicts: true }).catch(() => undefined);
  }
  return {};
}

/** Send a new verification code (signing up again with the same details re-issues it). */
export async function resendCode(f: OnboardingForm): Promise<boolean> {
  try {
    await api.post("/auth/signup", { full_name: f.name.trim(), email: f.email.trim(), password: f.password, phone: international(f.phone, f.dial), company_name: f.company.trim() || "My company", accept_terms: true, locale: f.language }, { public: true });
    return true;
  } catch {
    return false;
  }
}
