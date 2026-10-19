"use client";

import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/overlay";
import { Switch } from "@/components/ui/switch";
import { controlClass } from "@/components/ui/text-field";
import { BRANCHES, SITES } from "@/data/org";
import { cn } from "@/lib/utils";
import type { ExportKind, Frequency, ReportConfig, ReportSchedule } from "@/types/reports";
import { EMAIL, EXPORT_KINDS, FREQUENCIES, MONTH_DAYS, REPORT_PEOPLE, WEEKDAYS } from "./model";

const chip = (on: boolean) => cn("h-[30px] rounded-full border border-solid px-3 text-[12.5px] font-medium", on ? "border-accent bg-accent text-white" : "border-border-strong bg-surface text-text-2");
const seg = (on: boolean) => cn("h-[34px] flex-1 border-0 text-[13px]", on ? "bg-accent text-white" : "bg-surface text-text-2");

/** Which branches, sites and people a report covers. Empty means everything. */
export function ScopeDialog({ config, onChange, onClose }: { config: ReportConfig; onChange: (p: Partial<ReportConfig>) => void; onClose: () => void }) {
  const t = useTranslations("Reports.scope");
  const [query, setQuery] = useState("");
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const sites = SITES.filter((s) => !config.branches.length || config.branches.includes(s.branchId));
  const people = REPORT_PEOPLE.filter(([n]) => n.toLowerCase().includes(query.toLowerCase()));

  return (
    <Modal open onClose={onClose} title={<div><div>{t("title")}</div><div className="text-[12.5px] font-normal text-text-3">{t("hint")}</div></div>} className="max-w-[520px]"
      footer={<><Button variant="ghost" className="mr-auto text-accent" onClick={() => { onChange({ branches: [], sites: [], emps: [] }); setQuery(""); }}>{t("reset")}</Button><Button variant="primary" onClick={onClose}>{t("done")}</Button></>}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">{t("branches")}
          <div className="flex flex-wrap gap-1.5">{BRANCHES.map((b) => <button key={b.id} type="button" aria-pressed={config.branches.includes(b.id)} onClick={() => onChange({ branches: toggle(config.branches, b.id), sites: [] })} className={chip(config.branches.includes(b.id))}>{b.name}</button>)}</div>
        </div>
        <div className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">{t("sites")}
          <div className="flex flex-wrap gap-1.5">{sites.map((s) => <button key={s.id} type="button" aria-pressed={config.sites.includes(s.id)} onClick={() => onChange({ sites: toggle(config.sites, s.id) })} className={chip(config.sites.includes(s.id))}>{s.name}</button>)}</div>
        </div>
        <div className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">
          <span>{t("employees")} <span className="font-normal text-text-3">· {config.emps.length ? t("selected", { count: config.emps.length }) : t("all")}</span></span>
          <div className="overflow-hidden rounded-[10px] border border-border-strong">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchEmployees")} aria-label={t("searchEmployees")} className="box-border h-[34px] w-full border-0 border-b border-solid border-border bg-surface-2 px-3 text-[13px] text-text outline-none" />
            <div className="max-h-[150px] overflow-y-auto">
              {people.map(([name]) => {
                const on = config.emps.includes(name);
                return (
                  <button key={name} type="button" role="checkbox" aria-checked={on} onClick={() => onChange({ emps: toggle(config.emps, name) })} className="flex w-full items-center gap-2.5 border-0 bg-transparent px-3 py-[7px] text-left text-[13px] font-normal text-text hover:bg-hover">
                    <span className={cn("grid size-4 place-items-center rounded-[4px] border-[1.5px] border-solid text-white", on ? "border-accent bg-accent" : "border-border-strong text-transparent")}><Check size={11} strokeWidth={3.4} /></span>{name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function SaveDialog({ initialName, updating, onSave, onClose }: { initialName: string; updating: boolean; onSave: (name: string) => void; onClose: () => void }) {
  const t = useTranslations("Reports.save");
  const [name, setName] = useState(initialName);
  const [tried, setTried] = useState(false);
  const bad = !name.trim();
  return (
    <Modal open onClose={onClose} title={t(updating ? "titleUpdate" : "titleNew")} className="max-w-[400px]"
      footer={<><Button onClick={onClose}>{t("cancel")}</Button><Button variant="primary" onClick={() => (bad ? setTried(true) : onSave(name.trim()))}>{t(updating ? "update" : "save")}</Button></>}>
      <div className="flex flex-col gap-3.5">
        <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">{t("name")}<input value={name} onChange={(e) => setName(e.target.value)} autoFocus aria-invalid={tried && bad} className={controlClass(tried && bad)} />{tried && bad && <span className="text-[12px] font-normal text-bad">{t("nameError")}</span>}</label>
        <p className="m-0 text-[12.5px] text-text-3">{t("hint")}</p>
      </div>
    </Modal>
  );
}

export interface ScheduleResult { name: string; schedule: ReportSchedule }

export function ScheduleDialog({ reportName, existing, onSave, onRemove, onClose }: { reportName: string | null; existing: ReportSchedule | null; onSave: (r: ScheduleResult) => void; onRemove: () => void; onClose: () => void }) {
  const t = useTranslations("Reports.schedule");
  const tDay = useTranslations("Reports.schedule.weekdays");
  const tMonth = useTranslations("Reports.schedule.monthDays");
  const tFreq = useTranslations("Reports.schedule.freqs");
  const tFmt = useTranslations("Reports.export.formats");
  const [name, setName] = useState("");
  const [d, setD] = useState<ReportSchedule>(existing ?? { freq: "weekly", day: "monday", time: "08:00", recipients: ["claire.vasseur@staffsync.io"], format: "pdf", on: true });
  const [email, setEmail] = useState("");
  const [tried, setTried] = useState(false);
  const [emailTried, setEmailTried] = useState(false);
  const set = (p: Partial<ReportSchedule>) => setD((x) => ({ ...x, ...p }));
  const needName = reportName === null;
  const emailBad = emailTried && !!email && !EMAIL.test(email);
  const nameBad = tried && needName && !name.trim();
  const recipientsBad = tried && d.recipients.length === 0;

  const addRecipient = () => {
    const e = email.trim();
    if (!e) return;
    if (!EMAIL.test(e)) return setEmailTried(true);
    set({ recipients: d.recipients.includes(e) ? d.recipients : [...d.recipients, e] });
    setEmail(""); setEmailTried(false);
  };
  const pickFreq = (freq: Frequency) => set({ freq, day: freq === "weekly" ? "monday" : freq === "monthly" ? "1" : "" });
  const save = () => { if (d.recipients.length === 0 || (needName && !name.trim())) return setTried(true); onSave({ name: name.trim(), schedule: d }); };
  const summary = t("summary", { freq: d.freq, day: d.freq === "weekly" ? tDay(d.day as (typeof WEEKDAYS)[number]) : d.freq === "monthly" ? tMonth(d.day as (typeof MONTH_DAYS)[number]) : "", time: d.time, count: d.recipients.length, format: tFmt(d.format) });

  return (
    <Modal open onClose={onClose} title={<div><div>{t("title")}</div><div className="text-[12.5px] font-normal text-text-3">{reportName ?? t("currentReport")}</div></div>} className="max-w-[480px]"
      footer={<>{existing && <Button variant="ghost" className="mr-auto text-bad" onClick={onRemove}>{t("remove")}</Button>}<Button onClick={onClose}>{t("cancel")}</Button><Button variant="primary" onClick={save}>{t("save")}</Button></>}>
      <div className="flex flex-col gap-3.5">
        {needName && <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">{t("name")}<input value={name} onChange={(e) => setName(e.target.value)} aria-invalid={nameBad} className={controlClass(nameBad)} />{nameBad && <span className="text-[12px] font-normal text-bad">{t("nameError")}</span>}</label>}
        <div className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">{t("frequency")}
          <div role="group" className="flex overflow-hidden rounded-[9px] border border-border-strong">{FREQUENCIES.map((k) => <button key={k} type="button" aria-pressed={d.freq === k} onClick={() => pickFreq(k)} className={seg(d.freq === k)}>{tFreq(k)}</button>)}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">{t(d.freq === "daily" ? "dayDaily" : d.freq === "weekly" ? "dayWeekly" : "dayMonthly")}
            <select value={d.day} onChange={(e) => set({ day: e.target.value })} className={controlClass()}>
              {d.freq === "daily" ? <option value="">{t("everyDay")}</option> : d.freq === "weekly" ? WEEKDAYS.map((k) => <option key={k} value={k}>{tDay(k)}</option>) : MONTH_DAYS.map((k) => <option key={k} value={k}>{tMonth(k)}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">{t("sendAt")}<input type="time" value={d.time} onChange={(e) => set({ time: e.target.value })} className={controlClass()} /></label>
        </div>
        <div className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">{t("recipients")}
          <div className="flex flex-wrap gap-1.5">{d.recipients.map((r) => <span key={r} className="flex items-center gap-1.5 rounded-full bg-neutral-bg py-1 pl-2.5 pr-1.5 text-[12.5px] font-normal text-neutral">{r}<button type="button" aria-label={t("removeRecipient", { email: r })} onClick={() => set({ recipients: d.recipients.filter((x) => x !== r) })} className="grid size-[18px] place-items-center rounded-full border-0 bg-transparent p-0 text-neutral"><X size={13} /></button></span>)}</div>
          <div className="flex gap-2">
            <input value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRecipient(); } }} placeholder={t("emailPlaceholder")} aria-label={t("emailPlaceholder")} aria-invalid={emailBad} className={cn(controlClass(emailBad), "h-[34px] flex-1 text-[13px]")} />
            <Button onClick={addRecipient}>{t("add")}</Button>
          </div>
          {(recipientsBad || emailBad) && <span className="text-[12px] font-normal text-bad">{emailBad ? t("emailInvalid") : t("recipientError")}</span>}
        </div>
        <div className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">{t("format")}
          <div role="group" className="flex overflow-hidden rounded-[9px] border border-border-strong">{EXPORT_KINDS.map((k: ExportKind) => <button key={k} type="button" aria-pressed={d.format === k} onClick={() => set({ format: k })} className={seg(d.format === k)}>{tFmt(k)}</button>)}</div>
        </div>
        <div className="flex items-center justify-between gap-3"><div><div className="text-[13.5px] font-medium">{t("active")}</div><div className="text-[12.5px] text-text-3">{t("activeHint")}</div></div><Switch checked={d.on} label={t("active")} onChange={(v) => set({ on: v })} /></div>
        <div className="rounded-[10px] border border-border bg-surface-2 px-3 py-2.5 text-[12.5px] text-text-2">{summary}</div>
      </div>
    </Modal>
  );
}
