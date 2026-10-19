"use client";

import { ArrowRight, Check, PartyPopper } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useSession } from "@/store/session";
import { DAY_KEYS } from "../constants";
import { useOnboarding } from "../store";
import { markSignedIn } from "@/lib/auth-cookie";

const CHECKLIST = ["app", "managers", "schedules"] as const;

export function DoneStep() {
  const t = useTranslations("Onboarding.done");
  const hours = useTranslations("Onboarding.hours");
  const toast = useToast();
  const form = useOnboarding((s) => s.form);
  const checks = useOnboarding((s) => s.checks);
  const toggleCheck = useOnboarding((s) => s.toggleCheck);
  const setRole = useSession((s) => s.setRole);

  const first = form.name.trim().split(/\s+/)[0] || t("fallbackName");
  const workDays = DAY_KEYS.filter((_, i) => form.days[i]);
  const weekdaysOnly = workDays.length === 5 && form.days.slice(0, 5).every(Boolean);
  const dayRange = weekdaysOnly ? hours("weekdays") : workDays.map((d) => hours(`days.${d}`)).join(", ") || hours("noDays");
  const invited = form.mode === "manual" ? form.people.filter((p) => p.name.trim() && p.contact.trim()).length : form.csvCount;
  const planName = form.plan ? t(`plans.${form.plan}`) : "—";

  const recap = [
    { label: t("recap.company"), value: form.company || "—" },
    { label: t("recap.branchSite"), value: `${form.branch || "—"} → ${form.siteName || "—"}` },
    { label: t("recap.hours"), value: `${dayRange} ${form.start}–${form.end}` },
    { label: t("recap.invitedPlan"), value: `${invited} · ${planName}` },
  ];

  return (
    <div className="flex flex-col items-center gap-2.5 pt-3 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-ok-bg text-ok">
        <PartyPopper size={30} />
      </div>
      <h1 className="mx-0 mb-0 mt-2 text-[28px] font-semibold tracking-tight">{t("title", { name: first })}</h1>
      <p className="m-0 max-w-[460px] text-text-2 text-pretty">
        {t("subtitle", { company: form.company || t("fallbackCompany"), site: form.siteName || t("fallbackSite") })}
      </p>

      <div className="mt-2 grid w-full grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5 text-left">
        {recap.map((r) => (
          <div key={r.label} className="rounded-[11px] border border-border bg-surface px-3.5 py-3">
            <div className="text-[12px] text-text-3">{r.label}</div>
            <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] font-semibold">{r.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-2 w-full overflow-hidden rounded-[14px] border border-border bg-surface text-left shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <span className="font-semibold">{t("nextSteps")}</span>
          <span className="font-mono text-[12px] font-medium text-text-3">{checks.filter(Boolean).length}/3</span>
        </div>
        {CHECKLIST.map((key, i) => (
          <div key={key} className="flex items-center gap-3.5 border-b border-border px-5 py-3.5 last:border-b-0">
            <button
              role="checkbox"
              aria-checked={checks[i]}
              aria-label={t(`checklist.${key}.title`)}
              onClick={() => toggleCheck(i)}
              className={cn(
                "grid size-[22px] flex-none place-items-center rounded-full p-0 text-white",
                checks[i] ? "border-0 bg-ok-dot" : "border-[1.5px] border-solid border-border-strong bg-transparent",
              )}
            >
              {checks[i] && <Check size={13} strokeWidth={3} />}
            </button>
            <div className="min-w-0 flex-1">
              <div className={cn("font-medium", checks[i] && "text-text-3 line-through")}>{t(`checklist.${key}.title`)}</div>
              <div className="text-[12.5px] text-text-3">{t(`checklist.${key}.description`, { site: form.siteName || t("fallbackSiteLower") })}</div>
            </div>
            <button
              onClick={() => {
                toggleCheck(i, true);
                toast(t(`checklist.${key}.toast`));
              }}
              className="h-8 whitespace-nowrap rounded-lg border border-solid border-border-strong bg-surface px-3 text-[12.5px] font-medium text-text hover:bg-hover"
            >
              {t(`checklist.${key}.action`)}
            </button>
          </div>
        ))}
      </div>

      <Link
        href="/dashboard"
        onClick={() => { markSignedIn(); setRole("admin"); }}
        className="mt-1 flex h-[42px] items-center gap-2 rounded-[10px] bg-accent px-5 font-medium text-white no-underline hover:bg-accent-hover hover:text-white"
      >
        {t("goDashboard")} <ArrowRight size={16} />
      </Link>
    </div>
  );
}
