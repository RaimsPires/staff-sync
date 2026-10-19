import { useSyncExternalStore } from "react";

function subscribe(notify: () => void) {
  window.addEventListener("online", notify);
  window.addEventListener("offline", notify);
  return () => {
    window.removeEventListener("online", notify);
    window.removeEventListener("offline", notify);
  };
}

/** Browser connectivity; assumes online on the server. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
