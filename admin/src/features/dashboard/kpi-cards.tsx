"use client";

import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { KpiDelta } from "./metrics";

export interface Kpi {
  key: string;
  label: string;
  value: number;
  suffix?: string;
  dot: string;
  href: string;
  delta: KpiDelta;
}

const DELTA_TONE = {
  ok: "bg-ok-bg text-ok",
  bad: "bg-bad-bg text-bad",
  neutral: "bg-neutral-bg text-text-2",
} as const;

export function KpiCards({ items }: { items: Kpi[] }) {
  const t = useTranslations("Dashboard");
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(148px,1fr))] gap-3">
      {items.map((k) => {
        const Icon = k.delta.direction === "up" ? ArrowUp : k.delta.direction === "down" ? ArrowDown : Minus;
        const sign = k.delta.value > 0 ? "+" : k.delta.value < 0 ? "−" : "";
        return (
          <Link
            key={k.key}
            href={k.href}
            title={k.label}
            className="flex flex-col gap-2 rounded-xl border border-border bg-surface px-3.5 pb-3 pt-3.5 text-left text-text no-underline shadow-card hover:border-border-strong hover:text-text hover:no-underline"
          >
            <div className="flex items-center gap-[7px] overflow-hidden whitespace-nowrap text-[12.5px] font-medium text-text-2">
              <span className="size-2 flex-none rounded-full" style={{ background: k.dot }} />
              {k.label}
            </div>
            <div className="flex items-baseline gap-[5px]">
              <span className="text-[28px] font-semibold leading-[1.05] tracking-tight tabular-nums">{k.value}</span>
              {k.suffix && <span className="whitespace-nowrap text-[12.5px] text-text-3">{k.suffix}</span>}
            </div>
            <div className="flex items-center gap-1 whitespace-nowrap text-[12px]">
              <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-px font-semibold", DELTA_TONE[k.delta.tone])}>
                <Icon size={11} strokeWidth={2.6} />
                {sign}
                {Math.abs(k.delta.value)}
              </span>
              <span className="text-text-3">{t("vsYesterday")}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
