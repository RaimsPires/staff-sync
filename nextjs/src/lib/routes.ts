export const ADMIN_PAGES = [
  'dashboard', 'live', 'attendance', 'alerts', 'employees', 'sites', 'schedules',
  'leave', 'reports', 'users', 'audit', 'settings', 'profile',
] as const;
export type AdminPage = (typeof ADMIN_PAGES)[number];
export type Role = 'admin' | 'branch' | 'site';

export const isAdminPage = (v: string): v is AdminPage => (ADMIN_PAGES as readonly string[]).includes(v);

const PUBLIC: Record<string, string> = {
  signin: '/sign-in',
  invite: '/invite',
  workspaces: '/workspaces',
  onboarding: '/onboarding',
};

export interface NavOpts { role?: Role; step?: number }

/** Maps the prototype's screen keys to real URLs. */
export function hrefFor(target: string, opts: NavOpts = {}): string {
  if (isAdminPage(target)) return `/admin/${target}`;
  const base = PUBLIC[target] ?? '/sign-in';
  return target === 'onboarding' && opts.step ? `${base}?step=${opts.step}` : base;
}

export const ROLE_KEY = 'staffsync-role';
