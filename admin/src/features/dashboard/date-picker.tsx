"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { DEMO_MONTH, DEMO_TODAY, DEMO_YEAR } from "@/data/live";
import { cn } from "@/lib/utils";

const dateOf = (day: number) => new Date(DEMO_YEAR, DEMO_MONTH, day);

/** Day-of-month picker for the sample month, with quick shortcuts. Future days are disabled. */
export function DatePicker({ day, onChange }: { day: number; onChange: (day: number) => void }) {
  const t = useTranslations("Dashboard");
  const format = useFormatter();
  const [open, setOpen] = useState(false);

  const label = (d: number) => format.dateTime(dateOf(d), { weekday: "short", day: "numeric", month: "short" });
  // Monday-first offset of the 1st of the month.
  const lead = (dateOf(1).getDay() + 6) % 7;
  const weekdays = Array.from({ length: 7 }, (_, i) => format.dateTime(new Date(2026, 9, 5 + i), { weekday: "narrow" }));
  const quick: [number, string][] = [
    [DEMO_TODAY, t("today")],
    [DEMO_TODAY - 1, t("yesterday")],
    [12, t("lastMonday")],
  ];

  const pick = (d: number) => {
    onChange(d);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          "flex h-9 items-center gap-2 rounded-[9px] border border-solid bg-surface px-3 text-[13px] font-medium text-text",
          open ? "border-accent" : "border-border-strong",
        )}
      >
        <CalendarDays size={15} className="text-text-3" />
        {day === DEMO_TODAY ? `${t("today")}, ${label(DEMO_TODAY)}` : label(day)}
        <ChevronDown size={14} className="text-text-3" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[29]" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-label={t("pickDate")}
            className="absolute right-0 top-[calc(100%+8px)] z-30 w-[292px] animate-rise rounded-xl border border-border bg-surface p-3.5 shadow-pop"
          >
            <div className="mb-3 flex gap-1.5">
              {quick.map(([d, text]) => (
                <button
                  key={text}
                  onClick={() => pick(d)}
                  className={cn(
                    "h-[30px] flex-1 rounded-lg border border-solid text-[12.5px] font-medium",
                    day === d ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-text-2",
                  )}
                >
                  {text}
                </button>
              ))}
            </div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13.5px] font-semibold">{format.dateTime(dateOf(1), { month: "long", year: "numeric" })}</span>
              <span className="text-[11.5px] text-text-3">Europe/Paris</span>
            </div>
            <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[11px] text-text-3">
              {weekdays.map((w, i) => (
                <span key={i}>{w}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: lead }, (_, i) => (
                <span key={`lead-${i}`} />
              ))}
              {Array.from({ length: 31 }, (_, i) => {
                const d = i + 1;
                const future = d > DEMO_TODAY;
                const selected = d === day;
                return (
                  <button
                    key={d}
                    disabled={future}
                    onClick={() => pick(d)}
                    aria-pressed={selected}
                    className={cn(
                      "h-[34px] rounded-lg border-0 text-[13px] disabled:cursor-not-allowed",
                      selected ? "bg-accent font-semibold text-white" : "bg-transparent",
                      !selected && (future ? "text-text-3" : "text-text hover:bg-hover"),
                      d === DEMO_TODAY && !selected && "font-semibold shadow-[inset_0_0_0_1.5px_var(--accent)]",
                    )}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
