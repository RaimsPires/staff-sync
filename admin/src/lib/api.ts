import { ApiClient } from "./api-client";
import { busyEnd, busyStart } from "@/store/busy";
import { markSignedOut } from "./auth-cookie";
import { LOCALE_COOKIE } from "@/i18n/config";

export { ApiClient, ApiError } from "./api-client";
export type { FieldError, RequestOptions } from "./api-client";

/** The UI language: the same cookie next-intl reads, so the backend answers in the language on screen. */
function currentLocale(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${LOCALE_COOKIE}=`));
  return hit?.split("=")[1] || document.documentElement.lang || undefined;
}

/**
 * Shared HTTP client for the StaffSync backend (API prefix `/api/v1`). Services call this once the API replaces
 * the mock data. The refresh cookie is read cross-origin in development, so keep the dashboard and API on the
 * same site (e.g. localhost:3000 and localhost:8000).
 */
export const api = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  getLocale: currentLocale,
  onActivity: (state) => (state === "start" ? busyStart() : busyEnd()),
  onSignedOut: () => {
    markSignedOut();
    if (typeof window !== "undefined") window.location.assign("/sign-in");
  },
});
