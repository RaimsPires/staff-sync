import type { LatLng, OnboardingForm } from "./types";

export const TOTAL_STEPS = 8;
/** The confirmation screen after the last step. */
export const DONE_STEP = TOTAL_STEPS + 1;

export const SIZES = ["1–25", "26–50", "51–250", "251–1000", "1000+"] as const;

export const INDUSTRIES = [
  "construction",
  "logistics",
  "cleaning",
  "security",
  "retail",
  "manufacturing",
  "healthcare",
  "other",
] as const;

export const DIAL_CODES = [
  { value: "+33", label: "🇫🇷 +33" },
  { value: "+32", label: "🇧🇪 +32" },
  { value: "+41", label: "🇨🇭 +41" },
  { value: "+1", label: "🇨🇦 +1" },
  { value: "+44", label: "🇬🇧 +44" },
] as const;

/** Country key (also the i18n key under `Onboarding.company.countries`) mapped to its default time zone. */
export const COUNTRY_TIMEZONES: Record<string, string> = {
  france: "Europe/Paris",
  belgium: "Europe/Brussels",
  switzerland: "Europe/Zurich",
  canada: "America/Montreal",
  uk: "Europe/London",
};
export const TIMEZONES = Object.values(COUNTRY_TIMEZONES);

export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

/** Lyon, Part-Dieu: the map opens here until an address is chosen. */
export const DEFAULT_PIN: LatLng = [45.7605, 4.859];

export const INITIAL_FORM: OnboardingForm = {
  name: "",
  email: "",
  password: "",
  dial: "+33",
  phone: "",
  terms: false,
  company: "",
  logo: "",
  industry: "",
  size: "",
  country: "france",
  timezone: "Europe/Paris",
  language: "fr",
  branch: "",
  street: "",
  zip: "",
  city: "",
  siteName: "",
  siteAddress: "",
  pin: DEFAULT_PIN,
  radius: 150,
  days: [true, true, true, true, true, false, false],
  start: "08:00",
  end: "17:00",
  grace: 10,
  mode: "manual",
  people: [
    { name: "", contact: "", role: "site" },
    { name: "", contact: "", role: "employee" },
  ],
  csvName: "",
  csvRows: [],
  csvCount: 0,
  billing: "yearly",
  plan: "",
};
