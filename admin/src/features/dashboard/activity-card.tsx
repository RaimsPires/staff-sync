"use client";

import { Pause, Play, QrCode, Smartphone, UserCheck, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { StatusChip, type ChipStatus } from "@/components/ui/status-chip";
import { avatarColors, initials } from "@/components/ui/misc";
import { DEMO_TODAY, QR_RECORD_IDS } from "@/data/live";
import { siteById } from "@/data/org";
import { formatTime, parseTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { useData } from "@/store/data";
import type { LiveEvent } from "@/types/domain";

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

/** Past days show shifted times so the stream does not look identical every day. */
const shiftTime = (time: string, day: number) => (day === DEMO_TODAY ? time : formatTime(parseTime(time) + ((day * 7) % 11) - 5));

export function ActivityCard({
  day,
  siteIds,
  live,
  tick,
  paused,
  onTogglePause,
}: {
  day: number;
  siteIds: string[];
  live: LiveEvent[];
  tick: number;
  paused: boolean;
  onTogglePause: () => void;
}) {
  const t = useTranslations("Dashboard.activity");
  const tm = useTranslations("Dashboard.methods");
  const today = useData((s) => s.today);
  const isToday = day === DEMO_TODAY;

  const rows = useMemo<Row[]>(() => {
    const base: Row[] = [];
    for (const r of today.filter((x) => siteIds.includes(x.site))) {
      const method: Method = r.method === "behalf" ? "proxy" : QR_RECORD_IDS.includes(r.id) ? "qr" : "self";
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
    const fromFeed: Row[] = isToday
      ? live
          .filter((e) => siteIds.includes(e.site))
          .map((e) => ({ id: e.id, name: e.name, site: e.site, act: e.act, time: e.time, method: e.method, status: e.status, fresh: tick - e.born < 4 }))
      : [];
    const key = (r: Row) => `${r.previousDay ? "0" : "1"}${r.time}`;
    return [...fromFeed, ...base].sort((a, b) => (key(a) < key(b) ? 1 : key(a) > key(b) ? -1 : 0)).slice(0, 30);
  }, [today, siteIds, live, tick, isToday]);

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
                <div className="truncate text-[12px] text-text-3">{siteById(r.site).name}</div>
              </div>
              <span title={tm(`${r.method}.label`)} className="grid size-[26px] flex-none place-items-center rounded-[7px] border border-border bg-surface-2 text-text-2">
                <Icon size={14} />
              </span>
              <StatusChip status={r.status} className="flex-none whitespace-nowrap" />
              <span className="w-10 flex-none text-right font-mono text-[12px] font-medium text-text-3">
                {r.previousDay ? `${t("yesterdayShort")} ` : ""}
                {shiftTime(r.time, day)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
