"use client";

import { Building2, CalendarRange, Check, Clock, MapPin, Smartphone, Users, Headset, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const STEPS: { key: string; icon: LucideIcon; cta: string | null }[] = [
  { key: "company", icon: Building2, cta: null },
  { key: "site", icon: MapPin, cta: "addSite" },
  { key: "hours", icon: Clock, cta: "setHours" },
  { key: "invite", icon: Users, cta: "invite" },
  { key: "schedules", icon: CalendarRange, cta: "create" },
  { key: "app", icon: Smartphone, cta: "sendLinks" },
];
const GHOST = [
  ["expected", "var(--neutral-dot)"],
  ["present", "var(--ok-dot)"],
  ["late", "var(--warn-dot)"],
  ["flagged", "var(--bad-dot)"],
] as const;

/** Dashboard for a company that has no sites or employees yet: a setup checklist and an empty preview. */
export function NewCompanyView({ firstName }: { firstName: string }) {
  const t = useTranslations("Dashboard.setup");
  const tk = useTranslations("Dashboard.kpi");
  const toast = useToast();
  const [done, setDone] = useState<Record<string, boolean>>({ company: true });

  const completed = STEPS.filter((s) => done[s.key]).length;
  const firstOpen = STEPS.findIndex((s) => !done[s.key]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="m-0 text-2xl font-semibold tracking-tight">{t("welcome", { name: firstName })}</h1>
        <p className="mb-0 mt-1 text-text-2">{t("subtitle")}</p>
      </div>

      <div className="flex flex-wrap items-start gap-4">
        <section className="min-w-0 flex-[1.3_1_460px] overflow-hidden rounded-xl border border-border bg-surface shadow-card">
          <div className="flex items-center gap-4 border-b border-border px-[22px] py-5">
            <div className="relative size-14 flex-none">
              <svg viewBox="0 0 36 36" className="size-14 -rotate-90" aria-hidden>
                <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="4" stroke="var(--neutral-bg)" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none" strokeWidth="4" strokeLinecap="round" stroke="var(--accent)"
                  strokeDasharray={`${(completed / STEPS.length) * 97.4} 97.4`}
                />
              </svg>
              <span className="absolute inset-0 grid place-items-center font-mono text-[13px] font-semibold">
                {completed}/{STEPS.length}
              </span>
            </div>
            <div>
              <div className="text-[16px] font-semibold">{t("title")}</div>
              <div className="text-[13px] text-text-3">{t("hint")}</div>
            </div>
          </div>

          {STEPS.map(({ key, icon: Icon, cta }, i) => {
            const isDone = !!done[key];
            return (
              <div key={key} className="flex items-center gap-3.5 border-b border-border px-[22px] py-3.5 last:border-b-0">
                <button
                  role="checkbox"
                  aria-checked={isDone}
                  aria-label={t(`steps.${key}.title`)}
                  onClick={() => setDone((d) => ({ ...d, [key]: !d[key] }))}
                  className={cn(
                    "grid size-6 flex-none place-items-center rounded-full p-0 text-white",
                    isDone ? "border-0 bg-ok-dot" : "border-[1.5px] border-solid border-border-strong bg-transparent",
                  )}
                >
                  {isDone && <Check size={12} strokeWidth={3.2} />}
                </button>
                <span className="grid size-[34px] flex-none place-items-center rounded-[9px] border border-border bg-surface-2 text-text-2">
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className={cn("font-medium", isDone && "text-text-3 line-through")}>{t(`steps.${key}.title`)}</div>
                  <div className="text-[12.5px] text-text-3">{t(`steps.${key}.description`)}</div>
                </div>
                {!isDone && cta && (
                  <button
                    onClick={() => {
                      setDone((d) => ({ ...d, [key]: true }));
                      toast(t("stepDone", { step: t(`steps.${key}.title`) }));
                    }}
                    className={cn(
                      "h-8 whitespace-nowrap rounded-lg border-0 px-3 text-[12.5px] font-medium",
                      i === firstOpen ? "bg-accent text-white" : "bg-surface-2 text-text",
                    )}
                  >
                    {t(`cta.${cta}`)}
                  </button>
                )}
              </div>
            );
          })}
        </section>

        <section className="flex min-w-0 flex-[1_1_320px] flex-col gap-3">
          <div className="rounded-xl border border-border bg-surface px-5 py-[18px] shadow-card">
            <div className="mb-1 font-semibold">{t("previewTitle")}</div>
            <div className="mb-3.5 text-[12.5px] text-text-3">{t("previewHint")}</div>
            <div className="grid grid-cols-2 gap-2">
              {GHOST.map(([k, color]) => (
                <div key={k} className="flex flex-col gap-1.5 rounded-[10px] border border-dashed border-border-strong p-3">
                  <span className="flex items-center gap-1.5 text-[12px] text-text-3">
                    <span className="size-[7px] rounded-full" style={{ background: color }} />
                    {tk(k)}
                  </span>
                  <span className="text-[22px] font-semibold text-text-3">—</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-5 py-4 shadow-card">
            <span className="grid size-9 flex-none place-items-center rounded-[10px] bg-accent-soft text-accent">
              <Headset size={18} />
            </span>
            <div className="flex-1 text-[13px]">
              <div className="font-semibold">{t("helpTitle")}</div>
              <div className="text-[12.5px] text-text-3">{t("helpHint")}</div>
            </div>
            <button
              onClick={() => toast(t("bookingSent"), "info")}
              className="h-[30px] whitespace-nowrap rounded-lg border border-solid border-border-strong bg-surface px-2.5 text-[12.5px] font-medium text-text"
            >
              {t("book")}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
