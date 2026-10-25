import { useEffect } from "react";
import { refreshHeadcounts } from "@/services/org";

const EVERY_MS = 60_000;

/** Keeps the per-site headcounts fresh while a sites screen is open. */
export function useHeadcounts(): void {
  useEffect(() => {
    void refreshHeadcounts().catch(() => undefined);
    const timer = setInterval(() => void refreshHeadcounts().catch(() => undefined), EVERY_MS);
    return () => clearInterval(timer);
  }, []);
}
