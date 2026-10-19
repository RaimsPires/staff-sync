import { useFormatter, useTranslations } from "next-intl";
import { useCallback } from "react";
import type { AlertItem, AlertReason, AlertStatus, Severity } from "@/data/alerts";
import { DEMO_MONTH, DEMO_TODAY, DEMO_YEAR } from "@/data/live";

type ToneName = "bad" | "warn" | "orange" | "violet" | "info" | "neutral";

export const REASON_TONE: Record<AlertReason, { name: ToneName; className: string }> = {
  geo: { name: "bad", className: "bg-bad-bg text-bad" },
  mock: { name: "bad", className: "bg-bad-bg text-bad" },
  acc: { name: "warn", className: "bg-warn-bg text-warn" },
  tamper: { name: "bad", className: "bg-bad-bg text-bad" },
  unas: { name: "orange", className: "bg-orange-bg text-orange" },
  dev: { name: "violet", className: "bg-violet-bg text-violet" },
  miss: { name: "info", className: "bg-info-bg text-info" },
  uns: { name: "orange", className: "bg-orange-bg text-orange" },
  unc: { name: "neutral", className: "bg-neutral-bg text-neutral" },
};

export const SEVERITY_DOT: Record<Severity, string> = { high: "var(--bad-dot)", med: "var(--warn-dot)", low: "var(--neutral-dot)" };

export const STATUS_STYLE: Record<AlertStatus, { className: string }> = {
  open: { className: "bg-warn-bg text-warn" },
  approved: { className: "bg-ok-bg text-ok" },
  rejected: { className: "bg-bad-bg text-bad" },
};

/** "Today · 08:12", "Yesterday · 07:20" or "Oct 14 · 06:58" for an alert; dates only with `dateOnly`. */
export function useAlertWhen() {
  const t = useTranslations("Alerts");
  const format = useFormatter();
  return useCallback(
    (item: Pick<AlertItem, "days" | "time" | "isCheckInTime">, dateOnly = false): string => {
      const day =
        item.days === 0
          ? t("today")
          : item.days === 1
            ? t("yesterday")
            : format.dateTime(new Date(DEMO_YEAR, DEMO_MONTH, DEMO_TODAY - item.days), { month: "short", day: "numeric" });
      if (dateOnly || !item.time) return day;
      return `${day} · ${item.isCheckInTime ? t("inTime", { time: item.time }) : item.time}`;
    },
    [t, format],
  );
}
