import { useUpdateRequired } from '@/core/update-required';
import Constants from 'expo-constants';

import { SecureKeys, secureStorage } from '@/core/security/secure-storage';
import { getOrCreateDeviceId } from '@/core/security/device-id';

import { AppError } from '../repositories/types';
import { camelize, snakeize } from './case';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1').replace(/\/$/, '');
export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === '1';

/** A non-2xx answer (RFC 9457 problem+json) or a network failure (`status` 0). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly extra: Record<string, unknown> = {},
  ) {
    super(message);
  }
  get isNetwork() {
    return this.status === 0;
  }
}

type Tokens = { a: string; r: string };
let tokens: Tokens | null | undefined;
let refreshing: Promise<boolean> | null = null;
/** Set by the session store so a dead refresh token sends the user back to sign-in. */
let onSignedOut: () => void = () => undefined;
export const setOnSignedOut = (fn: () => void) => {
  onSignedOut = fn;
};

async function loadTokens(): Promise<Tokens | null> {
  if (tokens !== undefined) return tokens;
  const raw = await secureStorage.get(SecureKeys.session);
  tokens = raw ? (JSON.parse(raw) as Tokens) : null;
  return tokens;
}

export async function storeTokens(next: { accessToken: string; refreshToken: string } | null) {
  tokens = next ? { a: next.accessToken, r: next.refreshToken } : null;
  if (tokens) await secureStorage.set(SecureKeys.session, JSON.stringify(tokens));
  else await secureStorage.remove(SecureKeys.session);
}

async function refresh(): Promise<boolean> {
  refreshing ??= (async () => {
    const current = await loadTokens();
    if (!current) return false;
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-device-id': await getOrCreateDeviceId() },
        body: JSON.stringify({ refresh_token: current.r }),
      });
      if (!res.ok) throw new Error('refresh failed');
      const pair = (await res.json()) as { access_token: string; refresh_token: string };
      await storeTokens({ accessToken: pair.access_token, refreshToken: pair.refresh_token });
      return true;
    } catch {
      await storeTokens(null);
      onSignedOut();
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export type RequestOptions = {
  query?: Record<string, string | number | boolean | undefined>;
  /** App-shaped (camelCase) body; sent as snake_case. */
  body?: unknown;
  /** Body already in API shape, sent untouched. */
  rawBody?: unknown;
  /** No bearer token (login, OTP). */
  public?: boolean;
  headers?: Record<string, string>;
  /** Return the response as-is instead of camelizing (presigned uploads). */
  raw?: boolean;
};

async function send(method: string, path: string, opts: RequestOptions): Promise<Response> {
  const qs = opts.query
    ? '?' + Object.entries(opts.query).filter(([, v]) => v !== undefined).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
    : '';
  const headers: Record<string, string> = {
    accept: 'application/json',
    'x-device-id': await getOrCreateDeviceId(),
    'x-app-version': Constants.expoConfig?.version ?? '1.0.0',
    ...opts.headers,
  };
  const body = opts.rawBody ?? (opts.body === undefined ? undefined : snakeize(opts.body));
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (!opts.public) {
    const t = await loadTokens();
    if (t) headers.authorization = `Bearer ${t.a}`;
  }
  try {
    return await fetch(`${API_URL}${path}${qs}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Network request failed');
  }
}

async function toError(res: Response): Promise<ApiError> {
  const problem = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const { code, detail, title, type: _t, status: _s, request_id: _r, ...extra } = problem;
  return new ApiError(res.status, String(code ?? 'UNKNOWN'), String(detail ?? title ?? res.statusText), camelize(extra));
}

export async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  let res = await send(method, path, opts);
  if (res.status === 401 && !opts.public && (await refresh())) res = await send(method, path, opts);
  if (res.status === 426) useUpdateRequired.getState().flag();
  if (!res.ok) throw await toError(res);
  if (res.status === 204) return undefined as T;
  const json: unknown = await res.json();
  return (opts.raw ? json : camelize(json)) as T;
}

export const http = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts),
  post: <T>(path: string, opts?: RequestOptions) => request<T>('POST', path, opts),
  put: <T>(path: string, opts?: RequestOptions) => request<T>('PUT', path, opts),
  patch: <T>(path: string, opts?: RequestOptions) => request<T>('PATCH', path, opts),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
};

/** Translate an API failure into the domain error the screens already understand. */
export function toAppError(e: unknown): unknown {
  if (!(e instanceof ApiError)) return e;
  const known = ['ACCOUNT_NOT_FOUND', 'ACCOUNT_DISABLED', 'OTP_INVALID', 'OTP_EXPIRED', 'OTP_LOCKED', 'INVALID_CREDENTIALS', 'PASSWORD_REQUIRED', 'ACCOUNT_LOCKED', 'DEVICE_BOUND', 'PIN_INVALID', 'PIN_LOCKED', 'NOT_FOUND', 'CONFLICT', 'VALIDATION', 'UNSCHEDULED'] as const;
  const code = known.find((k) => k === e.code);
  if (!code) return e;
  const attemptsLeft = typeof e.extra.attemptsLeft === 'number' ? e.extra.attemptsLeft : undefined;
  return new AppError(code, attemptsLeft === undefined ? undefined : { attemptsLeft });
}

/** Wrap a call so failures surface as `AppError` where one exists. */
export async function guarded<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    throw toAppError(e);
  }
}
