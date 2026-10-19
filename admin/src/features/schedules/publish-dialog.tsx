"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/overlay";
import { Switch } from "@/components/ui/switch";

export interface PublishSummary {
  changed: number;
  deleted: number;
  employees: number;
  conflicts: number;
}

export function PublishDialog({ summary, onClose, onConfirm }: { summary: PublishSummary | null; onClose: () => void; onConfirm: (notify: boolean) => void }) {
  return summary ? <Body summary={summary} onClose={onClose} onConfirm={onConfirm} /> : null;
}

function Body({ summary, onClose, onConfirm }: { summary: PublishSummary; onClose: () => void; onConfirm: (notify: boolean) => void }) {
  const t = useTranslations("Schedules.publish");
  const [notify, setNotify] = useState(true);
  return (
    <Modal open onClose={onClose} title={t("title")} className="max-w-[460px]" footer={<><Button onClick={onClose}>{t("cancel")}</Button><Button variant="primary" onClick={() => onConfirm(notify)}>{summary.conflicts > 0 ? t("anyway") : t("confirm")}</Button></>}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2.5">
          {([["changed", summary.changed], ["deleted", summary.deleted], ["employees", summary.employees]] as const).map(([k, n]) => (
            <div key={k} className="rounded-[10px] border border-border p-3 text-center"><div className="text-[24px] font-semibold">{n}</div><div className="text-[12px] text-text-3">{t(`summary.${k}`)}</div></div>
          ))}
        </div>
        {summary.conflicts > 0 && <div role="alert" className="rounded-[10px] bg-bad-bg px-3 py-2.5 text-[13px] font-medium text-bad">{t("conflicts", { count: summary.conflicts })}</div>}
        <div className="flex items-center justify-between gap-3">
          <div><div className="text-[13.5px] font-medium">{t("notify")}</div><div className="text-[12.5px] text-text-3">{notify ? t("notifyOn", { count: summary.employees }) : t("notifyOff")}</div></div>
          <Switch checked={notify} onChange={setNotify} label={t("notify")} />
        </div>
      </div>
    </Modal>
  );
}
