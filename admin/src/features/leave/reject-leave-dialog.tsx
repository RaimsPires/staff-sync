"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { useLeave } from "@/store/leave";
import { useAccess } from "@/store/use-access";

/** Asks for a reason, then rejects the leave request. Mount it with the request id to reject. */
export function RejectLeaveDialog({ leaveId, onClose }: { leaveId: string | null; onClose: () => void }) {
  const t = useTranslations("Leave.reject");
  const toast = useToast();
  const { me } = useAccess();
  const leave = useLeave((s) => s.requests.find((l) => l.id === leaveId));
  const decide = useLeave((s) => s.decide);
  const [reason, setReason] = useState("");

  const close = () => {
    setReason("");
    onClose();
  };

  const confirm = () => {
    if (!leave || !reason.trim()) return;
    decide([leave.id], "reject", me.name, reason.trim());
    toast(t("done", { name: leave.name }), "bad");
    close();
  };

  return (
    <Modal
      open={leaveId !== null && !!leave}
      onClose={close}
      title={t("title", { name: leave?.name ?? "" })}
      footer={
        <>
          <Button onClick={close}>{t("cancel")}</Button>
          <Button variant="danger" onClick={confirm} disabled={!reason.trim()}>
            {t("confirm")}
          </Button>
        </>
      }
    >
      <label className="flex flex-col gap-1.5 text-[13px] font-medium">
        {t("reason")}
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          autoFocus
          placeholder={t("placeholder")}
          className="resize-y rounded-[9px] border border-solid border-border-strong bg-surface p-3 text-[14px] font-normal text-text outline-none focus:border-accent"
        />
        <span className="text-[12px] font-normal text-text-3">{t("hint")}</span>
      </label>
    </Modal>
  );
}
