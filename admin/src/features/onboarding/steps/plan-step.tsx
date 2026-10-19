"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { PLANS, recommendedPlan } from "../constants";
import { useOnboarding } from "../store";
import { useStepErrors } from "../use-step-errors";

export function PlanStep() {
  const t = useTranslations("Onboarding.plan");
  const form = useOnboarding((s) => s.form);
  const set = useOnboarding((s) => s.set);
  const { error } = useStepErrors(8);
  const recommended = recommendedPlan(form.size);
  const yearly = form.billing === "yearly";

  return (
    <>
      <div className="flex justify-center">
        <div role="group" aria-label={t("billing")} className="flex gap-[3px] rounded-[11px] border border-border bg-surface p-[3px]">
          {(["monthly", "yearly"] as const).map((b) => (
            <button
              key={b}
              aria-pressed={form.billing === b}
              onClick={() => set("billing", b)}
              className={cn(
                "flex h-[34px] items-center gap-2 rounded-lg border-0 px-[18px] text-[13px] font-medium",
                form.billing === b ? "bg-surface-2 text-text shadow-[0_1px_2px_rgb(0_0_0/0.1)]" : "bg-transparent text-text-2",
              )}
            >
              {t(b)}
              {b === "yearly" && <span className="rounded-full bg-ok-bg px-1.5 py-0.5 text-[11px] font-semibold text-ok">−20%</span>}
            </button>
          ))}
        </div>
      </div>

      <div role="radiogroup" aria-label={t("choose")} className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
        {PLANS.map((plan) => {
          const selected = form.plan === plan.id;
          const price = plan.price ? (yearly ? plan.price.yearly : plan.price.monthly) : null;
          return (
            <button
              key={plan.id}
              role="radio"
              aria-checked={selected}
              onClick={() => set("plan", plan.id)}
              className={cn(
                "relative flex flex-col gap-3.5 rounded-[14px] bg-surface px-[18px] py-5 text-left text-text shadow-card",
                selected
                  ? "border-2 border-solid border-accent shadow-[0_0_0_4px_var(--accent-soft)]"
                  : cn("border border-solid", error("plan") ? "border-bad-dot" : "border-border"),
              )}
            >
              {recommended === plan.id && (
                <span className="absolute -top-2.5 left-[18px] rounded-full bg-accent px-2 py-[3px] text-[11px] font-semibold text-white">
                  {t("recommended", { size: form.size })}
                </span>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold">{t(`plans.${plan.id}.name`)}</span>
                <span
                  className={cn(
                    "box-border size-[18px] rounded-full bg-surface",
                    selected ? "border-[5px] border-solid border-accent" : "border-[1.5px] border-solid border-border-strong",
                  )}
                />
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[28px] font-semibold tracking-tight">
                    {price === null ? t("custom") : price === 0 ? "€0" : `€${(Number.isInteger(price) ? String(price) : price.toFixed(2)).replace(".", t("decimal"))}`}
                  </span>
                  <span className="text-[12.5px] text-text-3">{t(`plans.${plan.id}.unit`)}</span>
                </div>
                <div className="min-h-[18px] text-[12.5px] text-text-2">
                  {plan.id === "starter" || plan.id === "business" ? t(yearly ? "billedYearly" : "billedMonthly") : t(`plans.${plan.id}.note`)}
                </div>
              </div>
              <div className="rounded-lg bg-surface-2 px-2.5 py-1.5 text-[12.5px] font-medium text-text-2">{t(`plans.${plan.id}.capacity`)}</div>
              <ul className="m-0 flex list-none flex-col gap-[7px] p-0">
                {Array.from({ length: plan.features }, (_, i) => (
                  <li key={i} className="flex gap-2 text-[12.5px] text-text-2">
                    <Check size={14} strokeWidth={2.4} className="mt-px flex-none text-ok-dot" />
                    {t(`plans.${plan.id}.features.${i + 1}`)}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
      {error("plan") && <p className="m-0 text-center text-[12.5px] text-bad">{error("plan")}</p>}
      <p className="m-0 text-center text-[12.5px] text-text-3">{t("footnote")}</p>
    </>
  );
}
