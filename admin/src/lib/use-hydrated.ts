import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False during SSR and the first client render, true afterwards. Guards persisted client state. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
