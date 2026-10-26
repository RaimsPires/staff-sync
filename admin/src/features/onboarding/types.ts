import type { LatLng } from "@/types/domain";
import type { BillingCycle, PlanId } from "@/types/plans";

export type TeamRole = "employee" | "site" | "branch" | "admin";
export type TeamMode = "manual" | "csv";

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
  billing: BillingCycle;
  plan: PlanId | "";
}

/** Field name (or `p<index>` for a team member) mapped to a key under `Onboarding.errors`. */
export type FieldErrors = Record<string, string>;
