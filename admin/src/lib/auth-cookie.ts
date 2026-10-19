/** Demo session marker read by `src/proxy.ts`. A real backend would issue an httpOnly token instead. */
export const AUTH_COOKIE = "ss_auth";

export function markSignedIn(): void {
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
}

export function markSignedOut(): void {
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
}
