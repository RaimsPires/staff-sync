"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Segmented } from "@/components/ui/tabs";
import { DEMO_MONTH, DEMO_TODAY, DEMO_YEAR } from "@/data/live";
import { cn } from "@/lib/utils";
import { punctualityTone, type PunctualityRow } from "./metrics";

export type PunctualityGroup = "branch" | "site";

const TONE_TEXT = { ok: "text-ok", warn: "text-warn", bad: "text-bad" } as const;

export function PunctualityCard({
  rows,
  by,
  canGroup,
  day,
  onBy,
}: {
  rows: PunctualityRow[];
  by: PunctualityGroup;
  canGroup: boolean;
  day: number;
  onBy: (by: PunctualityGroup) => void;
}) {
  const t = useTranslations("Dashboard.punctuality");
  const format = useFormatter();
  const when =
    day === DEMO_TODAY
      ? t("today")
      : format.dateTime(new Date(DEMO_YEAR, DEMO_MONTH, day), { weekday: "short", day: "numeric", month: "short" });

  return (
    <section className="min-w-0 flex-[1_1_400px] rounded-xl border border-border bg-surface px-[18px] py-4 shadow-card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[15px] font-semibold">{t("title")}</div>
          <div className="text-[12.5px] text-text-3">{t("subtitle", { when })}</div>
        </div>
        {canGroup && (
          <Segmented
            value={by}
            onChange={onBy}
            items={[
              { id: "branch", label: t("byBranch") },
              { id: "site", label: t("bySite") },
            ]}
          />
        )}
      </div>

      <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
        {rows.map((r) => {
          const tone = punctualityTone(r.onTimePct);
          const sub =
            by === "branch"
              ? `${t("sites", { count: r.siteCount })} · ${t("present", { count: r.present })}`
              : `${r.branchName ? `${r.branchName} · ` : ""}${t("present", { count: r.present })}`;
          return (
            <li key={r.key} className="grid grid-cols-[minmax(96px,150px)_minmax(0,1fr)_52px] items-center gap-3">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium">{r.name}</div>
                <div className="text-[11.5px] text-text-3">{sub}</div>
              </div>
              <div
                title={t("tooltip", { onTime: Math.round(r.onTimePct), late: r.late })}
                className="flex h-3 gap-0.5 overflow-hidden rounded-md bg-neutral-bg"
              >
                <span className="bg-ok-dot" style={{ width: `${r.onTimePct}%` }} />
                <span className="bg-warn-dot" style={{ width: `${r.latePct}%` }} />
              </div>
              <div className={cn("text-right font-mono text-[13px] font-semibold", TONE_TEXT[tone])}>{Math.round(r.onTimePct)}%</div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex gap-3.5 text-[12px] text-text-2">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-ok-dot" />
          {t("onTime")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-warn-dot" />
          {t("late")}
        </span>
      </div>
    </section>
  );
}
