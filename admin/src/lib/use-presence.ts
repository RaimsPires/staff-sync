import { useEffect, useState } from "react";

/**
 * Keeps an overlay mounted while its exit animation plays.
 * `mounted` says whether to render; `state` feeds the `data-state` attribute the `.ss-*` classes animate on.
 */
export function usePresence(open: boolean, exitMs = 180): { mounted: boolean; state: "open" | "closed" } {
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  useEffect(() => {
    if (open) return;
    const timer = setTimeout(() => setMounted(false), exitMs);
    return () => clearTimeout(timer);
  }, [open, exitMs]);
  return { mounted: open || mounted, state: open ? "open" : "closed" };
}

const shallowEqual = (a: object, b: object) => {
  const keys = Object.keys(a) as (keyof typeof a)[];
  return keys.length === Object.keys(b).length && keys.every((k) => a[k] === (b as typeof a)[k]);
};

/** The latest value seen while `open`, so content stays put during the exit animation. */
export function useHeldWhileOpen<T extends object>(value: T, open: boolean): T {
  const [held, setHeld] = useState(value);
  if (open && !shallowEqual(held, value)) setHeld(value);
  return open ? value : held;
}
