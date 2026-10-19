"use client";

import { useTranslations } from "next-intl";
import { TextField } from "@/components/ui/text-field";
import { FormCard } from "../form-card";
import { useOnboarding } from "../store";
import { useStepErrors } from "../use-step-errors";

export function BranchStep() {
  const t = useTranslations("Onboarding.branch");
  const tc = useTranslations("Onboarding.company");
  const form = useOnboarding((s) => s.form);
  const set = useOnboarding((s) => s.set);
  const { error } = useStepErrors(4);

  return (
    <>
      <div className="flex gap-3 rounded-[10px] border border-border bg-surface px-3.5 py-3 text-[13px] text-text-2">
        <div className="flex flex-wrap items-center gap-1.5 whitespace-nowrap font-mono text-[12px] font-medium">
          <span className="rounded-md bg-neutral-bg px-2 py-[3px]">{form.company || t("companyFallback")}</span>
          <span>→</span>
          <span className="rounded-md bg-accent-soft px-2 py-[3px] text-accent">{t("branch")}</span>
          <span>→</span>
          <span className="rounded-md bg-neutral-bg px-2 py-[3px]">{t("sites")}</span>
        </div>
        <span className="text-pretty">{t("hierarchyHint")}</span>
      </div>

      <FormCard>
        <TextField label={t("name")} value={form.branch} onChange={(e) => set("branch", e.target.value)} placeholder="Lyon" error={error("branch")} />
        <TextField label={t("street")} value={form.street} onChange={(e) => set("street", e.target.value)} placeholder="17 Boulevard Vivier-Merle" error={error("street")} />
        <div className="grid grid-cols-[140px_minmax(0,1fr)_minmax(0,1fr)] gap-4">
          <TextField label={t("postalCode")} value={form.zip} onChange={(e) => set("zip", e.target.value)} placeholder="69003" inputMode="numeric" error={error("zip")} />
          <TextField label={t("city")} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Lyon" error={error("city")} />
          <TextField label={t("country")} value={tc(`countries.${form.country}`)} readOnly />
        </div>
      </FormCard>
    </>
  );
}
