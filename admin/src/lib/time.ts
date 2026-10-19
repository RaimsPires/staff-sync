/** "08:30" -> 510. Empty or invalid input -> 0. */
export const parseTime = (s: string): number => {
  const [h = 0, m = 0] = (s || "0:0").split(":").map(Number);
  return h * 60 + m;
};

/** Minutes since midnight -> "08:30". Wraps around midnight in both directions. */
export const formatTime = (minutes: number): string => {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

/** Duration between two clock times, crossing midnight when `to` is earlier: "8h 05m". */
export function formatDuration(from: string, to: string): string {
  let d = parseTime(to) - parseTime(from);
  if (d <= 0) d += 1440;
  return `${Math.floor(d / 60)}h ${String(d % 60).padStart(2, "0")}m`;
}

/** Signed difference between two clock minutes on a 24h circle, in minutes. */
export const wrapDelta = (a: number, b: number): number => ((((a - b + 720) % 1440) + 1440) % 1440) - 720;
