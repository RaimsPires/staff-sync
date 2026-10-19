"use client";

import { FileText, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { useOrg } from "@/lib/org";
import { cn } from "@/lib/utils";
import type { Employee } from "@/types/employee";
import { DEVICES, hashOf, LEAVE_HISTORY, LEAVE_USED, type LeaveKey, type RecurringSchedule } from "./profile-model";
import { useWorkspace, useWorkspaces, type ProfileDoc, type ProfileNote } from "@/store/employee-workspace";
import { useLeaveTypes } from "@/features/leave/use-leave-types";

const card = "rounded-xl border border-border bg-surface shadow-card";
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const fieldClass = "h-9 rounded-[9px] border border-solid border-border-strong bg-surface px-2.5 text-[13px] text-text outline-none focus:border-accent";

export interface LogEntry {
  action: string;
  detail: string;
  when: string;
}
export type AddLog = (action: string, detail: string) => void;

// ---------------------------------------------------------------- schedule

export function ScheduleTab({ emp, schedules, onChange, addLog }: { emp: Employee; schedules: RecurringSchedule[]; onChange: (s: RecurringSchedule[]) => void; addLog: AddLog }) {
  const org = useOrg();
  const t = useTranslations("Employees.profile.schedule");
  const td = useTranslations("Employees.profile.days");
  const toast = useToast();
  const [draft, setDraft] = useState<(RecurringSchedule & { isNew?: boolean; error?: string }) | null>(null);
  const label = (s: RecurringSchedule) =>
    s.days.length === 5 && s.days.every((d, i) => d === i) ? t("weekdays") : s.days.map((d) => td(DAY_KEYS[d])).join(", ");

  const save = () => {
    if (!draft) return;
    if (draft.days.length === 0) return setDraft({ ...draft, error: t("errors.days") });
    if (draft.end <= draft.start) return setDraft({ ...draft, error: t("errors.time") });
    const item: RecurringSchedule = { id: draft.id, days: draft.days, start: draft.start, end: draft.end, site: draft.site };
    onChange(draft.isNew ? [...schedules, item] : schedules.map((s) => (s.id === item.id ? item : s)));
    addLog(draft.isNew ? "scheduleAdded" : "scheduleEdited", `${label(item)} ${item.start} – ${item.end}`);
    toast(t("saved"));
    setDraft(null);
  };

  return (
    <div className="flex flex-wrap items-start gap-4">
      <section className={cn(card, "min-w-0 flex-[1_1_420px] px-[18px] py-4")}>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="m-0 text-[14.5px] font-semibold">{t("recurring")}</h2>
          <Button size="sm" onClick={() => setDraft({ id: Date.now(), days: [0, 1, 2, 3, 4], start: "08:00", end: "16:00", site: emp.siteIds[0] ?? "pd", isNew: true })}>
            <Plus size={14} /> {t("add")}
          </Button>
        </div>
        {schedules.length === 0 && <div className="py-6 text-center text-[13px] text-text-3">{t("none")}</div>}
        {schedules.map((s, i) => (
          <div key={s.id} className={cn("flex items-center gap-3 py-3", i > 0 && "border-t border-border")}>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-medium">{label(s)}</div>
              <div className="font-mono text-[12.5px] text-text-2">{s.start} – {s.end}</div>
            </div>
            <span className="text-[12.5px] text-text-3">{org.siteById(s.site).name}</span>
            <button onClick={() => setDraft({ ...s })} aria-label={t("edit")} className="grid size-8 place-items-center rounded-lg border border-solid border-border bg-transparent text-text-2"><Pencil size={14} /></button>
            <button onClick={() => { onChange(schedules.filter((x) => x.id !== s.id)); addLog("scheduleRemoved", `${label(s)} ${s.start} – ${s.end}`); toast(t("removed")); }} aria-label={t("remove")} className="grid size-8 place-items-center rounded-lg border border-solid border-border bg-transparent text-bad"><Trash2 size={14} /></button>
          </div>
        ))}
      </section>
      <section className={cn(card, "min-w-0 flex-[1_1_320px] px-[18px] py-4")}>
        <h2 className="mb-2.5 mt-0 text-[14.5px] font-semibold">{t("interventions")}</h2>
        {[{ d: "2026-10-21", k: "boiler", time: "14:00 – 17:00" }, { d: "2026-10-29", k: "audit", time: "09:00 – 11:00" }].map((x, i) => (
          <div key={x.d} className={cn("flex items-center gap-3 py-[9px] text-[13px]", i > 0 && "border-t border-border")}>
            <InterventionDate iso={x.d} />
            <span className="flex-1 font-medium">{t(`items.${x.k}`)}</span>
            <span className="font-mono text-[12.5px] text-text-2">{x.time}</span>
          </div>
        ))}
      </section>

      <Modal
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.isNew ? t("newTitle") : t("editTitle")}
        footer={<><Button onClick={() => setDraft(null)}>{t("cancel")}</Button><Button variant="primary" onClick={save}>{t("save")}</Button></>}
      >
        {draft && (
          <div className="flex flex-col gap-3.5">
            <div role="group" aria-label={t("daysLabel")} className="flex flex-wrap gap-1.5">
              {DAY_KEYS.map((k, i) => {
                const on = draft.days.includes(i);
                return (
                  <button key={k} type="button" aria-pressed={on} onClick={() => setDraft({ ...draft, error: undefined, days: on ? draft.days.filter((d) => d !== i) : [...draft.days, i].sort() })}
                    className={cn("h-9 min-w-12 rounded-lg border border-solid px-2.5 text-[13px] font-medium", on ? "border-accent bg-accent text-white" : "border-border-strong bg-surface text-text-2")}>
                    {td(k)}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <label className="flex flex-col gap-1.5 text-[13px] font-medium">{t("start")}<input type="time" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value, error: undefined })} className={cn(fieldClass, "font-mono")} /></label>
              <label className="flex flex-col gap-1.5 text-[13px] font-medium">{t("end")}<input type="time" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value, error: undefined })} className={cn(fieldClass, "font-mono")} /></label>
              <label className="flex flex-col gap-1.5 text-[13px] font-medium">{t("site")}
                <select value={draft.site} onChange={(e) => setDraft({ ...draft, site: e.target.value })} className={fieldClass}>{org.sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              </label>
            </div>
            {draft.error && <span role="alert" className="text-[12.5px] text-bad">{draft.error}</span>}
          </div>
        )}
      </Modal>
    </div>
  );
}

function InterventionDate({ iso }: { iso: string }) {
  const format = useFormatter();
  return <span className="w-14 font-medium">{format.dateTime(new Date(`${iso}T00:00`), { day: "numeric", month: "short" })}</span>;
}

// ---------------------------------------------------------------- leave

export function LeaveTab({ emp, adjustments, onAdjust, addLog }: { emp: Employee; adjustments: Partial<Record<LeaveKey, number>>; onAdjust: (type: LeaveKey, days: number) => void; addLog: AddLog }) {
  const t = useTranslations("Employees.profile.leave");
  const leaveTypes = useLeaveTypes();
  const tl = useTranslations("Employees.profile.leave.types");
  const format = useFormatter();
  const toast = useToast();
  const [type, setType] = useState<LeaveKey>("annual");
  const [days, setDays] = useState("");
  const [reason, setReason] = useState("");
  const amount = parseFloat(days);
  const valid = !Number.isNaN(amount) && amount !== 0 && reason.trim().length >= 3;
  const history = emp.status === "invited" ? [] : LEAVE_HISTORY;
  const tone = { approved: "bg-ok-bg text-ok", pending: "bg-warn-bg text-warn", rejected: "bg-bad-bg text-bad" } as const;
  const range = (a: string, b: string) => (a === b ? format.dateTime(new Date(`${a}T00:00`), { day: "numeric", month: "short" }) : `${format.dateTime(new Date(`${a}T00:00`), { day: "numeric", month: "short" })} – ${format.dateTime(new Date(`${b}T00:00`), { day: "numeric", month: "short" })}`);
  const leaveTypeName = (k: LeaveKey) => leaveTypes.label(k);
  const balanceTypes = leaveTypes.types.filter((x) => x.allowance > 0);

  const apply = () => {
    if (!valid) return;
    onAdjust(type, amount);
    addLog("balanceAdjusted", `${leaveTypeName(type)} ${amount > 0 ? "+" : ""}${amount} d · ${reason.trim()}`);
    toast(t("adjusted", { type: leaveTypeName(type) }));
    setDays("");
    setReason("");
  };

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-4">
        <section className={cn(card, "px-[18px] py-4")}>
          <h2 className="mb-3 mt-0 text-[14.5px] font-semibold">{t("balances")}</h2>
          <div className="flex flex-col gap-3.5">
            {balanceTypes.map((lt) => {
              const total = lt.allowance + (adjustments[lt.id] ?? 0);
              const left = total - (LEAVE_USED[lt.id] ?? 0);
              return (
                <div key={lt.id}>
                  <div className="mb-1 flex justify-between text-[13px]"><span className="font-medium">{lt.label}</span><span className="font-mono text-text-2">{t("left", { left: Math.round(left * 10) / 10, total })}</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-neutral-bg"><div className="h-full bg-accent" style={{ width: `${Math.max(0, Math.min(100, (left / Math.max(total, 1)) * 100))}%` }} /></div>
                </div>
              );
            })}
          </div>
        </section>
        <section className={cn(card, "flex flex-col gap-2.5 px-[18px] py-4")}>
          <h2 className="m-0 text-[14.5px] font-semibold">{t("adjust")}</h2>
          <div className="grid grid-cols-2 gap-2.5">
            <select value={type} onChange={(e) => setType(e.target.value as LeaveKey)} aria-label={t("type")} className={fieldClass}>{balanceTypes.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select>
            <input type="number" step={0.5} value={days} onChange={(e) => setDays(e.target.value)} placeholder={t("daysPlaceholder")} aria-label={t("days")} className={fieldClass} />
          </div>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("reasonPlaceholder")} aria-label={t("reason")} className={fieldClass} />
          <Button variant="primary" onClick={apply} disabled={!valid} className="self-start">{t("apply")}</Button>
        </section>
      </div>
      <section className={cn(card, "min-w-0 flex-[1_1_420px] overflow-hidden")}>
        <h2 className="m-0 border-b border-border px-4 py-3 text-[14.5px] font-semibold">{t("requests")}</h2>
        {history.length === 0 && <div className="px-4 py-8 text-center text-[13px] text-text-3">{t("noRequests")}</div>}
        {history.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-border px-4 py-3 text-[13px] last:border-b-0">
            <div><div className="font-medium">{leaveTypeName(r.type)}</div><div className="text-[12px] text-text-3">{range(r.from, r.to)}</div></div>
            <span className="font-mono text-text-2">{r.days} d</span>
            <span className={cn("rounded-md px-2 py-[3px] text-[12px] font-medium", tone[r.status])}>{tl(r.status)}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- device

export function DeviceTab({ emp, unbound, onReset, addLog, actor }: { emp: Employee; unbound: boolean; onReset: () => void; addLog: AddLog; actor: string }) {
  const t = useTranslations("Employees.profile.device");
  const toast = useToast();
  const [asking, setAsking] = useState(false);
  const bound = emp.app === "installed" && !unbound;
  const model = DEVICES[hashOf(emp.id) % 4];
  const os = model.startsWith("iPhone") ? "iOS 17.5" : "Android 14";
  const state = emp.app === "none" ? "none" : unbound ? "unbound" : emp.app === "invited" ? "awaiting" : "bound";
  const tone = bound ? "bg-ok-bg text-ok" : state === "unbound" || state === "awaiting" ? "bg-warn-bg text-warn" : "bg-neutral-bg text-neutral";
  const facts = bound
    ? [["model", model], ["os", os], ["version", "3.8.2"], ["boundOn", "4 Mar 2024"], ["lastSeen", t("today", { time: "08:12" })], ["ip", `92.184.${hashOf(emp.id) % 200}.${hashOf(`${emp.id}a`) % 250}`]]
    : [["model", "—"], ["version", "—"], ["lastSeen", emp.app === "none" ? t("neverBadge") : "—"], ["binding", emp.app === "none" ? t("notApplicable") : unbound ? t("resetNow") : t("notRegistered")]];
  const logins = bound ? [["ok", t("today", { time: "08:12" })], ["ok", t("yesterday", { time: "07:58" })], ["fail", "12 Oct 18:40"], ["ok", "12 Oct 07:55"], ["ok", "9 Oct 08:02"]] : [];

  return (
    <div className="flex flex-wrap items-start gap-4">
      <section className={cn(card, "min-w-0 flex-[1_1_340px] px-[18px] py-4")}>
        <div className="mb-3 flex items-center justify-between"><h2 className="m-0 text-[14.5px] font-semibold">{t("registered")}</h2><span className={cn("rounded-md px-2 py-[3px] text-[12px] font-medium", tone)}>{t(`state.${state}`)}</span></div>
        <dl className="m-0 grid grid-cols-2 gap-3">
          {facts.map(([k, v]) => <div key={k}><dt className="text-[11.5px] text-text-3">{t(`facts.${k}`)}</dt><dd className="m-0 text-[13px] font-medium">{v}</dd></div>)}
        </dl>
        {bound && (
          <div className="mt-4 border-t border-border pt-3.5">
            {asking ? (
              <div className="flex flex-wrap items-center gap-2 text-[13px]">
                <span className="text-text-2">{t("resetConfirm")}</span>
                <Button size="sm" variant="danger" onClick={() => { onReset(); setAsking(false); addLog("deviceReset", `${actor} · ${model}`); toast(t("resetDone")); }}>{t("resetYes")}</Button>
                <Button size="sm" onClick={() => setAsking(false)}>{t("cancel")}</Button>
              </div>
            ) : <Button size="sm" onClick={() => setAsking(true)}>{t("reset")}</Button>}
          </div>
        )}
      </section>
      <section className={cn(card, "min-w-0 flex-[1_1_380px] overflow-hidden")}>
        <h2 className="m-0 border-b border-border px-4 py-3 text-[14.5px] font-semibold">{t("logins")}</h2>
        {logins.length === 0 && <div className="px-4 py-8 text-center text-[13px] text-text-3">{t("noLogins")}</div>}
        {logins.map(([r, when], i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border px-4 py-2.5 text-[13px] last:border-b-0">
            <span className={cn("size-2 rounded-full", r === "ok" ? "bg-ok-dot" : "bg-bad-dot")} />
            <span className="flex-1">{t(r === "ok" ? "success" : "failed")}</span>
            <span className="text-text-3">{when}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- documents & notes

const BASE_DOCS: ProfileDoc[] = [
  { name: "Employment contract.pdf", meta: "184 KB · 4 Mar 2024 · Claire Vasseur" },
  { name: "ID document.jpg", meta: "1.2 MB · 4 Mar 2024 · Claire Vasseur" },
  { name: "Safety training certificate.pdf", meta: "96 KB · 2 Jun 2025 · Nadia Koné" },
];

export function DocsTab({ empId, addLog, actor }: { empId: string; addLog: AddLog; actor: string }) {
  const t = useTranslations("Employees.profile.docs");
  const toast = useToast();
  const ws = useWorkspace(empId);
  const patch = useWorkspaces((s) => s.patch);
  const docs = ws.docs ?? BASE_DOCS;
  const notes = ws.notes ?? [{ who: "Marc Olivier", when: "18 Sep", text: t("seedNote") }];
  const setDocs = (next: (d: ProfileDoc[]) => ProfileDoc[]) => patch(empId, (w) => ({ docs: next(w.docs ?? BASE_DOCS) }));
  const setNotes = (next: (n: ProfileNote[]) => ProfileNote[]) => patch(empId, (w) => ({ notes: next(w.notes ?? notes) }));
  const [text, setText] = useState("");

  return (
    <div className="flex flex-wrap items-start gap-4">
      <section className={cn(card, "min-w-0 flex-[1_1_380px] px-[18px] py-4")}>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="m-0 text-[14.5px] font-semibold">{t("documents")}</h2>
          <label className="flex h-[30px] cursor-pointer items-center gap-1.5 rounded-lg border border-solid border-border-strong bg-surface px-2.5 text-[12.5px] font-medium">
            <Upload size={14} /> {t("upload")}
            <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; setDocs((d) => [{ name: f.name, meta: `${Math.max(1, Math.round(f.size / 1024))} KB · ${t("justNow")} · ${actor}` }, ...d]); addLog("documentUploaded", f.name); toast(t("uploaded", { name: f.name })); }} />
          </label>
        </div>
        {docs.length === 0 && <div className="py-6 text-center text-[13px] text-text-3">{t("none")}</div>}
        {docs.map((d, i) => (
          <div key={d.name} className={cn("flex items-center gap-3 py-2.5", i > 0 && "border-t border-border")}>
            <span className="grid size-9 flex-none place-items-center rounded-lg bg-neutral-bg text-text-2"><FileText size={17} /></span>
            <div className="min-w-0 flex-1"><div className="truncate text-[13.5px] font-medium">{d.name}</div><div className="text-[12px] text-text-3">{d.meta}</div></div>
            <button onClick={() => { setDocs((x) => x.filter((y) => y.name !== d.name)); addLog("documentDeleted", d.name); toast(t("deleted")); }} aria-label={t("delete", { name: d.name })} className="grid size-8 place-items-center rounded-lg border border-solid border-border bg-transparent text-bad"><Trash2 size={14} /></button>
          </div>
        ))}
      </section>
      <section className={cn(card, "min-w-0 flex-[1_1_340px] px-[18px] py-4")}>
        <h2 className="mb-2.5 mt-0 text-[14.5px] font-semibold">{t("notes")}</h2>
        <div className="flex flex-col gap-3">
          {notes.map((n, i) => (
            <div key={i} className="flex gap-2.5"><Avatar name={n.who} size={28} /><div className="min-w-0 flex-1"><div className="text-[12.5px]"><strong className="font-semibold">{n.who}</strong> <span className="text-text-3">{n.when}</span></div><div className="mt-0.5 rounded-[0_10px_10px_10px] border border-border bg-surface-2 px-3 py-2 text-[13px]">{n.text}</div></div></div>
          ))}
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder={t("notePlaceholder")} className="resize-y rounded-[9px] border border-solid border-border-strong bg-surface p-2.5 text-[13px] text-text outline-none focus:border-accent" />
          <Button size="sm" disabled={!text.trim()} className="self-start" onClick={() => { const v = text.trim(); setNotes((n) => [{ who: actor, when: t("justNow"), text: v }, ...n]); addLog("noteAdded", v.slice(0, 80)); setText(""); }}>{t("addNote")}</Button>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- activity

export function ActivityTab({ emp, log, actor }: { emp: Employee; log: LogEntry[]; actor: string }) {
  const org = useOrg();
  const t = useTranslations("Employees.profile.activity");
  const model = DEVICES[hashOf(emp.id) % 4];
  const base: LogEntry[] = [
    { action: "created", detail: t("by", { name: "Claire Vasseur" }), when: "4 Mar 2024" },
    { action: "assigned", detail: t("by", { name: "Claire Vasseur" }), when: "4 Mar 2024" },
    { action: "inviteSent", detail: t("to", { value: emp.phone }), when: "4 Mar 2024" },
    { action: "deviceBound", detail: `${model} · app 3.8.2`, when: "5 Mar 2024" },
    { action: "policySet", detail: t("standard"), when: "5 Mar 2024" },
    { action: "flagApproved", detail: t("flagDetail", { name: "Nadia Koné" }), when: "12 Sep" },
  ].slice(0, emp.app === "invited" ? 3 : 6);
  const all = [...log, ...base];
  void actor;
  return (
    <section className={cn(card, "overflow-hidden")}>
      <h2 className="m-0 border-b border-border px-4 py-3 text-[14.5px] font-semibold">{t("title")}</h2>
      {all.map((e, i) => (
        <div key={i} className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0">
          <span className="mt-1.5 size-2 flex-none rounded-full bg-accent" />
          <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium">{t(`actions.${e.action}`, { site: emp.siteIds[0] ? org.siteById(emp.siteIds[0]).name : "" })}</div><div className="text-[12.5px] text-text-3">{e.detail}</div></div>
          <span className="whitespace-nowrap text-[12px] text-text-3">{e.when}</span>
        </div>
      ))}
    </section>
  );
}
