import { getLocales } from 'expo-localization';
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js/mobile';
import examples from 'libphonenumber-js/examples.mobile.json';

export type { CountryCode };

export type Country = { code: CountryCode; dial: string; name: string; flag: string };

/** Markets the product launches in; shown first in the picker. */
export const PINNED: readonly CountryCode[] = ['CI', 'CM', 'SN', 'FR'];
export const FALLBACK_COUNTRY: CountryCode = 'CI';

const flagOf = (code: string) => String.fromCodePoint(...[...code].map((c) => 127397 + c.charCodeAt(0)));

function regionName(code: string, lang: string): string {
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(code) ?? code;
  } catch {
    // Older JS engines have no Intl.DisplayNames; the region code is still usable.
    return code;
  }
}

const cache = new Map<string, Country[]>();

/** Every supported country with its calling code and a name in the app language, A–Z. */
export function listCountries(lang: string): Country[] {
  const hit = cache.get(lang);
  if (hit) return hit;
  const all = getCountries()
    .map((code) => ({ code, dial: `+${getCountryCallingCode(code)}`, name: regionName(code, lang), flag: flagOf(code) }))
    .sort((a, b) => a.name.localeCompare(b.name, lang));
  cache.set(lang, all);
  return all;
}

export const findCountry = (code: CountryCode, lang: string): Country =>
  listCountries(lang).find((c) => c.code === code) ?? listCountries(lang)[0];

/** The device region when we support it, otherwise Côte d'Ivoire. */
export function defaultCountry(): CountryCode {
  const region = getLocales()[0]?.regionCode?.toUpperCase();
  return region && getCountries().includes(region as CountryCode) ? (region as CountryCode) : FALLBACK_COUNTRY;
}

export type ParsedPhone = { e164: string; national: string };

/** Validates a number typed without its country code; trunk prefixes are handled per country. */
export function parseLocalPhone(input: string, country: CountryCode): ParsedPhone | undefined {
  const phone = parsePhoneNumberFromString(input, country);
  return phone?.isValid() ? { e164: phone.number, national: phone.nationalNumber } : undefined;
}

/** Formats while the user types, following the country's grouping ("07 12 34 56 78"). */
export const formatAsYouType = (input: string, country: CountryCode) => new AsYouType(country).input(input);

/** An example local number for the placeholder, e.g. "07 12 34 56 78". */
export function placeholderFor(country: CountryCode): string | undefined {
  return getExampleNumber(country, examples)?.formatNational();
}

/** Masks for display, keeping the first and last two digits: `+225 07 •• •• 78`. */
export function maskPhone(dial: string, national: string): string {
  const digits = national.replace(/\D/g, '');
  return `${dial} ${digits.slice(0, 2)} •• •• ${digits.slice(-2)}`;
}

/** Lower case without accents, for matching typed text against names. */
export const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Countries whose name contains `q` (already normalised), best matches first. */
export function searchByName(all: Country[], q: string): Country[] {
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
