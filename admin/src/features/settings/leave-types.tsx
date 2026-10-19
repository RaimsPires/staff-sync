"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/overlay";
import { Switch } from "@/components/ui/switch";
import { controlClass } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import { TYPE_COLORS } from "@/data/settings";
import { cn } from "@/lib/utils";
import { useSettings } from "@/store/settings";
import type { LeaveTypeDef } from "@/types/settings";

const GRID = "grid grid-cols-[minmax(160px,1.4fr)_80px_90px_70px_80px_70px_80px_120px] items-center gap-2.5";
interface Draft { id: string | null; name: string; color: string; paid: boolean; allowance: string; document: boolean; notice: string; half: boolean; carry: string }

const toDraft = (t: LeaveTypeDef | null): Draft =>
  t ? { ...t, allowance: String(t.allowance), notice: String(t.notice), carry: String(t.carry) }
    : { id: null, name: "", color: TYPE_COLORS[0], paid: true, allowance: "20", document: false, notice: "0", half: true, carry: "0" };

function TypeModal({ type, onClose }: { type: LeaveTypeDef | null; onClose: () => void }) {
  const t = useTranslations("Settings.leaveTypes");
  const tc = useTranslations("Settings");
  const tColor = useTranslations("Settings.colors");
  const toast = useToast();
  const saveLeaveType = useSettings((s) => s.saveLeaveType);
  const [d, setD] = useState<Draft>(() => toDraft(type));
  const [tried, setTried] = useState(false);
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  const badName = !d.name.trim();
  const badAllow = d.allowance === "" || Number(d.allowance) < 0;

  const save = () => {
    if (badName || badAllow) return setTried(true);
    saveLeaveType({ id: d.id, name: d.name.trim(), color: d.color, paid: d.paid, allowance: Number(d.allowance), document: d.document, notice: Number(d.notice) || 0, half: d.half, carry: Number(d.carry) || 0 });
    toast(t(type ? "updated" : "added"));
    onClose();
  };
  const num = (label: string, key: "allowance" | "notice" | "carry", invalid = false) => (
    <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">{label}<input type="number" value={d[key]} onChange={(e) => set({ [key]: e.target.value })} aria-invalid={invalid} className={cn(controlClass(invalid), "w-[120px] font-mono")} />{invalid && <span className="text-[12px] font-normal text-bad">{t("allowanceError")}</span>}</label>
  );
  const toggle = (label: string, key: "paid" | "document" | "half") => (
    <div className="flex items-center justify-between text-[12.5px] font-medium text-text-2">{label}<Switch checked={d[key]} label={label} onChange={(v) => set({ [key]: v })} /></div>
  );

  return (
    <Modal open onClose={onClose} title={t(type ? "editTitle" : "addTitle")} className="max-w-[460px]" footer={<><Button onClick={onClose}>{tc("cancel")}</Button><Button variant="primary" onClick={save}>{t(type ? "save" : "add")}</Button></>}>
      <div className="flex flex-col gap-3.5">
        <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">{t("name")}<input value={d.name} onChange={(e) => set({ name: e.target.value })} aria-invalid={tried && badName} autoFocus className={controlClass(tried && badName)} />{tried && badName && <span className="text-[12px] font-normal text-bad">{t("nameError")}</span>}</label>
        <div className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">
          {t("colour")}
          <div className="flex flex-wrap gap-1.5">
            {TYPE_COLORS.map((c, i) => (
              <button key={c} type="button" aria-pressed={d.color === c} onClick={() => set({ color: c })} className={cn("flex h-[30px] items-center gap-1.5 rounded-full border-[1.5px] border-solid px-[11px] text-[12.5px] font-medium text-text", d.color === c ? "border-accent bg-accent-soft" : "border-border bg-surface")}>
                <span className="size-[9px] rounded-full" style={{ background: c }} />{tColor(String(i))}
              </button>
            ))}
          </div>
        </div>
        {toggle(t("paid"), "paid")}
        {num(t("allowance"), "allowance", tried && badAllow)}
        {toggle(t("document"), "document")}
        {num(t("notice"), "notice")}
        {toggle(t("half"), "half")}
        {num(t("carry"), "carry")}
      </div>
    </Modal>
  );
}

export function LeaveTypesCard() {
  const t = useTranslations("Settings.leaveTypes");
  const toast = useToast();
  const { leaveTypes, deleteLeaveType } = useSettings();
  const [editing, setEditing] = useState<{ type: LeaveTypeDef | null } | null>(null);
  const [deleting, setDeleting] = useState<LeaveTypeDef | null>(null);
  const days = (n: number) => (n ? t("days", { count: n }) : "—");

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-[18px] py-3.5">
        <div className="min-w-[180px] flex-1"><h2 className="m-0 text-[14.5px] font-semibold">{t("title")}</h2><p className="mt-0.5 text-[12.5px] text-text-3">{t("sub")}</p></div>
        <Button variant="primary" size="sm" onClick={() => setEditing({ type: null })}>{t("add")}</Button>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className={cn(GRID, "h-[34px] bg-surface-2 px-[18px] text-[11.5px] font-semibold uppercase tracking-[.04em] text-text-3")}>
            <div>{t("columns.type")}</div><div>{t("columns.pay")}</div><div>{t("columns.daysYear")}</div><div>{t("columns.doc")}</div><div>{t("columns.notice")}</div><div>{t("columns.half")}</div><div>{t("columns.carry")}</div><div />
          </div>
          {leaveTypes.map((x) => (
            <div key={x.id} className={cn(GRID, "border-t border-border px-[18px] py-[11px] text-[13px]")}>
              <div className="flex items-center gap-[9px]"><span className="size-3 rounded" style={{ background: x.color }} /><span className="font-medium">{x.name}</span></div>
              <span>{t(x.paid ? "paidYes" : "paidNo")}</span>
              <span className="font-mono">{x.allowance}</span>
              <span>{x.document ? t("yes") : "—"}</span>
              <span>{days(x.notice)}</span>
              <span>{t(x.half ? "yes" : "no")}</span>
              <span>{days(x.carry)}</span>
              <div className="flex justify-end gap-1.5"><Button size="sm" onClick={() => setEditing({ type: x })}>{t("edit")}</Button><Button size="sm" onClick={() => setDeleting(x)} className="text-bad">{t("delete")}</Button></div>
            </div>
          ))}
        </div>
      </div>
      {editing && <TypeModal type={editing.type} onClose={() => setEditing(null)} />}
      <ConfirmDialog open={deleting !== null} danger title={t("deleteTitle", { name: deleting?.name ?? "" })} message={t("deleteMessage")} cancelLabel={t("cancel")} okLabel={t("delete")} onCancel={() => setDeleting(null)} onOk={() => { if (deleting) { deleteLeaveType(deleting.id); toast(t("deleted")); } setDeleting(null); }} />
    </section>
  );
}
