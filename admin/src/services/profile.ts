import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { useProfile, type PersonalEvent, type Session } from "@/store/profile";

interface ApiSession {
  id: string;
  user_agent: string | null;
  ip: string | null;
  last_used_at: string | null;
  created_at: string;
  current: boolean;
}

const EVENTS: PersonalEvent[] = ["fraud", "noshow", "miss", "lvnew", "lvdec", "unc"];

/** A readable device from a user agent: "Chrome · macOS". */
function deviceOf(ua: string | null): string {
  if (!ua) return "—";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : /StaffSync|Expo|okhttp|CFNetwork/i.test(ua) ? "Mobile app" : "Browser";
  const os = /iPhone|iPad|iOS/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X|Macintosh/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} · ${os}` : browser;
}

function whenOf(iso: string | null): Session["when"] {
  const age = iso ? Date.now() - Date.parse(iso) : Number.POSITIVE_INFINITY;
  return age < 10 * 60_000 ? "now" : age < 24 * 3_600_000 ? "hours" : "days";
}

/** Take the personal settings from `/me`: language, two-factor state and notification choices. */
export function hydrateProfile(): void {
  const me = useAuth.getState().me;
  if (!me) return;
  const saved = me.notification_prefs ?? {};
  useProfile.setState((s) => ({
    twoFactor: me.totp_enabled,
    details: { ...s.details, lang: me.locale === "fr" ? "fr" : "en", phone: me.phone ?? s.details.phone },
    notif: Object.fromEntries(EVENTS.map((id) => [id, (saved[id] as [boolean, boolean, boolean] | undefined) ?? s.notif[id]])) as typeof s.notif,
  }));
}

export async function loadSessions(): Promise<void> {
  const rows = await api.get<ApiSession[]>("/me/sessions");
  useProfile.setState({ sessions: rows.map((r) => ({ id: r.id, device: deviceOf(r.user_agent), place: r.ip ?? "—", when: whenOf(r.last_used_at ?? r.created_at), current: r.current })) });
}

/** Save the name and language (the server has no field for email, phone or time zone here). */
export async function saveDetails(p: { name: string; lang: "en" | "fr" }): Promise<void> {
  await api.patch("/me", { full_name: p.name, locale: p.lang });
  const me = useAuth.getState().me;
  if (me) useAuth.getState().setMe({ ...me, full_name: p.name, locale: p.lang });
}

/** Flip one notification channel for the signed-in person and save all choices. */
export async function saveNotifications(): Promise<void> {
  await api.patch("/me", { notification_prefs: useProfile.getState().notif });
}

/** Change the password. Resolves `"wrong"` when the current password is not accepted. */
export async function changePassword(current: string, next: string): Promise<"ok" | "wrong"> {
  try {
    await api.post("/me/password", { current_password: current, new_password: next });
    return "ok";
  } catch (e) {
    if (e instanceof ApiError && e.code === "INVALID_CREDENTIALS") return "wrong";
    throw e;
  }
}

export const startTwoFactor = () => api.post<{ secret: string; otpauth_uri: string }>("/me/mfa/setup");

/** Confirm the first code from the authenticator app; resolves with the one-time backup codes, or null when the code is wrong. */
export async function enableTwoFactor(code: string): Promise<string[] | null> {
  try {
    const out = await api.post<{ backup_codes: string[] }>("/me/mfa/enable", { code });
    const me = useAuth.getState().me;
    if (me) useAuth.getState().setMe({ ...me, totp_enabled: true });
    useProfile.setState({ twoFactor: true });
    return out.backup_codes;
  } catch (e) {
    if (e instanceof ApiError && (e.code === "MFA_INVALID" || e.status === 400)) return null;
    throw e;
  }
}

/** Turn two-factor off. Resolves false when the password is wrong. */
export async function disableTwoFactor(password: string): Promise<boolean> {
  try {
    await api.delete("/me/mfa", { data: { password } });
    const me = useAuth.getState().me;
    if (me) useAuth.getState().setMe({ ...me, totp_enabled: false });
    useProfile.setState({ twoFactor: false });
    return true;
  } catch (e) {
    if (e instanceof ApiError && (e.code === "INVALID_CREDENTIALS" || e.status === 403)) return false;
    throw e;
  }
}

export async function revokeSession(id: string): Promise<void> {
  await api.delete(`/me/sessions/${id}`);
  await loadSessions();
}

export async function revokeOtherSessions(): Promise<void> {
  const others = useProfile.getState().sessions.filter((s) => !s.current);
  await Promise.all(others.map((s) => api.delete(`/me/sessions/${s.id}`)));
  await loadSessions();
}
