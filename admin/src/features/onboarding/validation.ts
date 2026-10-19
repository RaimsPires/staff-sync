import { passwordScore } from "@/lib/password";
import { FREE_EMAIL } from "./constants";
import type { FieldErrors, OnboardingForm, Person } from "./types";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export const toMinutes = (s: string): number => {
  const [h = 0, m = 0] = (s || "0:0").split(":").map(Number);
  return h * 60 + m;
};

export const formatMinutes = (m: number): string =>
  `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Returns an error key for a team member, or null when the row is empty or valid. */
export function personError(p: Person): { field: "name" | "contact"; key: string } | null {
  const contact = p.contact.trim();
  if (!p.name.trim() && !contact) return null;
  if (!p.name.trim()) return { field: "name", key: "personName" };
  if (!contact) return { field: "contact", key: "personContact" };
  const valid = contact.includes("@") ? EMAIL_RE.test(contact) : contact.replace(/\D/g, "").length >= 8;
  return valid ? null : { field: "contact", key: "personInvalid" };
}

/** Validates one wizard step. Values are keys under `Onboarding.errors`. */
export function validateStep(step: number, f: OnboardingForm, code: string[]): FieldErrors {
  const e: FieldErrors = {};
  switch (step) {
    case 1:
      if (!f.name.trim()) e.name = "nameRequired";
      else if (f.name.trim().split(/\s+/).length < 2) e.name = "nameFull";
      if (!f.email.trim()) e.email = "emailRequired";
      else if (!EMAIL_RE.test(f.email)) e.email = "emailInvalid";
      else if (FREE_EMAIL.test(f.email)) e.email = "emailPersonal";
      if (!f.password) e.password = "passwordRequired";
      else if (passwordScore(f.password) < 2) e.password = "passwordWeak";
      if (f.phone.replace(/\D/g, "").length < 8) e.phone = "phoneInvalid";
      if (!f.terms) e.terms = "termsRequired";
      break;
    case 2: {
      const c = code.join("");
      if (c.length < 6) e.code = "codeIncomplete";
      else if (c === "000000") e.code = "codeWrong";
      break;
    }
    case 3:
      if (!f.company.trim()) e.company = "companyRequired";
      if (!f.industry) e.industry = "industryRequired";
      if (!f.size) e.size = "sizeRequired";
      break;
    case 4:
      if (!f.branch.trim()) e.branch = "branchRequired";
      if (!f.street.trim()) e.street = "streetRequired";
      if (!/^\d{4,5}$/.test(f.zip.trim())) e.zip = "zipInvalid";
      if (!f.city.trim()) e.city = "cityRequired";
      break;
    case 5:
      if (!f.siteName.trim()) e.siteName = "siteNameRequired";
      if (!f.siteAddress.trim()) e.siteAddress = "siteAddressRequired";
      break;
    case 6:
      if (!f.days.some(Boolean)) e.days = "daysRequired";
      if (toMinutes(f.end) <= toMinutes(f.start)) e.end = "endBeforeStart";
      break;
    case 7:
      if (f.mode === "manual") {
        f.people.forEach((p, i) => {
          const pe = personError(p);
          if (pe) {
            e[`p${i}`] = pe.key;
            e[`p${i}:field`] = pe.field;
          }
        });
      }
      break;
    case 8:
      if (!f.plan) e.plan = "planRequired";
      break;
  }
  return e;
}

/** Number of invalid fields (a team row counts once, however many keys describe it). */
export const errorCount = (e: FieldErrors): number => Object.keys(e).filter((k) => !k.endsWith(":field")).length;
