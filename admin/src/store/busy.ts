import { create } from "zustand";

/** A save that finishes within this time shows nothing at all, so quick actions do not flash a screen. */
const SHOW_AFTER_MS = 300;
/** Once shown, the indicator stays at least this long so it never blinks. */
const MIN_VISIBLE_MS = 450;

export const useBusy = create<{ visible: boolean }>(() => ({ visible: false }));

let active = 0;
let showTimer: ReturnType<typeof setTimeout> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;
let shownAt = 0;

/** Something started that the person should wait for. Calls nest: the indicator stays until every one has ended. */
export function busyStart(): void {
  active += 1;
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = undefined;
  }
  if (!useBusy.getState().visible && !showTimer) {
    showTimer = setTimeout(() => {
      showTimer = undefined;
      if (active > 0) {
        shownAt = Date.now();
        useBusy.setState({ visible: true });
      }
    }, SHOW_AFTER_MS);
  }
}

export function busyEnd(): void {
  active = Math.max(0, active - 1);
  if (active > 0) return;
  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = undefined;
  }
  if (useBusy.getState().visible) {
    hideTimer = setTimeout(() => {
      hideTimer = undefined;
      if (active === 0) useBusy.setState({ visible: false });
    }, Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt)));
  }
}

/** Show the waiting indicator while `task` runs. API saves do this by themselves; use it for other slow work. */
export async function withBusy<T>(task: Promise<T> | (() => Promise<T>)): Promise<T> {
  busyStart();
  try {
    return await (typeof task === "function" ? task() : task);
  } finally {
    busyEnd();
  }
}
