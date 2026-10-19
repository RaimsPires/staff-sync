"use client";

import { useTranslations } from "next-intl";
import { controlClass, FieldShell } from "@/components/ui/text-field";
import { cn } from "@/lib/utils";
import { DAY_KEYS } from "../constants";
import { FormCard } from "../form-card";
import { useOnboarding } from "../store";
import { useStepErrors } from "../use-step-errors";
import { formatMinutes, toMinutes } from "../validation";

export function HoursStep() {
  const t = useTranslations("Onboarding.hours");
  const form = useOnboarding((s) => s.form);
  const set = useOnboarding((s) => s.set);
  const { error } = useStepErrors(6);

  const start = toMinutes(form.start);
  const end = toMinutes(form.end);
  const duration = Math.max(0, end - start);
  const workDays = DAY_KEYS.filter((_, i) => form.days[i]);
  const weekdaysOnly = workDays.length === 5 && form.days.slice(0, 5).every(Boolean);
  const dayRange = weekdaysOnly ? t("weekdays") : workDays.map((d) => t(`days.${d}`)).join(", ") || t("noDays");
  const hours = `${Math.floor(duration / 60)}h${duration % 60 ? String(duration % 60).padStart(2, "0") : ""}`;

  const toggleDay = (i: number) => set("days", form.days.map((d, j) => (j === i ? !d : d)));

  return (
    <FormCard className="gap-[22px]">
      <div className="flex flex-col gap-2" role="group" aria-labelledby="working-days">
        <span id="working-days" className="text-[13px] font-medium">
          {t("workingDays")}
        </span>
        <div className="flex flex-wrap gap-2">
          {DAY_KEYS.map((d, i) => (
            <button
              key={d}
              type="button"
              aria-pressed={form.days[i]}
              onClick={() => toggleDay(i)}
              className={cn(
                "h-11 w-[52px] rounded-[10px] border border-solid text-[13px] font-semibold",
                form.days[i] ? "border-accent bg-accent-soft text-accent" : "border-border-strong bg-surface text-text-2",
              )}
            >
              {t(`days.${d}`)}
            </button>
          ))}
        </div>
        {error("days") && <span className="text-[12.5px] text-bad">{error("days")}</span>}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
        <FieldShell label={t("startTime")}>
          {({ id }) => (
            <input id={id} type="time" value={form.start} onChange={(e) => set("start", e.target.value)} className={cn(controlClass(), "font-mono font-medium")} />
          )}
        </FieldShell>
        <FieldShell label={t("endTime")} error={error("end")}>
          {({ id, invalid, describedBy }) => (
            <input
              id={id}
              type="time"
              value={form.end}
              onChange={(e) => set("end", e.target.value)}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={cn(controlClass(invalid), "font-mono font-medium")}
            />
          )}
        </FieldShell>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="grace" className="text-[13px] font-medium">
            {t("grace")}
          </label>
          <span className="font-mono text-[15px] font-semibold text-accent">{t("graceValue", { value: form.grace })}</span>
        </div>
        <input id="grace" type="range" min={0} max={30} step={5} value={form.grace} onChange={(e) => set("grace", Number(e.target.value))} className="w-full" />
        <div className="flex justify-between font-mono text-[11px] text-text-3">
          {[0, 5, 10, 15, 20, 25, 30].map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-2 p-4">
        <div className="text-[12px] font-semibold uppercase tracking-wider text-text-3">{t("preview")}</div>
        <div className="relative flex h-7 overflow-hidden rounded-[7px] font-mono text-[11.5px] font-medium">
          <div className="grid flex-1 place-items-center bg-ok-bg text-ok">{t("onTime")}</div>
          <div className="grid place-items-center border-l border-dashed border-l-ok-dot bg-ok-bg text-ok" style={{ width: Math.max(2, form.grace * 2.4) }} />
          <div className="grid flex-[1.4] place-items-center bg-warn-bg text-warn">{t("late")}</div>
        </div>
        <div className="flex flex-col gap-1.5 text-[13px] text-text-2">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-ok-dot" />
            {t("ruleOnTime", { time: formatMinutes(start + form.grace), start: form.start, grace: form.grace })}
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-warn-dot" />
            {t("ruleLate", { time: formatMinutes(start + form.grace + 1) })}
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-text-3" />
            {t("ruleHours", { days: dayRange, start: form.start, end: form.end, hours })}
          </span>
        </div>
      </div>

      <p className="m-0 text-[12.5px] text-text-3">{t("defaultsNote")}</p>
    </FormCard>
  );
}
