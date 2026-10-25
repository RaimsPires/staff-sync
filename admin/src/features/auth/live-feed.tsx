"use client";

import { useEffect } from "react";
import { loadHistory, loadToday } from "@/services/attendance";
import { connectLive } from "@/services/realtime";
import { useAuth } from "@/store/auth";
import { useLiveFeed } from "@/store/live-feed";

const POLL_MS = 10_000;
const DEBOUNCE_MS = 300;

/**
 * Keeps today's attendance current. Pushes from the WebSocket trigger a reload; while the socket is down the
 * feed falls back to polling. Pausing the board stops reloads.
 */
export function LiveFeed() {
  const allowed = useAuth((s) => s.me?.permissions.includes("attendance.view") ?? false);

  useEffect(() => {
    if (!allowed) return;
    let up = false;
    let debounce: ReturnType<typeof setTimeout> | undefined;
    const reload = () => {
      if (!useLiveFeed.getState().paused) loadToday().catch(() => undefined);
    };
    reload();
    loadHistory().catch(() => undefined);
    const stop = connectLive(
      () => {
        clearTimeout(debounce);
        debounce = setTimeout(reload, DEBOUNCE_MS);
      },
      (state) => {
        const wasDown = !up;
        up = state;
        if (state && wasDown) reload(); // catch up on anything missed while disconnected
      },
    );
    const poll = setInterval(() => {
      if (!up && document.visibilityState === "visible") reload();
    }, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && reload();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stop();
      clearInterval(poll);
      clearTimeout(debounce);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [allowed]);
  return null;
}
