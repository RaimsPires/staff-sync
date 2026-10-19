import { useMemo } from "react";
import { useSettings } from "@/store/settings";
import type { SettingsValues } from "@/types/settings";

type TimeFormat = SettingsValues["tfmt"];

const pad = (n: number) => String(n).padStart(2, "0");

/** Formats a calendar date with a pattern such as "DD/MM/YYYY" (UTC parts, so the day never shifts). */
export function formatDate(value: Date | string | number, pattern: string): string {
  const d = new Date(value);
  return pattern.replace("DD", pad(d.getUTCDate())).replace("MM", pad(d.getUTCMonth() + 1)).replace("YYYY", String(d.getUTCFullYear()));
}

/** "14:30" -> "2:30 PM" in 12-hour mode; anything that is not a clock time is returned unchanged. */
export function formatClock(value: string, format: TimeFormat): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!m || format === "24h") return value;
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
}

/** Clock formatting that follows Settings → Company profile → Time format. */
export function useClock() {
  const format = useSettings((s) => s.values.tfmt);
  return useMemo(
    () => ({
      time: (value: string) => formatClock(value, format),
      /** "08:00–17:00" -> each end formatted. */
      range: (value: string) => value.split("–").map((part) => formatClock(part.trim(), format)).join("–"),
    }),
    [format],
  );
}

/** Numeric date formatting that follows Settings → Company profile → Date format. */
export function useDateFormat() {
  const pattern = useSettings((s) => s.values.dfmt);
  return useMemo(() => (value: Date | string | number) => formatDate(value, pattern), [pattern]);
}
