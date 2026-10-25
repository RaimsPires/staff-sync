"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Segmented } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { TrendPoint } from "./metrics";

export type TrendRange = 7 | 30 | 90;
const RANGES: TrendRange[] = [7, 30, 90];

interface Props {
  points: TrendPoint[];
  average: number;
  delta: number;
  range: TrendRange;
  onRange: (r: TrendRange) => void;
}

export function TrendCard({ points, average, delta, range, onRange }: Props) {
  const t = useTranslations("Dashboard.trend");
  const format = useFormatter();
    const positive = delta >= 0;

  const data = points.map((p) => ({ ...p, date: new Date(`${p.iso}T12:00:00`) }));
  const ticks = (range === 7 ? data.map((_, i) => i) : range === 30 ? [0, 7, 14, 21, 29] : [0, 30, 60, 89]).filter((i) => i < data.length);
  const tickLabel = (i: number) =>
    range === 7
      ? format.dateTime(data[i].date, { weekday: "short" })
      : format.dateTime(data[i].date, { day: "numeric", month: "short" });

  return (
    <section className="min-w-0 flex-[1.55_1_520px] rounded-xl border border-border bg-surface px-[18px] pb-3.5 pt-4 shadow-card">
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[15px] font-semibold">{t("title")}</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[24px] font-semibold tracking-tight">{average.toFixed(1)}%</span>
            <span className="text-[12.5px] text-text-3">{t("average", { days: range })}</span>
            <span className={cn("rounded-full px-[7px] py-px text-[12px] font-semibold", positive ? "bg-ok-bg text-ok" : "bg-bad-bg text-bad")}>
              {positive ? "+" : "−"}
              {Math.abs(delta).toFixed(1)} {t("points")}
            </span>
          </div>
        </div>
        <Segmented
          value={String(range) as `${TrendRange}`}
          onChange={(v) => onRange(Number(v) as TrendRange)}
          items={RANGES.map((r) => ({ id: String(r) as `${TrendRange}`, label: t("rangeLabel", { days: r }) }))}
        />
      </div>

      <div className="h-[210px]" role="img" aria-label={t("chartLabel", { average: average.toFixed(1) })}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" />
            <XAxis
              dataKey="index"
              ticks={ticks}
              tickFormatter={(i: number) => tickLabel(i)}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--text-3)", fontSize: 11, fontFamily: "var(--font-geist-mono)" }}
              interval={0}
              padding={{ left: 8, right: 8 }}
            />
            <YAxis
              domain={[70, 100]}
              ticks={[70, 80, 90, 100]}
              tickFormatter={(v: number) => `${v}%`}
              tickLine={false}
              axisLine={false}
              width={44}
              tick={{ fill: "var(--text-3)", fontSize: 11, fontFamily: "var(--font-geist-mono)" }}
            />
            <ReferenceLine y={90} stroke="var(--ok-dot)" strokeDasharray="5 4" label={{ value: t("target"), position: "insideTopRight", fill: "var(--ok)", fontSize: 11, fontWeight: 500 }} />
            <Tooltip
              cursor={{ stroke: "var(--border-strong)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as (typeof data)[number];
                return (
                  <div className="rounded-lg bg-text px-2.5 py-[7px] text-[12px] text-surface shadow-pop">
                    <div className="font-semibold">{p.rate.toFixed(1)}%</div>
                    <div className="opacity-75">{format.dateTime(p.date, { weekday: "short", day: "numeric", month: "short" })}</div>
                  </div>
                );
              }}
            />
            <Area type="monotone" dataKey="rate" stroke="var(--accent)" strokeWidth={2} fill="url(#trend-fill)" activeDot={{ r: 5, fill: "var(--accent)", stroke: "var(--surface)", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
