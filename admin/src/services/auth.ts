import { api, ApiError } from "@/lib/api";
import { markSignedIn, markSignedOut } from "@/lib/auth-cookie";
import { clearDemoData, installOrgRemotes, loadOrg } from "@/services/org";
import { installLeaveRemote, loadLeave, loadLeaveTypes } from "@/services/leave";
import { loadBilling } from "@/services/billing";
import { hydrateProfile, loadSessions } from "@/services/profile";
import { installReportsRemote, loadSavedReports } from "@/services/reports";
import { installScheduleRemote, loadSchedule } from "@/services/schedule";
import { installSettingsRemote, loadSettings } from "@/services/settings";
import { installUsersRemote, loadUsers } from "@/services/users";
import { useAuth, type CompanyBrief, type Me } from "@/store/auth";
import { useSession } from "@/store/session";
import type { Role, Scope } from "@/types/auth";

export type AuthResult = "ok" | "wrong" | "deactivated" | "locked" | "unverified" | "mfa" | "offline";

interface LoginOut {
  mfa_required: boolean;
  mfa_ticket?: string | null;
  tokens?: { access_token: string };
  companies: CompanyBrief[];
}

/** Held between the password step and the two-factor code step. */
let mfaTicket: string | null = null;

/** Sign in with email and password. The refresh cookie is set by the backend; the access token stays in memory. */
export async function authenticate(email: string, password: string): Promise<AuthResult> {
  try {
    const out = await api.login<LoginOut>({ email, password });
    if (out.mfa_required) {
      mfaTicket = out.mfa_ticket ?? null;
      return "mfa";
    }
    markSignedIn();
    return "ok";
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    if (e.isNetwork) return "offline";
    if (e.code === "ACCOUNT_LOCKED") return "locked";
    if (e.code === "ACCOUNT_DISABLED") return "deactivated";
    if (e.code === "EMAIL_NOT_VERIFIED") return "unverified";
    if (e.code === "INVALID_CREDENTIALS") return "wrong";
    throw e;
  }
}

/** Role and data scope the UI uses, derived from what the backend says the user may reach. */
export function accessFromMe(me: Me): { role: Role; scope: Scope } {
  if (me.scope.all) return { role: "admin", scope: { kind: "company" } };
  if (me.scope.branch_ids?.length) return { role: "branch", scope: { kind: "branch", id: me.scope.branch_ids[0] } };
  return { role: "site", scope: { kind: "site", id: me.scope.site_ids?.[0] } };
}

/** Fetch `/me` and apply it to the stores. */
export async function loadMe(): Promise<Me> {
  const me = await api.get<Me>("/me");
  useAuth.getState().setMe(me);
  if (me.company_id) {
    const { role, scope } = accessFromMe(me);
    useSession.getState().hydrate(role, scope);
    installOrgRemotes();
    clearDemoData();
    await loadOrg().catch(() => undefined);
    installScheduleRemote();
    if (me.permissions.includes("schedules.view")) await loadSchedule().catch(() => undefined);
    installLeaveRemote();
    await loadLeaveTypes().catch(() => undefined);
    if (me.permissions.includes("leave.view")) await loadLeave().catch(() => undefined);
    installSettingsRemote();
    await loadSettings().catch(() => undefined);
    if (me.permissions.includes("billing.manage")) await loadBilling().catch(() => undefined);
    hydrateProfile();
    void loadSessions().catch(() => undefined);
    installReportsRemote();
    if (me.permissions.includes("reports.view")) await loadSavedReports().catch(() => undefined);
    installUsersRemote();
    if (me.permissions.includes("users.manage") || me.permissions.includes("roles.manage")) await loadUsers().catch(() => undefined);
  }
  return me;
}

/** On page load: recover the session from the refresh cookie, then read `/me`. False when signed out. */
export async function bootstrap(): Promise<boolean> {
  if (useAuth.getState().me) return true;
  if (!api.isAuthenticated && !(await api.restoreSession())) return false;
  try {
    await loadMe();
    return true;
  } catch {
    return false;
  }
}

/** Pick a company: the backend issues a token scoped to it. */
export async function selectCompany(companyId: string): Promise<void> {
  const out = await api.post<{ tokens: { access_token: string } }>("/auth/select-company", { company_id: companyId });
  api.setAccessToken(out.tokens.access_token);
  markSignedIn();
  await loadMe();
}

export async function signOut(): Promise<void> {
  try {
    await api.logout();
  } catch {
    // the local session ends either way
  }
  useAuth.getState().setMe(null);
  markSignedOut();
}

/** Second sign-in step: the code from the authenticator app (or a backup code). */
export async function verifyMfa(code: string, trustDevice: boolean): Promise<"ok" | "wrong" | "expired"> {
  if (!mfaTicket) return "expired";
  try {
    const out = await api.post<{ tokens?: { access_token: string } }>("/auth/mfa/verify", { mfa_ticket: mfaTicket, code, trust_device: trustDevice }, { public: true });
    if (!out.tokens) return "wrong";
    api.setAccessToken(out.tokens.access_token);
    mfaTicket = null;
    markSignedIn();
    return "ok";
  } catch (e) {
    if (e instanceof ApiError && e.code === "MFA_INVALID") return "wrong";
    if (e instanceof ApiError && e.status === 401) return "expired";
    throw e;
  }
}

/** Email a password-reset link. The server answers the same whether or not the address exists. */
export async function requestPasswordReset(email: string): Promise<void> {
  await api.post("/auth/password/forgot", { email }, { public: true });
}

export async function resetPassword(token: string, password: string): Promise<"ok" | "invalid"> {
  try {
    await api.post("/auth/password/reset", { token, password }, { public: true });
    return "ok";
  } catch (e) {
    if (e instanceof ApiError && e.code === "INVALID_TOKEN") return "invalid";
    throw e;
  }
}

export interface InvitePreview {
  company: string | null;
  invited_by: string | null;
  role: string | null;
  email: string | null;
  expired: boolean;
}

/** What an invitation link is for, or null when the link is unknown or already used. */
export async function previewInvitation(token: string): Promise<InvitePreview | null> {
  try {
    return await api.get<InvitePreview>(`/invitations/${encodeURIComponent(token)}`, { public: true });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

/** Accept an invitation: sets the password and signs the person in. Resolves "expired" when the link ran out. */
export async function acceptInvitation(token: string, password: string, fullName: string): Promise<"ok" | "expired" | "invalid"> {
  try {
    const out = await api.post<{ access_token: string }>(`/invitations/${encodeURIComponent(token)}/accept`, { password, full_name: fullName || null }, { public: true });
    api.setAccessToken(out.access_token);
    markSignedIn();
    return "ok";
  } catch (e) {
    if (e instanceof ApiError && e.code === "INVITE_EXPIRED") return "expired";
    if (e instanceof ApiError && e.code === "INVITE_INVALID") return "invalid";
    throw e;
  }
}
