"use client";

import { Pause, Play, QrCode, Smartphone, UserCheck, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { StatusChip, type ChipStatus } from "@/components/ui/status-chip";
import { avatarColors, initials } from "@/components/ui/misc";
import { DEMO_TODAY } from "@/data/live";
import { useOrg } from "@/lib/org";
import { cn } from "@/lib/utils";
import { useData } from "@/store/data";
import { useRuledRecords } from "@/lib/attendance-rules";

type Method = "self" | "proxy" | "qr";
const METHOD_ICON: Record<Method, LucideIcon> = { self: Smartphone, proxy: UserCheck, qr: QrCode };

interface Row {
  id: string;
  name: string;
  site: string;
  act: "in" | "out";
  time: string;
  /** A night shift that started on the previous day. */
  previousDay?: boolean;
  method: Method;
  status: ChipStatus;
  fresh: boolean;
}

export function ActivityCard({
  day,
  siteIds,
  paused,
  onTogglePause,
}: {
  day: number;
  siteIds: string[];
  paused: boolean;
  onTogglePause: () => void;
}) {
  const org = useOrg();
  const t = useTranslations("Dashboard.activity");
  const tm = useTranslations("Dashboard.methods");
  const todayAll = useRuledRecords(useData((s) => s.today));
  const historyAll = useRuledRecords(useData((s) => s.history));
  const isToday = day === DEMO_TODAY;
  const dayRows = useMemo(() => (isToday ? todayAll : historyAll.filter((r) => r.date === day)), [isToday, todayAll, historyAll, day]);

  const rows = useMemo<Row[]>(() => {
    const base: Row[] = [];
    for (const r of dayRows.filter((x) => siteIds.includes(x.site))) {
      const method: Method = r.method === "behalf" || r.method === "admin" ? "proxy" : r.method === "qr" ? "qr" : "self";
      const previousDay = r.kind === "recurringN" && r.in > r.sched.split("–")[1];
      if (r.in) {
        base.push({
          id: `i${r.id}`, name: r.name, site: r.site, act: "in", time: r.in, previousDay, method, fresh: false,
          status: r.fraud ? "fraud" : r.flag && !r.cleared ? "flagged" : r.status === "late" ? "late" : "ontime",
        });
      }
      if (r.out) {
        base.push({
          id: `o${r.id}`, name: r.name, site: r.site, act: "out", time: r.out, method, fresh: false,
          status: r.status === "early" ? "early" : r.status === "overtime" ? "overtime" : "ontime",
        });
      }
    }
    const key = (r: Row) => `${r.previousDay ? "0" : "1"}${r.time}`;
    return base.sort((a, b) => (key(a) < key(b) ? 1 : key(a) > key(b) ? -1 : 0)).slice(0, 30);
  }, [dayRows, siteIds]);

  return (
    <section className="flex max-h-[470px] min-w-0 flex-[1.3_1_440px] flex-col rounded-xl border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between gap-3 px-[18px] pb-3 pt-4">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold">{isToday ? t("titleToday") : t("titleDay")}</span>
          {isToday && !paused && <span className="size-2 flex-none animate-pulse-ring rounded-full bg-[#22C55E]" aria-hidden />}
        </div>
        {isToday && (
          <button
            onClick={onTogglePause}
            className="flex h-[30px] items-center gap-1.5 rounded-lg border border-solid border-border-strong bg-surface px-2.5 text-[12.5px] font-medium text-text"
          >
            {paused ? <Play size={12} /> : <Pause size={12} />}
            {paused ? t("resume") : t("pause")}
          </button>
        )}
      </div>

      <ul className="m-0 flex-1 list-none overflow-auto border-t border-border p-0" aria-live="polite">
        {rows.map((r) => {
          const Icon = METHOD_ICON[r.method];
          return (
            <li
              key={r.id}
              className={cn("flex items-center gap-3 border-b border-border px-[18px] py-2.5 transition-colors duration-1000", r.fresh && "bg-accent-soft")}
            >
              <span className="grid size-8 flex-none place-items-center rounded-full text-[12px] font-semibold" style={avatarColors(r.name)}>
                {initials(r.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px]">
                  <strong className="font-semibold">{r.name}</strong> <span className="text-text-2">{t(r.act === "in" ? "checkedIn" : "checkedOut")}</span>
                </div>
                <div className="truncate text-[12px] text-text-3">{org.siteById(r.site).name}</div>
              </div>
              <span title={tm(`${r.method}.label`)} className="grid size-[26px] flex-none place-items-center rounded-[7px] border border-border bg-surface-2 text-text-2">
                <Icon size={14} />
              </span>
              <StatusChip status={r.status} className="flex-none whitespace-nowrap" />
              <span className="w-10 flex-none text-right font-mono text-[12px] font-medium text-text-3">
                {r.previousDay ? `${t("yesterdayShort")} ` : ""}
                {r.time}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
