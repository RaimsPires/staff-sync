const toCamel = (s: string) => s.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

const isPlain = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && Object.getPrototypeOf(v) === Object.prototype;

function convert(value: unknown, key: (k: string) => string): unknown {
  if (Array.isArray(value)) return value.map((v) => convert(v, key));
  if (!isPlain(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [key(k), convert(v, key)]));
}

/** API (snake_case) -> app (camelCase). */
export const camelize = <T = unknown>(value: unknown): T => convert(value, toCamel) as T;
/** App (camelCase) -> API (snake_case). */
export const snakeize = <T = unknown>(value: unknown): T => convert(value, toSnake) as T;

/** `null` -> `undefined` (recursively): the app's types use optional fields, the API sends explicit nulls. */
export function stripNulls<T>(value: T): T {
  if (value === null) return undefined as T;
  if (Array.isArray(value)) return value.map(stripNulls) as T;
  if (isPlain(value)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, stripNulls(v)])) as T;
  return value;
}
