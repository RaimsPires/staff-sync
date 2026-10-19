"use client";

import { QrCode, Smartphone, UserCheck, type LucideIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Cell, Pie, PieChart } from "recharts";
import { DEMO_MONTH, DEMO_TODAY, DEMO_YEAR } from "@/data/live";
import type { MethodShare } from "./metrics";

const ROWS: { key: "self" | "proxy" | "qr"; icon: LucideIcon; color: string; bg: string }[] = [
  { key: "self", icon: Smartphone, color: "var(--accent)", bg: "var(--accent-soft)" },
  { key: "proxy", icon: UserCheck, color: "var(--violet)", bg: "var(--violet-bg)" },
  { key: "qr", icon: QrCode, color: "var(--warn)", bg: "var(--warn-bg)" },
];
const SLICE: Record<"self" | "proxy" | "qr", string> = { self: "var(--accent)", proxy: "var(--violet-dot)", qr: "var(--warn-dot)" };

export function MethodsCard({ shares, day }: { shares: MethodShare; day: number }) {
  const t = useTranslations("Dashboard.methods");
  const format = useFormatter();
  const total = shares.total || 1;
  const subtitle =
    day === DEMO_TODAY
      ? t("subtitleToday")
      : t("subtitleDay", { date: format.dateTime(new Date(DEMO_YEAR, DEMO_MONTH, day), { weekday: "short", day: "numeric", month: "short" }) });

  return (
    <section className="min-w-0 flex-[1_1_300px] rounded-xl border border-border bg-surface px-[18px] py-4 shadow-card">
      <div className="text-[15px] font-semibold">{t("title")}</div>
      <div className="mb-3.5 text-[12.5px] text-text-3">{subtitle}</div>
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative size-[140px] flex-none" role="img" aria-label={t("chartLabel", { total: shares.total })}>
          <PieChart width={140} height={140}>
            <Pie
              data={ROWS.map((r) => ({ name: r.key, value: shares[r.key] }))}
              dataKey="value"
              innerRadius={48}
              outerRadius={68}
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              {ROWS.map((r) => (
                <Cell key={r.key} fill={SLICE[r.key]} />
              ))}
            </Pie>
          </PieChart>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-[22px] font-semibold tracking-tight">{shares.total}</div>
              <div className="text-[11px] text-text-3">{t("checkins")}</div>
            </div>
          </div>
        </div>

        <ul className="m-0 flex min-w-[150px] flex-1 list-none flex-col gap-3 p-0">
          {ROWS.map(({ key, icon: Icon, color, bg }) => (
            <li key={key} className="flex items-center gap-2.5">
              <span className="grid size-[30px] flex-none place-items-center rounded-lg" style={{ background: bg, color }}>
                <Icon size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium">{t(`${key}.label`)}</div>
                <div className="text-[11.5px] text-text-3">{t(`${key}.description`)}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[13px] font-semibold">{Math.round((shares[key] / total) * 100)}%</div>
                <div className="text-[11.5px] text-text-3">{shares[key]}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
