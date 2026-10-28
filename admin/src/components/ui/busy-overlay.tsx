"use client";

import { useTranslations } from "next-intl";
import { useBusy } from "@/store/busy";
import { Spinner } from "./spinner";

/**
 * A full-screen dim layer with a spinner in the middle while something is saving or being sent. It sits above drawers and
 * dialogs and blocks clicks, so a form cannot be submitted twice. It appears only if the wait is noticeable (see store/busy).
 */
export function BusyOverlay() {
  const t = useTranslations("Common");
  const visible = useBusy((s) => s.visible);
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[300] grid animate-[ssFadeIn_.15s_ease-out] place-items-center bg-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="flex min-w-[170px] flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-8 py-6 shadow-pop">
        <Spinner size={34} className="border-[3px]" />
        <span className="text-[13.5px] font-medium text-text-2">{t("working")}</span>
      </div>
    </div>
  );
}
