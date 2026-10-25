"use client";

import { Paperclip, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/overlay";
import { Switch } from "@/components/ui/switch";
import { SelectField, TextField } from "@/components/ui/text-field";
import { useOrg } from "@/lib/org";
import { formatTime, parseTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { useSchedule } from "@/store/schedule";
import { useToast } from "@/components/ui/toast";
import { useLeave } from "@/store/leave";
import { createSchedule, type ScheduleForm } from "@/services/schedule";
import { BASE_UTC, GROUPS, HOLIDAYS, LEAVE_DAYS, TODAY_ISO } from "./model";
import { usePlanned } from "./use-planned";

const DAY = 86_400_000;
const plusDays = (days: number) => new Date(Date.parse(TODAY_ISO) + days * DAY).toISOString().slice(0, 10);
const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
const parseDate = (s: string) => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); };

interface Form {
  tab: "rec" | "int";
  name: string;
  mode: "emp" | "group";
  group: string;
  emps: string[];
  empQuery: string;
  site: string;
  days: number[];
  start: string;
  end: string;
  cross: boolean;
  breakMin: string;
  grace: string;
  early: string;
  startDate: string;
  endDate: string;
  noEnd: boolean;
  rotation: boolean;
  phaseA: string;
  phaseB: string;
  bStart: string;
  bEnd: string;
  title: string;
  date: string;
  description: string;
  files: string[];
  priority: (typeof PRIORITIES)[number];
  notify: boolean;
}

const INITIAL: Form = {
  tab: "rec", name: "", mode: "emp", group: "", emps: [], empQuery: "", site: "", days: [0, 1, 2, 3, 4], start: "08:00", end: "16:00", cross: false,
  breakMin: "30", grace: "10", early: "5", startDate: TODAY_ISO, endDate: plusDays(90), noEnd: true, rotation: false, phaseA: "2", phaseB: "2", bStart: "20:00", bEnd: "04:00",
  title: "", date: TODAY_ISO, description: "", files: [], priority: "normal", notify: true,
};

interface Occurrence { emp: string | null; d: number; s: number; e: number; cross: boolean; iso: string }

function occurrences(f: Form): Occurrence[] {
  if (f.tab === "int") {
    if (!f.date) return [];
    const d = Math.round((parseDate(f.date) - BASE_UTC) / DAY);
    return (f.emps.length ? f.emps : [null]).map((emp) => ({ emp, d, s: parseTime(f.start), e: parseTime(f.end), cross: false, iso: f.date }));
  }
  const who = f.mode === "group" ? (GROUPS[f.group] ?? []) : f.emps;
  if (!who.length || !f.startDate || !f.days.length) return [];
  const start = parseDate(f.startDate);
  const limit = start + 27 * DAY;
  const end = f.noEnd ? limit : Math.min(parseDate(f.endDate || f.startDate), limit);
  const a = Math.max(1, Number(f.phaseA) || 1);
  const b = Math.max(1, Number(f.phaseB) || 1);
  const out: Occurrence[] = [];
  for (let t = start; t <= end; t += DAY) {
    const dow = (new Date(t).getUTCDay() + 6) % 7;
    if (!f.days.includes(dow)) continue;
    const phase = Math.floor((t - start) / (7 * DAY)) % (a + b);
    const inB = f.rotation && phase >= a;
    const s = parseTime(inB ? f.bStart : f.start);
    const e = parseTime(inB ? f.bEnd : f.end);
    who.forEach((emp) => out.push({ emp, d: Math.round((t - BASE_UTC) / DAY), s, e, cross: f.cross || e <= s, iso: new Date(t).toISOString().slice(0, 10) }));
  }
  return out;
}

export function ScheduleModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (info: { mode: "draft" | "publish"; count: number; notify: boolean; firstDay: number | null }) => void }) {
  return open ? <Body onClose={onClose} onSaved={onSaved} /> : null;
}

function Body({ onClose, onSaved }: { onClose: () => void; onSaved: (info: { mode: "draft" | "publish"; count: number; notify: boolean; firstDay: number | null }) => void }) {
  const org = useOrg();
  const t = useTranslations("Schedules.modal");
  const td = useTranslations("Schedules.days");
  const tj = useTranslations("Employees.titles");
  const format = useFormatter();
  const shifts = useSchedule((s) => s.shifts);
  const planned = usePlanned();
  const leaveRequests = useLeave((s) => s.requests);
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState<Form>(() => ({ ...INITIAL, site: org.sites[0]?.id ?? "" }));
  const [tried, setTried] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const rec = f.tab === "rec";

  const occ = useMemo(() => occurrences(f), [f]);
  const dateLabel = (iso: string) => format.dateTime(new Date(`${iso}T00:00:00Z`), { day: "numeric", month: "numeric", timeZone: "UTC" });

  const check = useMemo(() => {
    const items: { text: string; tone: "bad" | "warn" }[] = [];
    let conflicts = 0;
    occ.forEach((o) => {
      if (!o.emp) return;
      const end = o.cross ? 1440 + Math.min(o.e, o.s) : o.e;
      const name = o.emp.split(" ")[0];
      if ((LEAVE_DAYS[o.emp] ?? []).includes(o.d)) { conflicts++; items.push({ text: t("check.leave", { name, date: dateLabel(o.iso) }), tone: "bad" }); }
      const clash = shifts.find((x) => x.emp === o.emp && x.d === o.d && o.s < x.e && x.s < end);
      if (clash) { conflicts++; items.push({ text: t("check.booked", { name, from: formatTime(clash.s), to: formatTime(clash.e), date: dateLabel(o.iso) }), tone: "bad" }); }
      else if (HOLIDAYS[o.d]) items.push({ text: t("check.holiday", { date: dateLabel(o.iso), name: HOLIDAYS[o.d] }), tone: "warn" });
    });
    if (f.tab === "int" && occ.length && !occ[0].emp) items.push({ text: t("check.unassigned"), tone: "warn" });
    return { conflicts, items };
    // dateLabel/t/th are stable per render of the same locale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [occ, shifts, f.tab, leaveRequests]);

  const errors: Record<string, string> = {};
  if (rec) {
    if (!f.name.trim()) errors.name = t("errors.name");
    if (f.mode === "emp" && f.emps.length === 0) errors.who = t("errors.who");
    if (f.days.length === 0) errors.days = t("errors.days");
    if (!f.cross && parseTime(f.end) <= parseTime(f.start)) errors.time = t("errors.endAfterStart");
    if (f.cross && parseTime(f.end) === parseTime(f.start)) errors.time = t("errors.identical");
    if (!f.startDate) errors.dates = t("errors.startDate");
    else if (!f.noEnd && (!f.endDate || parseDate(f.endDate) < parseDate(f.startDate))) errors.dates = t("errors.endDate");
    if (f.rotation && parseTime(f.bEnd) === parseTime(f.bStart)) errors.time = `${errors.time ? `${errors.time} · ` : ""}${t("errors.phaseB")}`;
  } else {
    if (!f.title.trim()) errors.title = t("errors.title");
    if (!f.date) errors.date = t("errors.date");
    if (parseTime(f.end) <= parseTime(f.start)) errors.time = t("errors.endAfterStart");
  }
  const err = (k: string) => (tried ? errors[k] : undefined);

  const submit = async (mode: "draft" | "publish") => {
    setTried(true);
    if (Object.keys(errors).length > 0 || saving) return;
    const form: ScheduleForm = {
      kind: f.tab, title: rec ? f.name.trim() : f.title.trim(), site: f.site, employees: rec && f.mode === "group" ? (GROUPS[f.group] ?? []) : f.emps,
      days: f.days, start: f.start, end: f.end, crossesMidnight: f.cross, breakMin: Number(f.breakMin) || 0, graceMin: Number(f.grace) || 0, earlyMin: Number(f.early) || 0,
      startDate: f.startDate, endDate: f.noEnd ? null : f.endDate,
      rotation: rec && f.rotation ? { weeksA: Math.max(1, Number(f.phaseA) || 1), weeksB: Math.max(1, Number(f.phaseB) || 1), bStart: f.bStart, bEnd: f.bEnd } : null,
      date: f.date, instructions: f.description.trim(), priority: f.priority === "urgent" ? "high" : f.priority,
    };
    setSaving(true);
    try {
      const count = await createSchedule(form, mode === "publish", f.notify);
      onSaved({ mode, count, notify: f.tab === "int" && f.notify && mode === "publish", firstDay: occ[0]?.d ?? null });
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("failed"), "bad");
      setSaving(false);
    }
  };

  const bad = check.conflicts > 0;
  const warn = check.items.length > 0;
  const summary = occ.length
    ? `${rec ? t("check.shifts", { count: occ.length, span: f.noEnd ? t("check.fourWeeks") : t("check.period") }) : t("check.assignments", { count: occ.length })} · ${bad ? t("check.conflicts", { count: check.conflicts }) : warn ? t("check.notes", { count: check.items.length }) : t("check.none")}`
    : t(rec ? "check.promptRec" : "check.promptInt");
  const people = planned.filter((p) => p.name.toLowerCase().includes(f.empQuery.toLowerCase()));
  const groupSize = (GROUPS[f.group] ?? []).length;
  const phases = Array.from({ length: Math.min(10, Math.max(1, Number(f.phaseA) || 1) + Math.max(1, Number(f.phaseB) || 1)) }, (_, i) => ({ b: i >= Math.max(1, Number(f.phaseA) || 1), i }));

  const label = "flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2";
  const row = "flex items-center justify-between gap-3";

  return (
    <Modal
      open
      onClose={onClose}
      className="max-w-[720px]"
      title={
        <div className="flex flex-col gap-3">
          <span>{t("title")}</span>
          <div role="tablist" className="-mb-4 flex gap-0.5">
            {(["rec", "int"] as const).map((k) => <button key={k} role="tab" aria-selected={f.tab === k} onClick={() => { set("tab", k); setTried(false); }} className={cn("-mb-px h-[38px] border-0 border-b-2 border-solid bg-transparent px-4 text-[13.5px]", f.tab === k ? "border-b-accent font-semibold text-text" : "border-b-transparent font-medium text-text-2")}>{t(`tabs.${k}`)}</button>)}
          </div>
        </div>
      }
      footer={
        <>
          <span className="mr-auto self-center text-[12.5px] text-text-3">{rec ? t("appliesTo", { who: f.mode === "group" ? t("employees", { count: groupSize }) : t("employees", { count: f.emps.length }) }) : t("priorityLabel", { priority: t(`priorities.${f.priority}`) })}</span>
          <Button onClick={onClose}>{t("cancel")}</Button>
          <Button disabled={saving} onClick={() => submit("draft")}>{t("saveDraft")}</Button>
          <Button variant="primary" disabled={saving} onClick={() => submit("publish")}>{bad ? t("publishAnyway") : t("publish")}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {tried && Object.keys(errors).length > 0 && <div role="alert" className="rounded-[10px] bg-bad-bg px-3 py-2.5 text-[13px] font-medium text-bad">{t("fixFields")}</div>}

        {rec ? (
          <>
            <TextField label={t("name")} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder={t("namePlaceholder")} error={err("name")} />
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-medium text-text-2">{t("who")}</span>
                <div role="group" aria-label={t("who")} className="flex gap-0.5 rounded-[9px] border border-border p-[3px]">
                  {(["emp", "group"] as const).map((m) => <button key={m} type="button" aria-pressed={f.mode === m} onClick={() => set("mode", m)} className={cn("h-7 rounded-md border-0 px-3 text-[12.5px] font-medium", f.mode === m ? "bg-accent text-white" : "bg-transparent text-text-2")}>{t(`modes.${m}`)}</button>)}
                </div>
              </div>
              {f.mode === "group" ? (
                <select value={f.group} onChange={(e) => set("group", e.target.value)} aria-label={t("group")} className="h-10 rounded-[9px] border border-solid border-border-strong bg-surface px-3 text-[14px] text-text">
                  {Object.entries(GROUPS).map(([g, list]) => <option key={g} value={g}>{g} · {list.length}</option>)}
                </select>
              ) : (
                <>
                  <input value={f.empQuery} onChange={(e) => set("empQuery", e.target.value)} placeholder={t("searchEmployees")} aria-label={t("searchEmployees")} className="h-9 rounded-[9px] border border-solid border-border-strong bg-surface px-3 text-[13px] text-text outline-none focus:border-accent" />
                  <div className={cn("max-h-40 overflow-auto rounded-[10px] border", err("who") ? "border-bad-dot" : "border-border")}>
                    {people.map((p) => {
                      const on = f.emps.includes(p.name);
                      return (
                        <label key={p.name} className="flex cursor-pointer items-center gap-2.5 border-b border-border px-3 py-2 text-[13px] last:border-b-0 hover:bg-hover">
                          <input type="checkbox" checked={on} onChange={() => set("emps", on ? f.emps.filter((x) => x !== p.name) : [...f.emps, p.name])} className="m-0 size-4 accent-accent" />
                          <span className="flex-1">{p.name}</span><span className="text-text-3">{tj(p.title)}</span>
                        </label>
                      );
                    })}
                  </div>
                  {err("who") && <span className="text-[12.5px] text-bad">{err("who")}</span>}
                </>
              )}
            </div>
            <SelectField label={t("site")} value={f.site} onChange={(e) => set("site", e.target.value)}>{org.sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</SelectField>
            <div className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-medium text-text-2">{t("days")}</span>
              <div role="group" aria-label={t("days")} className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((k, i) => { const on = f.days.includes(i); return <button key={k} type="button" aria-pressed={on} onClick={() => set("days", on ? f.days.filter((d) => d !== i) : [...f.days, i].sort())} className={cn("h-9 min-w-12 rounded-lg border border-solid px-2.5 text-[13px] font-medium", on ? "border-accent bg-accent text-white" : "border-border-strong bg-surface text-text-2")}>{td(k)}</button>; })}
              </div>
              {err("days") && <span className="text-[12.5px] text-bad">{err("days")}</span>}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <TextField label={t("start")} type="time" value={f.start} onChange={(e) => set("start", e.target.value)} className="font-mono" error={err("time")} />
              <TextField label={t("end")} type="time" value={f.end} onChange={(e) => set("end", e.target.value)} className="font-mono" />
              <TextField label={t("break")} type="number" min={0} value={f.breakMin} onChange={(e) => set("breakMin", e.target.value)} />
              <TextField label={t("grace")} type="number" min={0} value={f.grace} onChange={(e) => set("grace", e.target.value)} />
            </div>
            <TextField label={t("earlyLeave")} type="number" min={0} value={f.early} onChange={(e) => set("early", e.target.value)} fieldClassName="max-w-40" />
            <div className={row}><div><div className="text-[13.5px] font-medium">{t("crossesMidnight")}</div><div className="text-[12.5px] text-text-3">{t(f.cross ? "crossOn" : "crossOff")}</div></div><Switch checked={f.cross} onChange={(v) => set("cross", v)} label={t("crossesMidnight")} /></div>
            <div className="grid grid-cols-2 gap-3">
              <TextField label={t("startDate")} type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} />
              <TextField label={t("endDate")} type="date" value={f.endDate} disabled={f.noEnd} onChange={(e) => set("endDate", e.target.value)} />
            </div>
            {err("dates") && <span className="-mt-2 text-[12.5px] text-bad">{err("dates")}</span>}
            <div className={row}><div className="text-[13.5px] font-medium">{t("noEnd")}</div><Switch checked={f.noEnd} onChange={(v) => set("noEnd", v)} label={t("noEnd")} /></div>
            <div className={row}><div><div className="text-[13.5px] font-medium">{t("rotation")}</div><div className="text-[12.5px] text-text-3">{t(f.rotation ? "rotationOn" : "rotationOff")}</div></div><Switch checked={f.rotation} onChange={(v) => set("rotation", v)} label={t("rotation")} /></div>
            {f.rotation && (
              <div className="flex flex-col gap-3 rounded-[10px] border border-border bg-surface-2 p-3.5">
                <div className="grid grid-cols-4 gap-3">
                  <TextField label={t("phaseA")} type="number" min={1} value={f.phaseA} onChange={(e) => set("phaseA", e.target.value)} />
                  <TextField label={t("phaseB")} type="number" min={1} value={f.phaseB} onChange={(e) => set("phaseB", e.target.value)} />
                  <TextField label={t("bStart")} type="time" value={f.bStart} onChange={(e) => set("bStart", e.target.value)} className="font-mono" />
                  <TextField label={t("bEnd")} type="time" value={f.bEnd} onChange={(e) => set("bEnd", e.target.value)} className="font-mono" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {phases.map(({ b, i }) => <span key={i} className={cn("rounded-md px-2 py-1 font-mono text-[11.5px]", b ? "bg-violet-bg text-violet" : "bg-accent-soft text-accent")}>{t("week", { n: i + 1 })} · {b ? `B ${f.bStart}–${f.bEnd}` : `A ${f.start}–${f.end}`}</span>)}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <TextField label={t("interventionTitle")} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder={t("titlePlaceholder")} error={err("title")} />
            <SelectField label={t("site")} value={f.site} onChange={(e) => set("site", e.target.value)}>{org.sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</SelectField>
            <div className="grid grid-cols-3 gap-3">
              <TextField label={t("date")} type="date" value={f.date} onChange={(e) => set("date", e.target.value)} error={err("date")} />
              <TextField label={t("start")} type="time" value={f.start} onChange={(e) => set("start", e.target.value)} className="font-mono" />
              <TextField label={t("end")} type="time" value={f.end} onChange={(e) => set("end", e.target.value)} className="font-mono" error={err("time")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-medium text-text-2">{t("assignees")} <span className="font-normal text-text-3">({t("optional")})</span></span>
              <div className="flex flex-wrap gap-1.5">
                {planned.map((p) => { const on = f.emps.includes(p.name); return <button key={p.name} type="button" aria-pressed={on} onClick={() => set("emps", on ? f.emps.filter((x) => x !== p.name) : [...f.emps, p.name])} className={cn("h-8 rounded-full border border-solid px-3 text-[12.5px] font-medium", on ? "border-accent bg-accent text-white" : "border-border-strong bg-surface text-text-2")}>{p.name}</button>; })}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-medium text-text-2">{t("priority")}</span>
              <div role="group" aria-label={t("priority")} className="flex gap-0.5 self-start rounded-[9px] border border-border p-[3px]">
                {PRIORITIES.map((p) => <button key={p} type="button" aria-pressed={f.priority === p} onClick={() => set("priority", p)} className={cn("h-8 rounded-md border-0 px-3 text-[12.5px] font-medium", f.priority === p ? (p === "urgent" ? "bg-bad-dot text-white" : p === "high" ? "bg-warn-dot text-white" : "bg-accent text-white") : "bg-transparent text-text-2")}>{t(`priorities.${p}`)}</button>)}
              </div>
            </div>
            <label className={label}>{t("instructions")}<textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder={t("instructionsPlaceholder")} className="resize-y rounded-[9px] border border-solid border-border-strong bg-surface p-2.5 text-[13.5px] font-normal text-text outline-none focus:border-accent" /></label>
            <div className="flex flex-col gap-1.5">
              <label className="flex cursor-pointer items-center gap-2 self-start rounded-lg border border-dashed border-border-strong px-3 py-2 text-[13px] text-text-2 hover:border-accent">
                <Paperclip size={15} /> {t("attach")}
                <input type="file" multiple className="hidden" onChange={(e) => { const names = [...(e.target.files ?? [])].map((x) => x.name); e.target.value = ""; set("files", [...f.files, ...names.filter((n) => !f.files.includes(n))]); }} />
              </label>
              {f.files.map((n) => <div key={n} className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-[12.5px]"><span className="flex-1 truncate">{n}</span><button onClick={() => set("files", f.files.filter((x) => x !== n))} aria-label={t("remove", { name: n })} className="grid size-6 place-items-center border-0 bg-transparent text-text-3"><X size={13} /></button></div>)}
            </div>
            <div className={row}><div><div className="text-[13.5px] font-medium">{t("notify")}</div><div className="text-[12.5px] text-text-3">{t(f.notify ? "notifyOn" : "notifyOff")}</div></div><Switch checked={f.notify} onChange={(v) => set("notify", v)} label={t("notify")} /></div>
          </>
        )}

        <div role="status" className={cn("rounded-[10px] border border-solid px-3.5 py-3", bad ? "border-bad-dot bg-bad-bg text-bad" : warn ? "border-warn-dot bg-warn-bg text-warn" : "border-ok-dot bg-ok-bg text-ok")}>
          <div className="text-[13px] font-semibold">{summary}</div>
          {check.items.slice(0, 5).map((it, i) => <div key={i} className="mt-1 flex items-start gap-2 text-[12.5px]"><span className="mt-1.5 size-1.5 flex-none rounded-full" style={{ background: it.tone === "bad" ? "var(--bad-dot)" : "var(--warn-dot)" }} />{it.text}</div>)}
          {check.items.length > 5 && <div className="mt-1 text-[12.5px]">{t("check.more", { count: check.items.length - 5 })}</div>}
        </div>
      </div>
    </Modal>
  );
}
