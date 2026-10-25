"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/overlay";
import { SelectField, TextField } from "@/components/ui/text-field";
import { useOrg, type Org } from "@/lib/org";
import { formatTime, parseTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { useSchedule } from "@/store/schedule";
import { findConflicts, indexOfIso, isoOf, type Planned, type Shift, type ShiftType } from "./model";
import { usePlanned } from "./use-planned";

export interface ShiftDraft {
  id: string | null;
  type: ShiftType;
  title: string;
  emp: string;
  site: string;
  date: string;
  start: string;
  end: string;
}

export const newDraft = (d: number, emp: string | null, site: string | null, org: Org, planned: Planned[], start = 480): ShiftDraft => ({
  id: null, type: "rec", title: "", emp: emp ?? "", site: site ?? (emp ? (planned.find((p) => p.name === emp)?.site ?? org.sites[0].id) : org.sites[0].id), date: isoOf(d),
  start: formatTime(start), end: formatTime(Math.min(1439, start + 480)),
});

export const draftOf = (x: Shift): ShiftDraft => ({ id: x.id, type: x.type, title: x.title, emp: x.emp ?? "", site: x.site, date: isoOf(x.d), start: formatTime(x.s), end: formatTime(x.e) });

/** Create or edit one shift. Warns about leave and double-booking as you type. */
export function ShiftDialog({ draft, onClose, onSaved, onDeleted }: { draft: ShiftDraft | null; onClose: () => void; onSaved: (editing: boolean) => void; onDeleted: () => void }) {
  return draft ? <Form key={draft.id ?? "new"} initial={draft} onClose={onClose} onSaved={onSaved} onDeleted={onDeleted} /> : null;
}

function Form({ initial, onClose, onSaved, onDeleted }: { initial: ShiftDraft; onClose: () => void; onSaved: (editing: boolean) => void; onDeleted: () => void }) {
  const org = useOrg();
  const planned = usePlanned();
  const t = useTranslations("Schedules.shift");
  const tj = useTranslations("Employees.titles");
  const tc = useTranslations("Schedules.conflicts");
  const shifts = useSchedule((s) => s.shifts);
  const addShift = useSchedule((s) => s.addShift);
  const updateShift = useSchedule((s) => s.updateShift);
  const removeShift = useSchedule((s) => s.removeShift);
  const [f, setF] = useState(initial);
  const [tried, setTried] = useState(false);
  const set = <K extends keyof ShiftDraft>(k: K, v: ShiftDraft[K]) => setF((x) => ({ ...x, [k]: v }));
  const editing = !!f.id;

  const errors = {
    emp: f.type === "rec" && !f.emp ? t("errors.employee") : undefined,
    time: parseTime(f.end) <= parseTime(f.start) ? t("errors.time") : undefined,
  };
  const shown: { emp?: string; time?: string } = tried ? errors : {};

  const probe: Shift | null = f.emp && !errors.time ? { id: "__draft", emp: f.emp, site: f.site, d: indexOfIso(f.date), s: parseTime(f.start), e: parseTime(f.end), type: f.type, title: "" } : null;
  const conflict = probe ? findConflicts([...shifts.filter((x) => x.id !== f.id), probe])["__draft"] : undefined;
  const warning = !conflict ? "" : conflict.kind === "leave" ? tc("leave", { name: conflict.emp }) : tc("overlap", { site: org.sites.find((s) => s.id === conflict.site)?.name ?? "", from: formatTime(conflict.from), to: formatTime(conflict.to) });

  const save = () => {
    setTried(true);
    if (errors.emp || errors.time) return;
    const data = { emp: f.emp || null, site: f.site, d: indexOfIso(f.date), s: parseTime(f.start), e: parseTime(f.end), type: f.type, title: f.type === "int" ? f.title.trim() : "" };
    if (f.id) updateShift(f.id, data);
    else addShift(data);
    onSaved(editing);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t(editing ? "editTitle" : "newTitle")}
      className="max-w-[480px]"
      footer={
        <>
          {editing && <Button variant="danger" className="mr-auto" onClick={() => { removeShift(f.id!); onDeleted(); onClose(); }}>{t("delete")}</Button>}
          <Button onClick={onClose}>{t("cancel")}</Button>
          <Button variant="primary" onClick={save}>{t(editing ? "save" : "add")}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <div role="group" aria-label={t("type")} className="flex gap-0.5 self-start rounded-[9px] border border-border p-[3px]">
          {(["rec", "int"] as const).map((k) => <button key={k} type="button" aria-pressed={f.type === k} onClick={() => set("type", k)} className={cn("h-8 rounded-md border-0 px-3.5 text-[12.5px] font-medium", f.type === k ? "bg-accent text-white" : "bg-transparent text-text-2")}>{t(`types.${k}`)}</button>)}
        </div>
        {f.type === "int" && <TextField label={t("interventionTitle")} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder={t("titlePlaceholder")} />}
        <SelectField
          label={t("employee")}
          value={f.emp}
          onChange={(e) => { const v = e.target.value; setF((x) => ({ ...x, emp: v, site: v && !x.id ? (planned.find((p) => p.name === v)?.site ?? x.site) : x.site })); }}
          error={shown.emp}
        >
          <option value="">{t("unassigned")}</option>
          {planned.map((p) => <option key={p.name} value={p.name}>{p.name} · {tj(p.title)}</option>)}
        </SelectField>
        <SelectField label={t("site")} value={f.site} onChange={(e) => set("site", e.target.value)}>
          {org.sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </SelectField>
        <div className="grid grid-cols-3 gap-3">
          <TextField label={t("date")} type="date" value={f.date} onChange={(e) => set("date", e.target.value)} />
          <TextField label={t("start")} type="time" value={f.start} onChange={(e) => set("start", e.target.value)} className="font-mono" />
          <TextField label={t("end")} type="time" value={f.end} onChange={(e) => set("end", e.target.value)} className="font-mono" />
        </div>
        {shown.time && <span role="alert" className="-mt-1.5 text-[12.5px] text-bad">{shown.time}</span>}
        {warning && <div role="alert" className="rounded-[10px] bg-bad-bg px-3 py-2.5 text-[13px] font-medium text-bad">{warning}</div>}
      </div>
    </Modal>
  );
}
