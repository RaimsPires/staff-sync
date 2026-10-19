import { useEffect, useReducer } from "react";
import { STREAM_POOL } from "@/data/live";
import { formatTime } from "@/lib/time";
import type { LiveEvent } from "@/types/domain";

interface LiveState {
  tick: number;
  seq: number;
  refreshedAt: number;
  events: LiveEvent[];
}

type Action = { type: "tick"; siteIds: string[]; emit: boolean } | { type: "refresh" };

const START: LiveState = { tick: 0, seq: 0, refreshedAt: 0, events: [] };

/** A simulated check-in or check-out arrives every 6 seconds. */
const EVENT_EVERY = 6;

function reducer(state: LiveState, action: Action): LiveState {
  if (action.type === "refresh") return { ...state, refreshedAt: state.tick };
  const tick = state.tick + 1;
  if (!action.emit || tick % EVENT_EVERY !== 0) return { ...state, tick };
  const pool = STREAM_POOL.filter((p) => action.siteIds.includes(p[1]));
  if (pool.length === 0) return { ...state, tick };
  const [name, site, act, method, status] = pool[state.seq % pool.length];
  const event: LiveEvent = { id: `lv${state.seq}`, name, site, act, method, status, time: formatTime(10 * 60 + 42 + state.seq + 1), born: tick };
  return { ...state, tick, seq: state.seq + 1, events: [event, ...state.events].slice(0, 20) };
}

/**
 * One-second heartbeat for the overview. `emit` enables the simulated activity events, which the
 * real app replaces with a websocket or polling subscription.
 */
export function useLiveFeed(active: boolean, emit: boolean, siteIds: string[]) {
  const [state, dispatch] = useReducer(reducer, START);
  const key = siteIds.join(",");
  useEffect(() => {
    if (!active) return;
    const ids = key ? key.split(",") : [];
    const id = setInterval(() => dispatch({ type: "tick", siteIds: ids, emit }), 1000);
    return () => clearInterval(id);
  }, [active, emit, key]);
  return { ...state, refresh: () => dispatch({ type: "refresh" }) };
}
