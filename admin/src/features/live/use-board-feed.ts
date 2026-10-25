import { useEffect, useRef, useState } from "react";
import { clockIn, onFlagged } from "@/services/attendance";
import { useLiveFeed } from "@/store/live-feed";
import { formatTime, parseTime } from "@/lib/time";

const minutesNow = (tz: string) => parseTime(clockIn(new Date().toISOString(), tz));

/**
 * Clock and "just changed" highlights for the board. The rows themselves arrive through the shared store
 * (`LiveFeed`: WebSocket pushes, polling as a fallback); pausing stops those updates.
 */
export function useBoardFeed(_siteIds: string[], paused: boolean, onFlag: (flag: { name: string; distance: string; siteName: string }) => void, timeZone = "UTC") {
  const [now, setNow] = useState(() => minutesNow(timeZone));
  const [, setTick] = useState(0);
  const freshAt = useLiveFeed((s) => s.freshAt);
  const markFresh = useLiveFeed((s) => s.markFresh);

  const flagHandler = useRef(onFlag);
  useEffect(() => {
    flagHandler.current = onFlag;
  });
  useEffect(() => onFlagged((n) => flagHandler.current(n)), []);

  useEffect(() => {
    useLiveFeed.getState().setPaused(paused);
  }, [paused]);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(minutesNow(timeZone));
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [timeZone]);

  return {
    tick: 0,
    nowMinutes: now,
    nowLabel: formatTime(now),
    /** True for five seconds after a row changed. */
    isFresh: (id: number) => freshAt[id] != null && Date.now() - freshAt[id] < 5000,
    markFresh: (id: number) => markFresh([id]),
  };
}
