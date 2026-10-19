"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { DEMO_MONTH, DEMO_TODAY, DEMO_YEAR } from "@/data/live";
import { BRANCHES, siteById } from "@/data/org";
import { cn } from "@/lib/utils";
import type { Employee } from "@/types/employee";
import { minutesLabel, monthStats, round1, weekdayIndex, type DayRecord, type DayStatus } from "./profile-model";

const card = "rounded-xl border border-border bg-surface shadow-card";
const DAY_STYLE: Record<DayStatus, string> = {
  present: "bg-ok-bg text-ok", late: "bg-warn-bg text-warn", absent: "bg-bad-bg text-bad", leave: "bg-violet-bg text-violet",
};
const DAY_DOT: Record<DayStatus, string> = { present: "var(--ok-dot)", late: "var(--warn-dot)", absent: "var(--bad-dot)", leave: "var(--violet-dot)" };

export function OverviewTab({ emp, records }: { emp: Employee; records: DayRecord[] }) {
  const t = useTranslations("Employees.profile");
  const format = useFormatter();
  const stats = monthStats(records);
  const dash = "—";
  const dateOf = (d: number) => new Date(DEMO_YEAR, DEMO_MONTH, d);
  const rateTone = stats.rate >= 90 ? "text-ok" : stats.rate >= 75 ? "text-warn" : "text-bad";
  const cards = [
    { k: "rate", v: stats.hasData ? `${stats.rate}%` : dash, tone: stats.hasData ? rateTone : "text-text-3", hint: t("stats.thisMonth") },
    { k: "lates", v: stats.hasData ? stats.lates : dash, tone: "text-text", hint: t("stats.overFive") },
    { k: "absences", v: stats.hasData ? stats.absences : dash, tone: stats.absences ? "text-bad" : "text-text", hint: t("stats.unexcused") },
    { k: "hours", v: stats.hasData ? `${round1(stats.hours)} h` : dash, tone: "text-text", hint: t("stats.ofPlanned", { hours: stats.planned }) },
    { k: "overtime", v: stats.hasData ? `${round1(stats.overtime)} h` : dash, tone: "text-text", hint: t("stats.beyond") },
  ];
  const upcoming = records.filter((r) => r.day > DEMO_TODAY - 0 && !r.weekend).slice(0, 5);

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        {cards.map((c) => (
          <div key={c.k} className={cn(card, "px-4 py-3.5")}>
            <div className="text-[12.5px] text-text-3">{t(`stats.${c.k}`)}</div>
            <div className={cn("mt-0.5 text-[26px] font-semibold tracking-tight", c.tone)}>{c.v}</div>
            <div className="text-[12px] text-text-3">{c.hint}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-start gap-4">
        <section className={cn(card, "flex-[1_1_300px] px-[18px] py-4")}>
          <h2 className="mb-2.5 mt-0 text-[14.5px] font-semibold">{t("assignedSites")}</h2>
          {emp.siteIds.map((id, i) => (
            <div key={id} className={cn("flex items-center gap-2.5 py-[9px]", i > 0 && "border-t border-border")}>
              <div className="flex-1">
                <div className="text-[13.5px] font-medium">{siteById(id).name}</div>
                <div className="text-[12px] text-text-3">{BRANCHES.find((b) => b.id === siteById(id).branchId)?.name}</div>
              </div>
              <span className={cn("rounded-full px-2 py-[3px] text-[12px]", i ? "bg-neutral-bg text-neutral" : "bg-accent-soft text-accent")}>{t(i ? "secondary" : "defaultSite")}</span>
            </div>
          ))}
        </section>
        <section className={cn(card, "flex-[1_1_360px] px-[18px] py-4")}>
          <h2 className="mb-2.5 mt-0 text-[14.5px] font-semibold">{t("upcomingSchedule")}</h2>
          {upcoming.length === 0 && <div className="py-3 text-[13px] text-text-3">{t("noUpcoming")}</div>}
          {upcoming.map((r, i) => (
            <div key={r.day} className={cn("flex items-center gap-3 py-[9px] text-[13px]", i > 0 && "border-t border-border")}>
              <span className="w-24 font-medium">{format.dateTime(dateOf(r.day), { weekday: "short", day: "numeric", month: "short" })}</span>
              <span className="font-mono text-[12.5px] text-text-2">08:00 – 16:00</span>
              <span className="ml-auto text-right text-text-3">{siteById(emp.siteIds[i % emp.siteIds.length] ?? "pd").name}</span>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}

export function AttendanceTab({ emp, records }: { emp: Employee; records: DayRecord[] }) {
  const t = useTranslations("Employees.profile");
  const ts = useTranslations("Employees.profile.dayStatus");
  const format = useFormatter();
  const [filter, setFilter] = useState<"all" | DayStatus>("all");
  const dateOf = (d: number) => new Date(DEMO_YEAR, DEMO_MONTH, d);
  const past = records.filter((r) => r.status);
  const rows = past.slice().reverse().filter((r) => filter === "all" || r.status === filter);
  const lead = 3;
  const weekdays = Array.from({ length: 7 }, (_, i) => format.dateTime(new Date(2026, 9, 5 + i), { weekday: "short" }));
  const noData = past.length === 0;
  void emp;

  return (
    <div className="flex flex-wrap items-start gap-4">
      <section className={cn(card, "min-w-[300px] flex-[0_1_380px] px-[18px] py-4")}>
        <h2 className="mb-3 mt-0 text-[14.5px] font-semibold">{format.dateTime(dateOf(1), { month: "long", year: "numeric" })}</h2>
        <div className="mb-1.5 grid grid-cols-7 gap-1.5 text-center text-[11.5px] text-text-3">
          {weekdays.map((w) => <span key={w}>{w}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: lead }, (_, i) => <span key={`l${i}`} />)}
          {records.map((r) => (
            <div
              key={r.day}
              className={cn(
                "grid aspect-square place-items-center rounded-lg text-[12.5px] font-medium",
                r.status ? DAY_STYLE[r.status] : r.weekend ? "text-text-3" : "border border-dashed border-border-strong text-text-3",
                r.day === DEMO_TODAY && "outline outline-2 outline-accent",
              )}
              title={r.status ? ts(r.status) : undefined}
            >
              {r.day}
            </div>
          ))}
        </div>
        <ul className="m-0 mt-3.5 flex list-none flex-wrap gap-3 p-0 text-[12px] text-text-2">
          {(Object.keys(DAY_DOT) as DayStatus[]).map((s) => (
            <li key={s} className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px]" style={{ background: DAY_DOT[s] }} />{ts(s)}</li>
          ))}
        </ul>
      </section>
      <section className={cn(card, "min-w-0 flex-[1_1_380px] overflow-hidden")}>
        <div className="flex items-center justify-between gap-2.5 border-b border-border px-4 py-3">
          <h2 className="m-0 text-[14.5px] font-semibold">{t("records")}</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label={t("filterStatus")} className="h-8 rounded-lg border border-solid border-border-strong bg-surface px-2 text-[13px] text-text">
            <option value="all">{t("allStatuses")}</option>
            {(["present", "late", "absent", "leave"] as const).map((s) => <option key={s} value={s}>{ts(s)}</option>)}
          </select>
        </div>
        {rows.length === 0 && <div className="px-4 py-8 text-center text-[13px] text-text-3">{noData ? t("noAttendance") : t("noRecordsStatus")}</div>}
        {rows.map((r) => (
          <div key={r.day} className="grid grid-cols-[84px_1fr_56px_96px] items-center gap-2.5 border-t border-border px-4 py-2.5 text-[13px] first:border-t-0">
            <span className="font-medium">{format.dateTime(dateOf(r.day), { weekday: "short", day: "numeric", month: "short" })}</span>
            <span className="font-mono text-[12.5px] text-text-2">
              {r.inMin != null ? `${minutesLabel(r.inMin)} → ${r.outMin != null ? minutesLabel(r.outMin) : t("inProgress")}` : r.status === "leave" ? t("approvedLeave") : t("noCheckIn")}
            </span>
            <span className="text-right text-text-3">{r.outMin != null && r.inMin != null ? `${round1((r.outMin - r.inMin) / 60)} h` : ""}</span>
            <span className={cn("justify-self-end rounded-md px-2 py-[3px] text-[12px] font-medium", r.status && DAY_STYLE[r.status])}>{r.status && ts(r.status)}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

export { weekdayIndex };
