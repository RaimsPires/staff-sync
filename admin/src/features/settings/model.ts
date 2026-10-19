import { DATE_FORMATS, TIMEZONES } from "@/data/settings";
import type { SettingsValues } from "@/types/settings";

export type ScalarKey = Exclude<keyof SettingsValues, "notif">;
export type SectionId = "company" | "attendance" | "leave" | "notif" | "integ" | "billing" | "danger";
export const SECTIONS: SectionId[] = ["company", "attendance", "leave", "notif", "integ", "billing", "danger"];

export interface Option { value: string; /** Literal label; otherwise the option is translated. */ label?: string }

export type FieldSpec =
  | { key: ScalarKey; kind: "text"; required?: boolean; mail?: boolean; url?: boolean }
  | { key: ScalarKey; kind: "num"; min: number; max: number; unit: "min" | "m" | "hours" }
  | { key: ScalarKey; kind: "time" }
  | { key: ScalarKey; kind: "sel"; options: Option[] }
  | { key: ScalarKey; kind: "tog" }
  | { key: "logo"; kind: "logo" };

export interface Group { id: string; fields: FieldSpec[] }

const opts = (...values: string[]): Option[] => values.map((value) => ({ value }));
const holidays = opts("fr", "alsace", "be", "custom");

export const GROUPS: Record<"company" | "attendance" | "leave" | "payroll", Group[]> = {
  company: [{
    id: "profile", fields: [
      { key: "logo", kind: "logo" },
      { key: "name", kind: "text", required: true },
      { key: "addr", kind: "text", required: true },
      { key: "tz", kind: "sel", options: TIMEZONES },
      { key: "lang", kind: "sel", options: [{ value: "en", label: "English" }, { value: "fr", label: "Français" }] },
      { key: "dfmt", kind: "sel", options: DATE_FORMATS },
      { key: "tfmt", kind: "sel", options: opts("24h", "12h") },
      { key: "wk", kind: "sel", options: opts("monday", "sunday", "saturday") },
    ],
  }],
  attendance: [
    { id: "punctuality", fields: [{ key: "grace", kind: "num", min: 0, max: 120, unit: "min" }, { key: "early", kind: "num", min: 0, max: 120, unit: "min" }] },
    { id: "checkout", fields: [{ key: "autoOut", kind: "time" }, { key: "miss", kind: "sel", options: opts("flag", "auto", "ignore") }, { key: "ot", kind: "sel", options: opts("daily8", "weekly40", "approval") }, { key: "otApp", kind: "tog" }] },
    { id: "verification", fields: [{ key: "gps", kind: "num", min: 5, max: 500, unit: "m" }, { key: "mock", kind: "tog" }, { key: "selfie", kind: "tog" }, { key: "qr", kind: "tog" }, { key: "offline", kind: "tog" }, { key: "sync", kind: "num", min: 1, max: 168, unit: "hours" }] },
  ],
  leave: [
    { id: "workflow", fields: [{ key: "wf", kind: "sel", options: opts("one", "two") }] },
    { id: "holidays", fields: [{ key: "hLyon", kind: "sel", options: holidays }, { key: "hParis", kind: "sel", options: holidays }, { key: "hMrs", kind: "sel", options: holidays }] },
  ],
  payroll: [{ id: "payroll", fields: [{ key: "pay", kind: "sel", options: [...opts("silae", "payfit", "adp"), { value: "csv" }, { value: "xlsx" }] }, { key: "paySplit", kind: "tog" }] }],
};

export const SSO_OPTIONS: Option[] = [{ value: "none" }, { value: "google" }, { value: "entra" }, { value: "saml" }];

export const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
