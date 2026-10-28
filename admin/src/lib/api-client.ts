import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";

/** Machine-readable codes the client raises itself (the backend's own `code` values pass through unchanged). */
export type ClientErrorCode = "NETWORK" | "TIMEOUT" | "CANCELED" | "UNKNOWN";

export interface FieldError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

/**
 * The one error type the app sees. `message` is already user-facing and in the request's language: the backend
 * localizes problem+json `detail`, and the few errors raised in the browser use the table below.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly requestId?: string,
    readonly fields: FieldError[] = [],
    readonly extra: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isNetwork() {
    return this.code === "NETWORK" || this.code === "TIMEOUT";
  }
  get isUnauthenticated() {
    return this.status === 401;
  }
  /** Seconds the server asked us to wait (rate limits, OTP resend). */
  get retryAfter(): number | undefined {
    const v = this.extra.retry_after;
    return typeof v === "number" ? v : undefined;
  }
  /** First validation message for a field, e.g. `error.fieldMessage("email")`. */
  fieldMessage(name: string): string | undefined {
    return this.fields.find((f) => f.loc.at(-1) === name)?.msg;
  }
}

const CLIENT_MESSAGES: Record<"en" | "fr", Record<ClientErrorCode, string>> = {
  en: {
    NETWORK: "We can't reach the server. Check your connection and try again.",
    TIMEOUT: "The server took too long to respond. Please try again.",
    CANCELED: "The request was canceled.",
    UNKNOWN: "Something went wrong. Please try again.",
  },
  fr: {
    NETWORK: "Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.",
    TIMEOUT: "Le serveur met trop de temps à répondre. Veuillez réessayer.",
    CANCELED: "La requête a été annulée.",
    UNKNOWN: "Un problème est survenu. Veuillez réessayer.",
  },
};

export interface RetryOptions {
  /** Extra attempts after the first one. */
  retries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

/** Per-request switches, passed through axios' `config`. */
export interface RequestOptions extends AxiosRequestConfig {
  /** `false` disables retries; a number overrides the attempt count; `true` allows retrying a non-idempotent POST/PATCH. */
  retry?: boolean | number;
  /** Skip the Authorization header and the refresh-on-401 flow (login, forgot password...). */
  public?: boolean;
  /** `true` never shows the full-screen waiting indicator for this request; `false` forces it. By default saves show it and reads do not. */
  silent?: boolean;
}

declare module "axios" {
  interface AxiosRequestConfig {
    retry?: boolean | number;
    public?: boolean;
    silent?: boolean;
    _attempt?: number;
    _refreshed?: boolean;
  }
}

export interface ApiClientConfig {
  baseURL: string;
  timeoutMs?: number;
  retry?: Partial<RetryOptions>;
  /** Current UI language, sent as Accept-Language so the backend answers in it. */
  getLocale?: () => string | undefined;
  /** Called once when the session cannot be recovered (refresh failed): send the user to sign-in. */
  onSignedOut?: () => void;
  /** Called for every failed request after normalization (global toasts, logging). Not called for canceled ones. */
  onError?: (error: ApiError, request: AxiosRequestConfig) => void;
  /** A save (anything but a read) started or ended and the person should wait for it: drives the full-screen indicator. */
  onActivity?: (state: "start" | "end") => void;
  /** Called for every successful response. */
  onSuccess?: (response: { status: number; data: unknown }, request: AxiosRequestConfig) => void;
  /** Test seam / custom transport. */
  axiosInstance?: AxiosInstance;
}

const IDEMPOTENT = new Set(["get", "head", "options", "put", "delete"]);
const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);
/** 401 codes that mean "wrong input", not "expired session": never trigger a refresh. */
const NO_REFRESH_CODES = new Set(["INVALID_CREDENTIALS", "ACCOUNT_LOCKED", "MFA_INVALID", "OTP_INVALID", "REFRESH_REUSE", "INVALID_REFRESH", "ACCOUNT_DISABLED"]);
const REFRESH_PATH = "/auth/refresh";
/**
 * Requests that must not cover the screen: background work, live previews while editing, chat (it shows its own sending state)
 * and sign-in style forms that already have a spinner on their button.
 */
const QUIET = /^\/(auth\/(refresh|login|mfa\/verify|logout|password\/(forgot|reset)|verify-email|signup)|invitations\/|me\/password\/initial|ws\/ticket|chat\/|uploads\/chat-attachment|devices\/|me\/notifications|reports\/preview|roles\/preview|schedules\/validate|leave\/requests\/preview|search)/;
const CSRF_COOKIE = "ss_csrf";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined;
}

function requestId(): string {
  return globalThis.crypto?.randomUUID?.().replaceAll("-", "") ?? Math.random().toString(16).slice(2).padEnd(32, "0");
}

/**
 * HTTP client for the StaffSync API: bearer auth with single-flight token refresh, retry with backoff,
 * problem+json errors normalized to `ApiError`, locale header, request ids, and global success/error hooks.
 *
 * The access token lives in memory only. The refresh token is an httpOnly cookie the backend sets, so a page
 * reload recovers the session through `restoreSession()`.
 */
export class ApiClient {
  private readonly http: AxiosInstance;
  private readonly retryOpts: RetryOptions;
  private accessToken: string | null = null;
  private refreshing: Promise<string | null> | null = null;

  constructor(private readonly config: ApiClientConfig) {
    this.retryOpts = { retries: 2, baseDelayMs: 400, maxDelayMs: 5000, ...config.retry };
    this.http = config.axiosInstance ?? axios.create();
    this.http.defaults.baseURL = config.baseURL;
    this.http.defaults.timeout = config.timeoutMs ?? 15000;
    this.http.defaults.withCredentials = true;
    this.http.interceptors.request.use((req) => this.decorate(req));
    this.install();
  }

  // --- session ----------------------------------------------------------------------------------

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }
  get isAuthenticated() {
    return this.accessToken !== null;
  }

  /** Use the refresh cookie to get an access token, e.g. on app start. Resolves false when there is no session. */
  async restoreSession(): Promise<boolean> {
    return (await this.refresh()) !== null;
  }

  /** Sign in; the backend sets the refresh cookie and returns the access token. */
  async login<T extends { tokens?: { access_token: string } }>(body: { email: string; password: string; remember_me?: boolean }): Promise<T> {
    const out = await this.post<T>("/auth/login", body, { public: true });
    if (out.tokens?.access_token) this.accessToken = out.tokens.access_token;
    return out;
  }

  async logout(): Promise<void> {
    try {
      await this.post("/auth/logout", undefined, { retry: false });
    } finally {
      this.accessToken = null;
    }
  }

  // --- requests ---------------------------------------------------------------------------------

  get<T>(url: string, options?: RequestOptions) {
    return this.request<T>({ ...options, method: "GET", url });
  }
  post<T>(url: string, data?: unknown, options?: RequestOptions) {
    return this.request<T>({ ...options, method: "POST", url, data });
  }
  put<T>(url: string, data?: unknown, options?: RequestOptions) {
    return this.request<T>({ ...options, method: "PUT", url, data });
  }
  patch<T>(url: string, data?: unknown, options?: RequestOptions) {
    return this.request<T>({ ...options, method: "PATCH", url, data });
  }
  delete<T>(url: string, options?: RequestOptions) {
    return this.request<T>({ ...options, method: "DELETE", url });
  }

  /** Resolves with the response body; rejects with `ApiError`. */
  async request<T>(options: RequestOptions): Promise<T> {
    const waits = this.shouldShowActivity(options);
    if (waits) this.config.onActivity?.("start");
    try {
      const res = await this.http.request<T>(options);
      this.config.onSuccess?.({ status: res.status, data: res.data }, options);
      return res.data;
    } catch (raw) {
      const error = this.toApiError(raw);
      if (error.code !== "CANCELED") this.config.onError?.(error, options);
      throw error;
    } finally {
      if (waits) this.config.onActivity?.("end");
    }
  }

  /** Saves, deletions and sends make the person wait; reads, background refreshes and live previews do not. */
  private shouldShowActivity(options: RequestOptions): boolean {
    if (options.silent !== undefined) return !options.silent;
    if (!options.method || ["get", "head", "options"].includes(options.method.toLowerCase())) return false;
    return !QUIET.test(options.url ?? "");
  }

  // --- internals --------------------------------------------------------------------------------

  private decorate(req: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    req.headers.set("X-Request-Id", req.headers.get("X-Request-Id") ?? requestId());
    const locale = this.config.getLocale?.();
    if (locale) req.headers.set("Accept-Language", locale);
    if (this.accessToken && !req.public) req.headers.set("Authorization", `Bearer ${this.accessToken}`);
    return req;
  }

  private async refresh(): Promise<string | null> {
    // One refresh at a time: parallel 401s share the same attempt (the backend rotates tokens, so two would collide).
    this.refreshing ??= (async () => {
      try {
        const res = await this.http.post<{ access_token: string }>(REFRESH_PATH, undefined, {
          public: true,
          headers: { "X-CSRF-Token": readCookie(CSRF_COOKIE) ?? "" },
        });
        this.accessToken = res.data.access_token;
        return this.accessToken;
      } catch {
        this.accessToken = null;
        return null;
      } finally {
        this.refreshing = null;
      }
    })();
    return this.refreshing;
  }

  private delayFor(attempt: number, error: ApiError): number {
    const asked = error.retryAfter;
    if (asked !== undefined) return Math.min(asked * 1000, 30000);
    const exp = Math.min(this.retryOpts.baseDelayMs * 2 ** attempt, this.retryOpts.maxDelayMs);
    return exp / 2 + Math.random() * (exp / 2); // jitter
  }

  private canRetry(config: AxiosRequestConfig, error: ApiError, attempt: number): boolean {
    const limit = config.retry === false ? 0 : typeof config.retry === "number" ? config.retry : this.retryOpts.retries;
    if (attempt >= limit || error.code === "CANCELED") return false;
    const transient = error.isNetwork || RETRYABLE_STATUS.has(error.status);
    if (!transient) return false;
    const safe = IDEMPOTENT.has((config.method ?? "get").toLowerCase());
    // A non-idempotent request that timed out may have been applied; only retry it when the caller opted in.
    return safe || config.retry === true || typeof config.retry === "number";
  }

  /** Wire up response handling on the shared axios instance: refresh-on-401, then retry with backoff. */
  private install() {
    this.http.interceptors.response.use(undefined, async (raw: unknown) => {
      if (!axios.isAxiosError(raw) || !raw.config) throw raw;
      const config = raw.config;
      const error = this.toApiError(raw);

      if (error.status === 401 && !config.public && !config._refreshed && !NO_REFRESH_CODES.has(error.code)) {
        config._refreshed = true;
        const token = await this.refresh();
        if (token) return this.http.request(config);
        this.config.onSignedOut?.();
        throw raw;
      }
      if (error.code === "REFRESH_REUSE" || error.code === "INVALID_REFRESH") {
        this.accessToken = null;
        this.config.onSignedOut?.();
      }

      const attempt = config._attempt ?? 0;
      if (this.canRetry(config, error, attempt)) {
        config._attempt = attempt + 1;
        await sleep(this.delayFor(attempt, error));
        return this.http.request(config);
      }
      throw raw;
    });
  }

  private toApiError(raw: unknown): ApiError {
    if (raw instanceof ApiError) return raw;
    const lang = this.config.getLocale?.()?.startsWith("fr") ? "fr" : "en";
    const own = (code: ClientErrorCode, status = 0) => new ApiError(status, code, CLIENT_MESSAGES[lang][code]);

    if (!axios.isAxiosError(raw)) return own("UNKNOWN");
    const err = raw as AxiosError<Record<string, unknown>>;
    if (axios.isCancel(raw)) return own("CANCELED");
    if (!err.response) return err.code === "ECONNABORTED" || err.code === "ETIMEDOUT" ? own("TIMEOUT") : own("NETWORK");

    const { status, data, headers } = err.response;
    const body = data && typeof data === "object" ? data : {};
    const { code, detail, request_id, errors, ...extra } = body as Record<string, unknown>;
    for (const k of ["type", "title", "status"]) delete extra[k]; // problem+json boilerplate; the rest is error-specific context
    const retryHeader = Number(headers?.["retry-after"]);
    if (extra.retry_after === undefined && Number.isFinite(retryHeader)) extra.retry_after = retryHeader;
    return new ApiError(
      status,
      typeof code === "string" ? code : "UNKNOWN",
      typeof detail === "string" && detail ? detail : CLIENT_MESSAGES[lang].UNKNOWN,
      typeof request_id === "string" ? request_id : (headers?.["x-request-id"] as string | undefined),
      Array.isArray(errors) ? (errors as FieldError[]) : [],
      extra,
    );
  }
}
