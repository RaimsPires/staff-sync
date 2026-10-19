import type { LatLng } from "@/types/domain";

export type StepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type TeamRole = "employee" | "site" | "branch" | "admin";
export type TeamMode = "manual" | "csv";
export type Billing = "monthly" | "yearly";
export type PlanId = "trial" | "starter" | "business" | "enterprise";

export interface Person {
  name: string;
  contact: string;
  role: TeamRole;
}

export interface CsvRow {
  a: string;
  b: string;
  c: string;
}

export type { LatLng };

export interface OnboardingForm {
  // 1. account
  name: string;
  email: string;
  password: string;
  dial: string;
  phone: string;
  terms: boolean;
  // 3. company
  company: string;
  logo: string;
  industry: string;
  size: string;
  country: string;
  timezone: string;
  language: "en" | "fr";
  // 4. branch
  branch: string;
  street: string;
  zip: string;
  city: string;
  // 5. site
  siteName: string;
  siteAddress: string;
  pin: LatLng;
  radius: number;
  // 6. hours
  days: boolean[];
  start: string;
  end: string;
  grace: number;
  // 7. team
  mode: TeamMode;
  people: Person[];
  csvName: string;
  csvRows: CsvRow[];
  csvCount: number;
  // 8. plan
  billing: Billing;
  plan: PlanId | "";
}

/** Field name (or `p<index>` for a team member) mapped to a key under `Onboarding.errors`. */
export type FieldErrors = Record<string, string>;
