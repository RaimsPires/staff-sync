"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/overlay";
import { controlClass } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import { requestExport, scheduleDeletion } from "@/services/billing";
import { useSettings } from "@/store/settings";

export function DangerSection() {
  const t = useTranslations("Settings.danger");
  const toast = useToast();
  const name = useSettings((s) => s.values.name);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const close = () => { setOpen(false); setTyped(""); };
  return (
    <section className="overflow-hidden rounded-xl border border-bad-dot bg-surface shadow-card">
      <div className="border-b border-border px-[18px] py-3.5"><h2 className="m-0 text-[14.5px] font-semibold text-bad">{t("title")}</h2><p className="mt-0.5 text-[12.5px] text-text-3">{t("sub")}</p></div>
      <div className="flex flex-wrap items-center gap-4 px-[18px] py-4">
        <div className="min-w-[220px] flex-1"><div className="text-[13.5px] font-semibold">{t("export.title")}</div><div className="mt-0.5 text-[12.5px] text-text-3">{t("export.desc")}</div></div>
        <Button onClick={async () => { try { const url = await requestExport(); toast(t("export.requested")); window.open(url, "_blank", "noopener"); } catch (e) { toast(e instanceof Error ? e.message : t("failed"), "bad"); } }}>{t("export.button")}</Button>
      </div>
      <div className="flex flex-wrap items-center gap-4 border-t border-border px-[18px] py-4">
        <div className="min-w-[220px] flex-1"><div className="text-[13.5px] font-semibold">{t("delete.title")}</div><div className="mt-0.5 text-[12.5px] text-text-3">{t("delete.desc", { name })}</div></div>
        <Button variant="danger" onClick={() => setOpen(true)}>{t("delete.button")}</Button>
      </div>
      <Modal open={open} onClose={close} title={t("delete.confirmTitle", { name })} className="max-w-[420px]"
        footer={<><Button onClick={close}>{t("delete.cancel")}</Button><Button variant="danger" disabled={typed !== name} onClick={async () => { try { await scheduleDeletion(typed); close(); toast(t("delete.scheduled")); } catch (e) { toast(e instanceof Error ? e.message : t("failed"), "bad"); } }}>{t("delete.button")}</Button></>}>
        <div className="flex flex-col gap-3">
          <p className="m-0 text-[13.5px] text-text-2">{t("delete.confirmMessage")}</p>
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">
            <span>{t("delete.typePrefix")} <b className="font-mono text-bad">{name}</b> {t("delete.typeSuffix")}</span>
            <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className={controlClass()} />
          </label>
        </div>
      </Modal>
    </section>
  );
}
