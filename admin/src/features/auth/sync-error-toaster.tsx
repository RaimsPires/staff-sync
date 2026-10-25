"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import { useSyncError } from "@/store/sync-error";

/** Surfaces failed background saves (the store has already rolled the change back). */
export function SyncErrorToaster() {
  const toast = useToast();
  const message = useSyncError((s) => s.message);
  const clear = useSyncError((s) => s.clear);
  useEffect(() => {
    if (!message) return;
    toast(message, "info");
    clear();
  }, [message, toast, clear]);
  return null;
}
