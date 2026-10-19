import { useEffect, useRef, useState } from "react";
import { BOARD_EVENTS, type BoardEvent } from "@/data/live";
import { formatTime } from "@/lib/time";
import { useData } from "@/store/data";

/** The board clock starts at 10:42 and advances one minute every 7 seconds. */
const START_MINUTES = 642;
const SECONDS_PER_MINUTE = 7;

/**
 * Simulated live feed for the board: the clock advances and scripted arrivals are written to the
 * shared store. Replace with a websocket subscription that calls `updateRecord`.
 */
export function useBoardFeed(siteIds: string[], paused: boolean, onFlag: (flag: NonNullable<BoardEvent["flag"]>) => void) {
  const [tick, setTick] = useState(0);
  const [fresh, setFresh] = useState<Record<number, number>>({});
  const live = useRef({ tick: 0, next: 0, paused, siteIds, onFlag });

  useEffect(() => {
    live.current.paused = paused;
    live.current.siteIds = siteIds;
    live.current.onFlag = onFlag;
  });

  useEffect(() => {
    const id = setInterval(() => {
      const s = live.current;
      s.tick += 1;
      setTick(s.tick);
      if (s.paused || s.tick % SECONDS_PER_MINUTE !== 0) return;
      const event = BOARD_EVENTS[s.next];
      if (!event) return;
      s.next += 1;
      const record = useData.getState().today.find((r) => r.id === event.id);
      if (!record || record.in || !s.siteIds.includes(event.site)) return;
      useData.getState().updateRecord(event.id, event.patch);
      setFresh((f) => ({ ...f, [event.id]: s.tick }));
      if (event.flag) s.onFlag(event.flag);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const nowMinutes = START_MINUTES + Math.floor(tick / SECONDS_PER_MINUTE);
  return {
    tick,
    nowMinutes,
    nowLabel: formatTime(nowMinutes),
    /** True for five seconds after a record was updated by the feed. */
    isFresh: (id: number) => fresh[id] != null && tick - fresh[id] < 5,
    markFresh: (id: number) => setFresh((f) => ({ ...f, [id]: live.current.tick })),
  };
}
