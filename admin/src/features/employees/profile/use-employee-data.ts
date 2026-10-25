import { useCallback, useEffect, useState } from "react";

/** Load something for one employee and reload it on demand. `value` is `initial` until the first answer. */
export function useLoaded<T>(load: () => Promise<T>, initial: T, key: string) {
  const [state, setState] = useState<{ key: string; value: T; failed: boolean } | null>(null);
  const [version, setVersion] = useState(0);
  // `load` closes over the employee; `key` changes with it
  useEffect(() => {
    let live = true;
    load().then(
      (value) => live && setState({ key, value, failed: false }),
      () => live && setState({ key, value: initial, failed: true }),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const ready = state?.key === key;
  return { value: ready ? state.value : initial, loading: !ready, failed: ready && state.failed, reload };
}
