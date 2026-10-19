import { useTranslations } from "next-intl";
import { useOnboarding } from "./store";
import type { FieldErrors } from "./types";
import { errorCount, validateStep } from "./validation";

/** Translated validation messages for a step; empty until the user pressed Continue on it. */
export function useStepErrors(step: number) {
  const t = useTranslations("Onboarding.errors");
  const form = useOnboarding((s) => s.form);
  const code = useOnboarding((s) => s.code);
  const tried = useOnboarding((s) => !!s.tried[step]);
  const raw: FieldErrors = tried ? validateStep(step, form, code) : {};
  return {
    raw,
    count: errorCount(raw),
    /** Message for a field, or undefined when valid. */
    error: (field: string): string | undefined => (raw[field] ? t(raw[field]) : undefined),
  };
}
