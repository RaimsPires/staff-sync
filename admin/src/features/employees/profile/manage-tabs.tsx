"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { useOrg } from "@/lib/org";
import { cn } from "@/lib/utils";
import { adjustBalance } from "@/services/leave";
import { addNote, loadActivity, loadDevice, loadNotes, resetDevice, type PersonSchedule } from "@/services/employee-profile";
import { useLeave } from "@/store/leave";
import { useSchedule } from "@/store/schedule";
import type { Employee } from "@/types/employee";
import { useLeaveTypes } from "@/features/leave/use-leave-types";
import { dateOf, indexOfIso } from "@/features/schedules/model";
import { useLoaded } from "./use-employee-data";

const card = "rounded-xl border border-border bg-surface shadow-card";
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const fieldClass = "h-9 rounded-[9px] border border-solid border-border-strong bg-surface px-2.5 text-[13px] text-text outline-none focus:border-accent";


// ---------------------------------------------------------------- schedule

export function ScheduleTab({ emp, schedules, onSave, onRemove }: { emp: Employee; schedules: PersonSchedule[]; onSave: (s: { uuid?: string; days: number[]; start: string; end: string; site: string }) => Promise<void>; onRemove: (s: PersonSchedule) => Promise<void> }) {
  const org = useOrg();
  const t = useTranslations("Employees.profile.schedule");
  const td = useTranslations("Employees.profile.days");
  const toast = useToast();
  const shifts = useSchedule((st) => st.shifts);
  const [draft, setDraft] = useState<(PersonSchedule & { isNew?: boolean; error?: string }) | null>(null);
  const label = (s: PersonSchedule) =>
    s.days.length === 5 && s.days.every((d, i) => d === i) ? t("weekdays") : s.days.map((d) => td(DAY_KEYS[d])).join(", ");
  const fail = (e: unknown) => toast(e instanceof Error ? e.message : t("failed"), "bad");

  const save = async () => {
    if (!draft) return;
    if (draft.days.length === 0) return setDraft({ ...draft, error: t("errors.days") });
    if (draft.end <= draft.start) return setDraft({ ...draft, error: t("errors.time") });
    try {
      await onSave({ uuid: draft.isNew ? undefined : draft.uuid, days: draft.days, start: draft.start, end: draft.end, site: draft.site });
    } catch (e) {
      return fail(e);
    }
    toast(t("saved"));
    setDraft(null);
  };
  const shared = (s: PersonSchedule) => toast(t("shared", { count: s.sharedWith }), "info");

  // Interventions the planner has for this person from today on.
  const today = indexOfIso(new Date().toISOString().slice(0, 10));
  const interventions = shifts.filter((x) => x.type === "int" && x.emp === emp.name && x.d >= today).sort((a, b) => a.d - b.d || a.s - b.s).slice(0, 6);
  return (
    <div className="flex flex-wrap items-start gap-4">
      <section className={cn(card, "min-w-0 flex-[1_1_420px] px-[18px] py-4")}>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="m-0 text-[14.5px] font-semibold">{t("recurring")}</h2>
          <Button size="sm" onClick={() => setDraft({ id: Date.now(), uuid: "", sharedWith: 0, days: [0, 1, 2, 3, 4], start: "08:00", end: "16:00", site: emp.siteIds[0] ?? org.sites[0]?.id ?? "", isNew: true })}>
            <Plus size={14} /> {t("add")}
          </Button>
        </div>
        {schedules.length === 0 && <div className="py-6 text-center text-[13px] text-text-3">{t("none")}</div>}
        {schedules.map((s, i) => (
          <div key={s.uuid} className={cn("flex items-center gap-3 py-3", i > 0 && "border-t border-border")}>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-medium">{label(s)}</div>
              <div className="font-mono text-[12.5px] text-text-2">{s.start} – {s.end}</div>
            </div>
            <span className="text-[12.5px] text-text-3">{org.siteById(s.site).name}</span>
            <button onClick={() => (s.sharedWith ? shared(s) : setDraft({ ...s }))} aria-label={t("edit")} className="grid size-8 place-items-center rounded-lg border border-solid border-border bg-transparent text-text-2"><Pencil size={14} /></button>
            <button onClick={() => (s.sharedWith ? shared(s) : onRemove(s).then(() => toast(t("removed")), fail))} aria-label={t("remove")} className="grid size-8 place-items-center rounded-lg border border-solid border-border bg-transparent text-bad"><Trash2 size={14} /></button>
          </div>
        ))}
      </section>
      <section className={cn(card, "min-w-0 flex-[1_1_320px] px-[18px] py-4")}>
        <h2 className="mb-2.5 mt-0 text-[14.5px] font-semibold">{t("interventions")}</h2>
        {interventions.length === 0 && <div className="py-3 text-[13px] text-text-3">{t("noInterventions")}</div>}
        {interventions.map((x, i) => (
          <div key={x.id} className={cn("flex items-center gap-3 py-[9px] text-[13px]", i > 0 && "border-t border-border")}>
            <InterventionDate day={x.d} />
            <span className="flex-1 font-medium">{x.title || t("intervention")}</span>
            <span className="font-mono text-[12.5px] text-text-2">{minutes(x.s)} – {minutes(x.e)}</span>
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
              <label className="flex flex-col gap-1.5 text-[13px] font-medium">{t("start")}<input type="time" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value, error: undefined })} className={fieldClass} /></label>
              <label className="flex flex-col gap-1.5 text-[13px] font-medium">{t("end")}<input type="time" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value, error: undefined })} className={fieldClass} /></label>
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

const minutes = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

function InterventionDate({ day }: { day: number }) {
  const format = useFormatter();
  return <span className="w-14 font-medium">{format.dateTime(dateOf(day), { day: "numeric", month: "short", timeZone: "UTC" })}</span>;
}

// ---------------------------------------------------------------- leave

export function LeaveTab({ emp }: { emp: Employee }) {
  const t = useTranslations("Employees.profile.leave");
  const leaveTypes = useLeaveTypes();
  const tl = useTranslations("Employees.profile.leave.types");
  const format = useFormatter();
  const toast = useToast();
  const balances = useLeave((st) => st.balances);
  const requests = useLeave((st) => st.requests);
  const year = new Date().getFullYear();
  const [type, setType] = useState("");
  const [days, setDays] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const amount = parseFloat(days);
  const valid = !Number.isNaN(amount) && amount !== 0 && reason.trim().length >= 3;
  const history = requests.filter((r) => r.name === emp.name).sort((a, b) => (a.from < b.from ? 1 : -1));
  const tone = { approved: "bg-ok-bg text-ok", pending: "bg-warn-bg text-warn", rejected: "bg-bad-bg text-bad", cancelled: "bg-neutral-bg text-neutral" } as const;
  const range = (a: string, b: string) => (a === b ? format.dateTime(new Date(`${a}T00:00`), { day: "numeric", month: "short" }) : `${format.dateTime(new Date(`${a}T00:00`), { day: "numeric", month: "short" })} – ${format.dateTime(new Date(`${b}T00:00`), { day: "numeric", month: "short" })}`);
  const leaveTypeName = (k: string) => leaveTypes.label(k);
  const balanceTypes = leaveTypes.types.filter((x) => x.allowance > 0);
  const chosen = type || balanceTypes[0]?.id || "";
  const rowOf = (typeId: string) => balances[`${emp.name}|${typeId}|${year}`];

  const apply = async () => {
    const row = rowOf(chosen);
    if (!valid || !row) return toast(t("adjustFailed"), "bad");
    setBusy(true);
    try {
      await adjustBalance(row.id, amount, reason.trim(), year);
    } catch (e) {
      setBusy(false);
      return toast(e instanceof Error ? e.message : t("adjustFailed"), "bad");
    }
    setBusy(false);
    toast(t("adjusted", { type: leaveTypeName(chosen) }));
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
              const row = rowOf(lt.id);
              const total = row ? row.entitled + row.adjusted : lt.allowance;
              const left = row ? row.remaining : lt.allowance;
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
            <select value={chosen} onChange={(e) => setType(e.target.value)} aria-label={t("type")} className={fieldClass}>{balanceTypes.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select>
            <input type="number" step={0.5} value={days} onChange={(e) => setDays(e.target.value)} placeholder={t("daysPlaceholder")} aria-label={t("days")} className={fieldClass} />
          </div>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("reasonPlaceholder")} aria-label={t("reason")} className={fieldClass} />
          <Button variant="primary" onClick={apply} disabled={!valid || busy} className="self-start">{t("apply")}</Button>
        </section>
      </div>
      <section className={cn(card, "min-w-0 flex-[1_1_420px] overflow-hidden")}>
        <h2 className="m-0 border-b border-border px-4 py-3 text-[14.5px] font-semibold">{t("requests")}</h2>
        {history.length === 0 && <div className="px-4 py-8 text-center text-[13px] text-text-3">{t("noRequests")}</div>}
        {history.map((r) => (
          <div key={r.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-border px-4 py-3 text-[13px] last:border-b-0">
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

export function DeviceTab({ emp, onChanged }: { emp: Employee; onChanged: () => void }) {
  const t = useTranslations("Employees.profile.device");
  const format = useFormatter();
  const toast = useToast();
  const [asking, setAsking] = useState(false);
  const dev = useLoaded(() => loadDevice(emp.id), null, `${emp.id}:device`);
  const info = dev.value;
  const bound = !!info?.registered;
  const state = emp.app === "none" ? "none" : bound ? "bound" : emp.app === "invited" ? "awaiting" : "unbound";
  const tone = bound ? "bg-ok-bg text-ok" : state === "unbound" || state === "awaiting" ? "bg-warn-bg text-warn" : "bg-neutral-bg text-neutral";
  const when = (iso: string | null) => (iso ? format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
  const platform = info?.platform === "ios" ? "iOS" : info?.platform === "android" ? "Android" : "—";
  const facts = bound
    ? [["model", info?.model ?? "—"], ["os", platform], ["version", info?.appVersion ?? "—"], ["boundOn", when(info?.registeredAt ?? null)], ["lastSeen", when(info?.lastActiveAt ?? null)]]
    : [["model", "—"], ["version", "—"], ["lastSeen", emp.app === "none" ? t("neverBadge") : "—"], ["binding", emp.app === "none" ? t("notApplicable") : state === "unbound" ? t("resetNow") : t("notRegistered")]];

  const reset = async () => {
    try {
      await resetDevice(emp.id);
    } catch (e) {
      return toast(e instanceof Error ? e.message : t("resetFailed"), "bad");
    }
    setAsking(false);
    toast(t("resetDone"));
    dev.reload();
    onChanged();
  };

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
                <Button size="sm" variant="danger" onClick={reset}>{t("resetYes")}</Button>
                <Button size="sm" onClick={() => setAsking(false)}>{t("cancel")}</Button>
              </div>
            ) : <Button size="sm" onClick={() => setAsking(true)}>{t("reset")}</Button>}
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- documents & notes

export function DocsTab({ emp }: { emp: Employee }) {
  const t = useTranslations("Employees.profile.docs");
  const format = useFormatter();
  const toast = useToast();
  const notesState = useLoaded(() => loadNotes(emp.id), [], `${emp.id}:notes`);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const post = async () => {
    const body = text.trim();
    if (!body) return;
    setSaving(true);
    try {
      await addNote(emp.id, body);
    } catch (e) {
      setSaving(false);
      return toast(e instanceof Error ? e.message : t("failed"), "bad");
    }
    setSaving(false);
    setText("");
    notesState.reload();
  };

  return (
    <div className="flex flex-wrap items-start gap-4">
      <section className={cn(card, "min-w-0 flex-[1_1_380px] px-[18px] py-4")}>
        <h2 className="m-0 mb-2.5 text-[14.5px] font-semibold">{t("documents")}</h2>
        <div className="py-6 text-center text-[13px] text-text-3">{t("documentsSoon")}</div>
      </section>
      <section className={cn(card, "min-w-0 flex-[1_1_340px] px-[18px] py-4")}>
        <h2 className="mb-2.5 mt-0 text-[14.5px] font-semibold">{t("notes")}</h2>
        <div className="flex flex-col gap-3">
          {notesState.value.map((n) => (
            <div key={n.id} className="flex gap-2.5"><Avatar name={n.author || "?"} size={28} /><div className="min-w-0 flex-1"><div className="text-[12.5px]"><strong className="font-semibold">{n.author}</strong> <span className="text-text-3">{format.dateTime(new Date(n.at), { day: "numeric", month: "short" })}</span></div><div className="text-[13px] text-text-2">{n.body}</div></div></div>
          ))}
          {!notesState.loading && notesState.value.length === 0 && <div className="text-[13px] text-text-3">{t("noNotes")}</div>}
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder={t("notePlaceholder")} className="resize-y rounded-[9px] border border-solid border-border-strong bg-surface p-2.5 text-[13px] text-text outline-none focus:border-accent" />
          <Button size="sm" disabled={!text.trim() || saving} className="self-start" onClick={post}>{t("addNote")}</Button>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- activity

export function ActivityTab({ emp }: { emp: Employee }) {
  const t = useTranslations("Employees.profile.activity");
  const format = useFormatter();
  const activity = useLoaded(() => loadActivity(emp.id), [], `${emp.id}:activity`);
  return (
    <section className={cn(card, "overflow-hidden")}>
      <h2 className="m-0 border-b border-border px-4 py-3 text-[14.5px] font-semibold">{t("title")}</h2>
      {!activity.loading && activity.value.length === 0 && <div className="px-4 py-8 text-center text-[13px] text-text-3">{t("empty")}</div>}
      {activity.value.map((e) => (
        <div key={e.id} className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0">
          <span className="mt-1.5 size-2 flex-none rounded-full bg-accent" />
          <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium">{e.text}</div><div className="text-[12.5px] text-text-3">{e.actor && t("by", { name: e.actor })}</div></div>
          <span className="whitespace-nowrap text-[12px] text-text-3">{format.dateTime(new Date(e.at), { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      ))}
    </section>
  );
}
