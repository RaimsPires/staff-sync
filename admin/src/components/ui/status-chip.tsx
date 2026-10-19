"use client";

import { useTranslations } from "next-intl";
import { Chip, type Tone } from "@/components/ui/chip";
import type { RecordStatus } from "@/types/domain";

export type ChipStatus = RecordStatus | "pending" | "approved" | "rejected" | "cancelled" | "fraud";

export const STATUS_TONE: Record<ChipStatus, Tone> = {
  ontime: "ok",
  late: "warn",
  early: "warn",
  absent: "bad",
  missing: "orange",
  overtime: "violet",
  leave: "info",
  holiday: "neutral",
  flagged: "bad",
  scheduled: "neutral",
  pending: "warn",
  approved: "ok",
  rejected: "bad",
  cancelled: "neutral",
  fraud: "bad",
};

/** Attendance or request status as a coloured pill with the translated label. */
export function StatusChip({ status, className }: { status: ChipStatus; className?: string }) {
  const t = useTranslations("Status");
  return (
    <Chip tone={STATUS_TONE[status]} className={className}>
      {t(status)}
    </Chip>
  );
}
