import { useFormatter } from "next-intl";
import { useMemo } from "react";
import { DEMO_MONTH, DEMO_TODAY, DEMO_YEAR } from "@/data/live";

/** The sample "now" (Thu 15 Oct 2026, noon) so relative times match the sample data. */
export const DEMO_NOW = new Date(DEMO_YEAR, DEMO_MONTH, DEMO_TODAY, 12, 0);

/** Locale-aware formatting of leave dates and submission times. */
export function useLeaveFormat() {
  const format = useFormatter();
  return useMemo(() => ({
    /** "Fri 23 Oct" for one day, "26–30 Oct" for a range. */
    range(from: string, to: string): string {
      const a = new Date(`${from}T00:00`);
      const b = new Date(`${to}T00:00`);
      return from === to
        ? format.dateTime(a, { weekday: "short", day: "numeric", month: "short" })
        : `${format.dateTime(a, { day: "numeric", month: "short" })} – ${format.dateTime(b, { day: "numeric", month: "short" })}`;
    },
    /** "2 days ago", "yesterday" or "today, 07:12". */
    submitted(iso: string): string {
      const d = new Date(iso);
      const days = Math.round((DEMO_NOW.getTime() - d.getTime()) / 86_400_000);
      if (days <= 0) return format.dateTime(d, { hour: "2-digit", minute: "2-digit", hour12: false });
      return days > 7 ? format.dateTime(d, { day: "numeric", month: "short" }) : format.relativeTime(d, DEMO_NOW);
    },
  }), [format]);
}
