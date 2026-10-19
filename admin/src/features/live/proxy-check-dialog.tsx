"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { Modal } from "@/components/ui/overlay";
import { siteById } from "@/data/org";
import { parseTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { AttendanceRecord } from "@/types/domain";

export const PROXY_REASONS = ["noPhone", "battery", "appIssue", "forgot", "other"] as const;

export interface ProxyCheckResult {
  kind: "in" | "out";
  time: string;
  reason: string;
  note: string;
}

/** Check an employee in or out on their behalf. A reason is mandatory and the action is audited. */
export function ProxyCheckDialog({
  record,
  kind,
  defaultTime,
  actor,
  asAdmin,
  onCancel,
  onConfirm,
}: {
  record: AttendanceRecord | null;
  kind: "in" | "out";
  defaultTime: string;
  actor: string;
  asAdmin: boolean;
  onCancel: () => void;
  onConfirm: (result: ProxyCheckResult) => void;
}) {
  // Remount the form whenever a different record or direction opens so state starts fresh.
  return record ? (
    <ProxyForm key={`${record.id}-${kind}`} record={record} kind={kind} defaultTime={defaultTime} actor={actor} asAdmin={asAdmin} onCancel={onCancel} onConfirm={onConfirm} />
  ) : null;
}

function ProxyForm({
  record,
  kind,
  defaultTime,
  actor,
  asAdmin,
  onCancel,
  onConfirm,
}: {
  record: AttendanceRecord;
  kind: "in" | "out";
  defaultTime: string;
  actor: string;
  asAdmin: boolean;
  onCancel: () => void;
  onConfirm: (result: ProxyCheckResult) => void;
}) {
  const t = useTranslations("Live.proxy");
  const [time, setTime] = useState(defaultTime);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [verified, setVerified] = useState(false);
  const [tried, setTried] = useState(false);

  const invalid = tried && !reason;
  const submit = () => {
    if (!reason || !time || parseTime(time) < 0) {
      setTried(true);
      return;
    }
    onConfirm({ kind, time, reason, note });
  };

  return (
    <Modal
      open
      onClose={onCancel}
      className="max-w-[460px]"
      title={
        <div className="flex items-center gap-3">
          <Avatar name={record.name} size={40} />
          <div className="min-w-0">
            <div className="text-[16px] font-semibold">{t(kind === "in" ? "titleIn" : "titleOut")}</div>
            <div className="truncate text-[12.5px] font-normal text-text-3">
              {record.name} · {siteById(record.site).name} · {record.sched}
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <Button onClick={onCancel}>{t("cancel")}</Button>
          <Button variant="primary" onClick={submit} className={cn(!reason && "opacity-60")}>
            {t(kind === "in" ? "confirmIn" : "confirmOut")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <div className="grid grid-cols-[140px_1fr] gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium">{t("time")}</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-[38px] rounded-[9px] border border-solid border-border-strong bg-surface px-2.5 font-mono text-[14px] font-medium text-text outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium">
              {t("reason")} <span className="text-bad">*</span>
            </span>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              aria-invalid={invalid}
              className={cn(
                "h-[38px] rounded-[9px] border border-solid bg-surface px-2 text-[13.5px] text-text",
                invalid ? "border-bad-dot" : "border-border-strong",
              )}
            >
              <option value="">{t("selectReason")}</option>
              {PROXY_REASONS.map((r) => (
                <option key={r} value={r}>
                  {t(`reasons.${r}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {invalid && <span className="-mt-1.5 text-[12.5px] text-bad">{t("reasonError")}</span>}

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">
            {t("note")} <span className="font-normal text-text-3">({t("optional")})</span>
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder={t("notePlaceholder")}
            className="resize-y rounded-[9px] border border-solid border-border-strong bg-surface p-2.5 text-[13.5px] text-text outline-none focus:border-accent"
          />
        </label>

        <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-text-2">
          <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="mt-0.5 size-4 accent-accent" />
          {t("verified")}
        </label>

        <p className="m-0 rounded-lg bg-surface-2 px-3 py-2 text-[12.5px] text-text-2">
          {t("audit", { method: t(asAdmin ? "methodAdmin" : "methodProxy"), actor })}
        </p>
      </div>
    </Modal>
  );
}
