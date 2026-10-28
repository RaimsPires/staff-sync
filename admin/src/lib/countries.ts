import { getCountries, getCountryCallingCode, isValidPhoneNumber, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

export type { CountryCode };

export interface Country {
  code: CountryCode;
  /** International dialling code with the plus sign, e.g. "+237". */
  dial: string;
  /** Name in the interface language. */
  name: string;
  flag: string;
}

/** The launch markets, listed first when nothing has been typed in the search box. */
export const PINNED: readonly CountryCode[] = ["CM", "CI", "SN", "FR"];
export const FALLBACK_COUNTRY: CountryCode = "CM";

/** A flag emoji built from the two-letter country code (Windows shows the letters instead, which still reads fine). */
export const flagOf = (code: string): string => String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

/** Lower case without accents, for matching typed text against names. */
export const norm = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const cache = new Map<string, Country[]>();

/** Every supported country, A to Z in the interface language. */
export function listCountries(locale: string): Country[] {
  const hit = cache.get(locale);
  if (hit) return hit;
  const names = new Intl.DisplayNames([locale], { type: "region" });
  const all = getCountries()
    .map((code) => ({ code, dial: `+${getCountryCallingCode(code)}`, name: names.of(code) ?? code, flag: flagOf(code) }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
  cache.set(locale, all);
  return all;
}

/**
 * The list for a search box: with no text the launch markets come first; with text only countries whose name matches are
 * kept, names that begin with the text first, then names with a word that begins with it, then the rest.
 * Typing a dialling code such as "+237" also finds the country.
 */
export function searchCountries(all: Country[], query: string): Country[] {
  const raw = query.trim();
  if (!raw) {
    const pinned = PINNED.map((code) => all.find((c) => c.code === code)).filter((c): c is Country => !!c);
    return [...pinned, ...all.filter((c) => !PINNED.includes(c.code))];
  }
  if (raw.startsWith("+")) return all.filter((c) => c.dial.startsWith(raw.replace(/\s/g, "")));
  const q = norm(raw);
  const rank = (name: string): number => {
    const n = norm(name);
    if (n.startsWith(q)) return 0;
    if (n.split(/[\s'’-]+/).some((w) => w.startsWith(q))) return 1;
    return n.includes(q) ? 2 : 3;
  };
  return all
    .map((c) => ({ c, r: rank(c.name) }))
    .filter((x) => x.r < 3)
    .sort((a, b) => a.r - b.r)
    .map((x) => x.c);
}

/** Split an international number into its country and the local digits; unreadable text keeps the fallback country. */
export function splitPhone(value: string, fallback: CountryCode): { country: CountryCode; national: string } {
  const parsed = value.trim() ? parsePhoneNumberFromString(value) : undefined;
  if (parsed?.country) return { country: parsed.country, national: parsed.nationalNumber };
  return { country: fallback, national: value.replace(/\D/g, "") };
}

/** `+<dialling code><local digits>`, or "" when no digits were typed. */
export function toE164(country: CountryCode, nationalDigits: string): string {
  const digits = nationalDigits.replace(/\D/g, "").replace(/^0+/, "");
  return digits ? `+${getCountryCallingCode(country)}${digits}` : "";
}

export const isValidPhone = (value: string): boolean => isValidPhoneNumber(value);

/** The country most of the given numbers belong to, so a company's form starts on its own country. */
export function commonCountry(phones: string[]): CountryCode {
  const counts = new Map<CountryCode, number>();
  for (const p of phones) {
    const c = p && p !== "—" ? parsePhoneNumberFromString(p)?.country : undefined;
    if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? FALLBACK_COUNTRY;
}
