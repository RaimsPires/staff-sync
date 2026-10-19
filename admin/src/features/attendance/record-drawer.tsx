"use client";

import { Check, ChevronsRight, Trash2, TriangleAlert, UserRound, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { RecordMap } from "@/components/map/record-map";
import { Avatar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Modal, useEscape } from "@/components/ui/overlay";
import { StatusChip, STATUS_TONE, type ChipStatus } from "@/components/ui/status-chip";
import { MethodIcon, type MethodKey } from "@/components/ui/method-icon";
import { useToast } from "@/components/ui/toast";
import { DEMO_TODAY } from "@/data/live";
import { useOrg } from "@/lib/org";
import { formatDuration, parseTime, wrapDelta } from "@/lib/time";
import { cn } from "@/lib/utils";
import { useAccess } from "@/store/use-access";
import { useData } from "@/store/data";
import type { AttendanceRecord, FieldChange, HistoryEntry, RecordNote, RecordStatus } from "@/types/domain";
import { employeeCode, scheduleMinutes } from "./model";
import { useRecordView } from "./use-record-view";
import { useRuledRecords } from "@/lib/attendance-rules";

const NOW_AT = "15 Oct 10:42";
const EDIT_STATUSES: RecordStatus[] = ["ontime", "late", "early", "absent", "missing", "overtime", "leave", "holiday"];
const TONE_BG: Record<string, string> = { ok: "bg-ok-bg text-ok", warn: "bg-warn-bg text-warn", bad: "bg-bad-bg text-bad", info: "bg-info-bg text-info", orange: "bg-orange-bg text-orange", violet: "bg-violet-bg text-violet", neutral: "bg-neutral-bg text-neutral" };
const ACTUAL_TONE = { default: "text-text", warn: "text-warn", bad: "text-bad", violet: "text-violet" } as const;
const FACT_TONE = { default: "text-text", bad: "text-bad", warn: "text-warn" } as const;

const sectionTitle = "mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-3";
const secondaryButton =
  "flex h-[34px] items-center gap-[7px] whitespace-nowrap rounded-[9px] border border-solid border-border-strong bg-surface px-3 text-[13px] font-medium text-text hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50";

type EditState =
  | { mode: "times"; in: string; out: string; reason: string; tried: boolean }
  | { mode: "status"; status: RecordStatus; reason: string; tried: boolean };

/** Side panel with everything about one attendance record: times, location, timeline, edits and notes. */
export function RecordDrawer({ recordId, onClose }: { recordId: number | null; onClose: () => void }) {
  const today = useRuledRecords(useData((s) => s.today));
  const history = useRuledRecords(useData((s) => s.history));
  const record = useMemo(
    () => (recordId === null ? null : (today.find((r) => r.id === recordId) ?? history.find((r) => r.id === recordId) ?? null)),
    [recordId, today, history],
  );
  // Remount per record so edit and note drafts never leak between records.
  return record ? <DrawerBody key={record.id} record={record} onClose={onClose} /> : null;
}

function DrawerBody({ record, onClose }: { record: AttendanceRecord; onClose: () => void }) {
  const org = useOrg();
  const t = useTranslations("Drawer");
  const tStatus = useTranslations("Status");
  const tJobs = useTranslations("Data.jobs");
  const format = useFormatter();
  const router = useRouter();
  const toast = useToast();
  const { perms, me } = useAccess();
  const updateRecord = useData((s) => s.updateRecord);
  const removeRecord = useData((s) => s.removeRecord);
  const addHistory = useData((s) => s.addHistory);
  const addNote = useData((s) => s.addNote);
  const sessionHistory = useData((s) => s.recordHistory[record.id]);
  const sessionNotes = useData((s) => s.recordNotes[record.id]);
  const view = useRecordView(record, me.name, org.managerOf);

  const [edit, setEdit] = useState<EditState | null>(null);
  const [noteText, setNoteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  useEscape(!deleting, onClose);

  if (!view) return null;
  const { site, day } = view;
  const [startS, endS] = record.sched.split("–");
  const flagged = !!record.flag && !record.cleared;
  const methodKey: MethodKey | "" = view.method;

  // --- edit history & notes (seed + this session) ---
  const seedHistory: HistoryEntry[] = record.edit
    ? [{
        by: record.edit.by, at: record.edit.at, reason: record.manualReason || t(record.status === "absent" ? "seed.absentReason" : "seed.forgotReason"),
        changes: record.status === "absent" ? [{ field: "status", from: "scheduled", to: "absent" }]
          : record.method === "admin" && record.id >= 5000 ? [{ field: "record", from: "—", to: "created" }]
          : [{ field: "checkOut", from: "—", to: record.out || endS }],
      }]
    : [];
  const historyList = [...seedHistory, ...(sessionHistory ?? [])].reverse();
  const seedNotes: RecordNote[] = record.flag
    ? [{ by: org.managerOf(record.site), at: `${NOW_AT.slice(0, 6)} 09:05`, text: t(record.flag === "dist" ? "seed.noteDistance" : "seed.noteMock") }]
    : record.status === "missing"
      ? [{ by: org.managerOf(record.site), at: `${day} Oct 06:20`, text: t("seed.noteMissing") }]
      : [];
  const notes = [...seedNotes, ...(sessionNotes ?? [])];

  const events = [...view.events];
  [...historyList].reverse().forEach((h) =>
    events.push({ time: h.at.split(" ").pop() ?? "", label: t("events.editedBy", { name: h.by }), detail: h.changes.map((c) => `${fieldLabel(c.field)}: ${changeValue(c, "from")} → ${changeValue(c, "to")}`).join(" · "), color: "var(--accent)" }),
  );
  if (record.cleared) events.push({ time: "10:42", label: t("events.flagApproved"), detail: me.name, color: "var(--ok-dot)" });
  if (record.fraud) events.push({ time: "10:42", label: t("events.fraudConfirmed"), detail: me.name, color: "var(--bad-dot)" });
  if (record.approved) events.push({ time: (record.approvedAt ?? "").split(" ").pop() ?? "", label: t("events.approvedBy", { name: record.approved }), detail: "", color: "var(--ok-dot)" });

  function fieldLabel(f: FieldChange["field"]) {
    return t(`fields.${f}`);
  }
  function changeValue(c: FieldChange, side: "from" | "to") {
    const v = c[side];
    if (c.field === "status") return tStatus(v as ChipStatus);
    if (c.field === "record") return v === "created" ? t("fields.createdManually") : v;
    return v;
  }

  // --- actions ---
  const approveFlag = () => {
    updateRecord(record.id, { cleared: true, status: record.lateBy ? "late" : "ontime" });
    toast(t("toasts.flagApproved"));
  };
  const rejectFlag = () => {
    updateRecord(record.id, { fraud: true });
    toast(t("toasts.fraudConfirmed"), "bad");
  };
  const approveRecord = () => {
    updateRecord(record.id, { approved: me.name, approvedAt: NOW_AT });
    toast(t("toasts.approved"));
  };
  const checkInBehalf = () => {
    updateRecord(record.id, { in: "10:42", method: "behalf", status: "late", worked: "0m", proxyBy: me.name });
    toast(t("toasts.checkedIn", { name: record.name, time: "10:42" }));
  };
  const postNote = () => {
    const text = noteText.trim();
    if (!text) return;
    addNote(record.id, { by: me.name, at: NOW_AT, text });
    setNoteText("");
  };
  const confirmDelete = () => {
    if (!deleteReason.trim()) return;
    removeRecord(record.id);
    toast(t("toasts.deleted"), "bad");
    onClose();
  };

  const saveEdit = () => {
    if (!edit) return;
    const crossesMidnight = record.kind === "recurringN";
    const timeError = edit.mode === "times" && !!edit.in && !!edit.out && parseTime(edit.out) <= parseTime(edit.in) && !crossesMidnight;
    if (timeError) return;
    if (!edit.reason.trim()) return setEdit({ ...edit, tried: true });

    const changes: FieldChange[] =
      edit.mode === "times"
        ? ([
            { field: "checkIn", from: record.in || "—", to: edit.in || "—" },
            { field: "checkOut", from: record.out || "—", to: edit.out || "—" },
          ] as FieldChange[]).filter((c) => c.from !== c.to)
        : edit.status !== record.status ? [{ field: "status", from: record.status, to: edit.status }] : [];
    if (changes.length === 0) return setEdit(null);

    let patch: Partial<AttendanceRecord>;
    if (edit.mode === "times") {
      const [s0, e0] = scheduleMinutes(record.sched);
      let status = record.status;
      if (!["leave", "holiday"].includes(status) && edit.in) {
        const dIn = wrapDelta(parseTime(edit.in), s0);
        const dOut = edit.out ? wrapDelta(parseTime(edit.out), e0) : 0;
        status = dIn > 10 ? "late" : edit.out && dOut < -5 ? "early" : edit.out && dOut > 20 ? "overtime" : !edit.out && day < DEMO_TODAY ? "missing" : "ontime";
      }
      patch = { in: edit.in, out: edit.out, worked: edit.in && edit.out ? formatDuration(edit.in, edit.out) : "", status, edit: { by: me.name, at: NOW_AT } };
    } else {
      patch = { status: edit.status, edit: { by: me.name, at: NOW_AT }, ...(["absent", "leave", "holiday"].includes(edit.status) ? { in: "", out: "", worked: "" } : {}) };
    }
    updateRecord(record.id, patch);
    addHistory(record.id, { by: me.name, at: NOW_AT, changes, reason: edit.reason.trim() });
    setEdit(null);
    toast(t("toasts.updated"));
  };

  const editTimeError = edit?.mode === "times" && !!edit.in && !!edit.out && parseTime(edit.out) <= parseTime(edit.in) && record.kind !== "recurringN";
  const editDiffs: [string, string, string][] = !edit
    ? []
    : edit.mode === "times"
      ? ([[fieldLabel("checkIn"), record.in || "—", edit.in || "—"], [fieldLabel("checkOut"), record.out || "—", edit.out || "—"]] as [string, string, string][]).filter((d) => d[1] !== d[2])
      : edit.status !== record.status ? [[fieldLabel("status"), tStatus(record.status), tStatus(edit.status)]] : [];

  const canApproveRecord =
    (perms.review || perms.edit) && !record.approved && !flagged && record.status !== "scheduled" && !(!record.in && day === DEMO_TODAY);
  const showBehalf = !record.in && day === DEMO_TODAY && ["absent", "scheduled"].includes(record.status) && perms.behalf;

  const dateLabel = `${day === DEMO_TODAY ? `${t("today")} · ` : ""}${format.dateTime(view.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-20 bg-overlay" />
      <aside
        role="dialog"
        aria-label={t("title")}
        className="fixed bottom-0 right-0 top-0 z-[25] flex w-[560px] max-w-[100vw] animate-drawer flex-col border-l border-border bg-surface shadow-pop"
      >
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-border px-5 pb-4 pt-3.5">
          <div className="flex items-center gap-2 text-[12px] text-text-3">
            <span className="rounded-md border border-border bg-surface-2 px-[7px] py-0.5 font-mono text-[12px] font-medium">{view.recordCode}</span>
            <span>{dateLabel}</span>
            <div className="flex-1" />
            <button onClick={onClose} title={t("close")} aria-label={t("close")} className="grid size-[30px] place-items-center rounded-lg border border-solid border-border bg-transparent text-text-2 hover:bg-hover">
              <X size={15} />
            </button>
          </div>
          <div className="flex items-center gap-3.5">
            <Avatar name={record.name} size={52} />
            <div className="min-w-0 flex-1">
              <div className="text-[17px] font-semibold tracking-tight">{record.name}</div>
              <div className="text-[13px] text-text-2">
                {tJobs(record.job)} · {site.name}
              </div>
              <div className="font-mono text-[11.5px] text-text-3">
                {employeeCode(record)} · {org.branchOfSite(record.site).name}
              </div>
            </div>
            <button onClick={() => router.push("/employees")} className={secondaryButton}>
              <UserRound size={15} /> {t("viewProfile")}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusChip status={record.fraud ? "fraud" : record.status} className="h-[26px] px-2.5 text-[12.5px]" />
            <span className="inline-flex h-[26px] items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 text-[12.5px] text-text-2">
              <MethodIcon method={methodKey} className="size-4 border-0 bg-transparent" />
              {methodKey ? t(`methodShort.${methodKey}`, { name: view.proxyBy.split(" ")[0] }) : t("noCheckIn")}
            </span>
            {record.offline && <span className="inline-flex h-[26px] items-center rounded-full bg-info-bg px-2.5 text-[12.5px] font-medium text-info">{t("offline", { time: view.offlineAt })}</span>}
            {record.approved && <span className="inline-flex h-[26px] items-center rounded-full bg-ok-bg px-2.5 text-[12.5px] font-medium text-ok">{t("approvedBy", { name: record.approved })}</span>}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-[22px] overflow-auto px-5 pb-6 pt-[18px]">
          {flagged && (
            <div className="flex flex-col gap-2.5 rounded-[10px] bg-bad-bg px-3.5 py-3 text-bad">
              <div className="flex gap-2.5">
                <TriangleAlert size={18} className="mt-px flex-none" />
                <div>
                  <div className="text-[13.5px] font-semibold">{t("flag.title")}</div>
                  <div className="text-[12.5px]">{view.flagReason}</div>
                </div>
              </div>
              {perms.review ? (
                <div className="flex gap-2 pl-7">
                  <button onClick={approveFlag} className={secondaryButton}>
                    {t("flag.approve")}
                  </button>
                  <button onClick={rejectFlag} className={secondaryButton}>
                    {t("flag.reject")}
                  </button>
                </div>
              ) : (
                <div className="pl-7 text-[12px]">{t("flag.noPermission")}</div>
              )}
            </div>
          )}
          {record.fraud && (
            <div className="flex items-center gap-2.5 rounded-[10px] bg-bad-bg px-3.5 py-3 text-bad">
              <TriangleAlert size={18} />
              <div className="text-[13.5px] font-semibold">{t("flag.fraudConfirmed")}</div>
            </div>
          )}

          {/* Scheduled vs actual */}
          <section>
            <div className="flex items-baseline justify-between">
              <div className={sectionTitle}>{t("times.title")}</div>
              {perms.edit && (
                <button
                  onClick={() => setEdit({ mode: "times", in: record.in || startS, out: record.out || "", reason: "", tried: false })}
                  className="border-0 bg-transparent p-0 text-[12.5px] font-medium text-accent"
                >
                  {t("times.edit")}
                </button>
              )}
            </div>
            <div className="overflow-hidden rounded-[10px] border border-border">
              <div className="grid grid-cols-[1.1fr_1fr_1fr_1.2fr] gap-2 bg-surface-2 px-3.5 py-2 text-[11.5px] font-medium text-text-3">
                <span />
                <span>{t("times.scheduled")}</span>
                <span>{t("times.actual")}</span>
                <span className="text-right">{t("times.difference")}</span>
              </div>
              {view.times.map((row) => (
                <div key={row.key} className="grid grid-cols-[1.1fr_1fr_1fr_1.2fr] items-center gap-2 border-t border-border px-3.5 py-2.5">
                  <span className="text-[13px] text-text-2">{t(`times.${row.key}`)}</span>
                  <span className="font-mono text-[13px] text-text-3">{row.scheduled}</span>
                  <span className={cn("font-mono text-[13px] font-semibold", ACTUAL_TONE[row.actualTone])}>{row.actual}</span>
                  <span className="text-right">
                    <span className={cn("inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-medium", TONE_BG[row.diffTone])}>{row.diff}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          {edit && (
            <section className="flex animate-rise flex-col gap-3 rounded-xl border border-solid border-accent p-3.5 shadow-[0_0_0_3px_var(--accent-soft)]">
              <div className="text-[13.5px] font-semibold">{t(edit.mode === "status" ? "edit.changeStatus" : "edit.editTimes")}</div>
              {edit.mode === "times" && (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(["in", "out"] as const).map((k) => (
                      <label key={k} className="flex flex-col gap-1.5 text-[12.5px] font-medium">
                        {t(k === "in" ? "times.checkIn" : "times.checkOut")}
                        <input
                          type="time"
                          value={edit[k]}
                          onChange={(e) => setEdit({ ...edit, [k]: e.target.value })}
                          className={cn(
                            "h-9 rounded-[9px] border border-solid bg-surface px-2.5 font-mono text-[13.5px] text-text outline-none focus:border-accent",
                            k === "out" && editTimeError ? "border-bad-dot" : "border-border-strong",
                          )}
                        />
                      </label>
                    ))}
                  </div>
                  {editTimeError && <span className="-mt-1.5 text-[12.5px] text-bad">{t("edit.timeError")}</span>}
                </>
              )}
              {edit.mode === "status" && (
                <div className="flex flex-wrap gap-1.5">
                  {EDIT_STATUSES.map((k) => (
                    <button
                      key={k}
                      aria-pressed={edit.status === k}
                      onClick={() => setEdit({ ...edit, status: k })}
                      className={cn(
                        "flex h-[30px] items-center gap-1.5 rounded-full border border-solid px-2.5 text-[12.5px] font-medium text-text",
                        edit.status === k ? "border-accent bg-accent-soft" : "border-border bg-surface",
                      )}
                    >
                      <span className="size-[7px] rounded-full" style={{ background: `var(--${STATUS_TONE[k]}-dot)` }} />
                      {tStatus(k)}
                    </button>
                  ))}
                </div>
              )}
              {editDiffs.length > 0 && (
                <div className="flex flex-col gap-1 rounded-lg bg-surface-2 px-2.5 py-2 text-[12.5px]">
                  {editDiffs.map(([k, a, b]) => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="min-w-20 text-text-3">{k}</span>
                      <span className="font-mono text-text-3 line-through">{a}</span>→<span className="font-mono font-semibold">{b}</span>
                    </div>
                  ))}
                </div>
              )}
              <label className="flex flex-col gap-1.5 text-[12.5px] font-medium">
                {t("edit.reason")}
                <textarea
                  value={edit.reason}
                  onChange={(e) => setEdit({ ...edit, reason: e.target.value })}
                  rows={2}
                  placeholder={t("edit.reasonPlaceholder")}
                  className={cn("resize-y rounded-[9px] border border-solid bg-surface p-2.5 text-[13px] font-normal text-text outline-none focus:border-accent", edit.tried && !edit.reason.trim() ? "border-bad-dot" : "border-border-strong")}
                />
              </label>
              {edit.tried && !edit.reason.trim() && <span className="-mt-1.5 text-[12.5px] text-bad">{t("edit.reasonError")}</span>}
              <div className="flex justify-end gap-2">
                <button onClick={() => setEdit(null)} className={secondaryButton}>
                  {t("cancel")}
                </button>
                <button onClick={saveEdit} className={cn(secondaryButton, "border-0 bg-accent text-white hover:bg-accent-hover")}>
                  {t("edit.save")}
                </button>
              </div>
            </section>
          )}

          {/* Location */}
          <section>
            <div className={sectionTitle}>{t("location.title")}</div>
            <div className="relative z-0 aspect-[400/220] overflow-hidden rounded-[10px] border border-border bg-map-bg">
              <div className="absolute inset-0">
                <RecordMap
                  center={site.position}
                  geofence={site.geofence}
                  checkIn={view.checkInPosition ? { position: view.checkInPosition, color: view.inColor } : undefined}
                  checkOut={view.checkOutPosition ? { position: view.checkOutPosition } : undefined}
                />
              </div>
              {!view.checkInPosition && !view.checkOutPosition && (
                <div className="absolute inset-0 z-[500] grid place-items-center bg-black/5">
                  <span className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[12.5px] text-text-2">{t("location.noGps")}</span>
                </div>
              )}
            </div>
            <div className="mb-3 mt-2 flex flex-wrap gap-3.5 text-[12px] text-text-2">
              <span className="flex items-center gap-1.5">
                <span className="size-[9px] rounded-full" style={{ background: view.inColor }} />
                {t("times.checkIn")} · {view.checkInDistance}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-[9px] rounded-full bg-violet-dot" />
                {t("times.checkOut")} · {view.checkOutDistance}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rotate-45 rounded-[2px] bg-accent" />
                {t("location.center")}
              </span>
            </div>
            <div className="grid grid-cols-2 overflow-hidden rounded-[10px] border border-border">
              {view.facts.map((f) => (
                <div key={f.key} className="-mb-px -mr-px border-b border-r border-border px-3 py-2.5">
                  <div className="text-[11.5px] text-text-3">{t(`facts.${f.key}`)}</div>
                  <div className={cn("text-[13px] font-medium", FACT_TONE[f.tone])}>{f.value}</div>
                </div>
              ))}
            </div>
          </section>

          {methodKey === "app" && record.in && (
            <section>
              <div className={sectionTitle}>{t("selfies.title")}</div>
              <div className="flex gap-2.5">
                {([["checkIn", record.in], ...(record.out ? [["checkOut", record.out]] : [])] as [string, string][]).map(([k, time]) => (
                  <button key={k} onClick={() => toast(t("selfies.open"), "info")} className="w-[120px] cursor-zoom-in overflow-hidden rounded-[10px] border border-solid border-border bg-surface p-0 text-left">
                    <div className="grid aspect-[3/4] place-items-center bg-[repeating-linear-gradient(135deg,var(--surface-2)_0_8px,var(--neutral-bg)_8px_16px)] text-text-3">
                      <UserRound size={28} />
                    </div>
                    <div className="px-2 py-1.5">
                      <div className="text-[12px] font-medium text-text">{t(`selfies.${k}`)}</div>
                      <div className="font-mono text-[11px] text-text-3">{time}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Timeline */}
          <section>
            <div className={sectionTitle}>{t("timeline")}</div>
            <ol className="m-0 flex list-none flex-col p-0">
              {events.map((ev, i) => (
                <li key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="mt-1 size-2.5 flex-none rounded-full" style={{ background: ev.color }} />
                    <span className="min-h-3.5 w-px flex-1 bg-border" />
                  </div>
                  <div className="min-w-0 flex-1 pb-3">
                    <div className="text-[13px]">
                      <span className="mr-2 font-mono text-[12.5px] font-medium text-text-2">{ev.time}</span>
                      {ev.label}
                    </div>
                    {ev.detail && <div className="text-[12px] text-text-3">{ev.detail}</div>}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Edit history */}
          <section>
            <div className={sectionTitle}>{t("history.title")}</div>
            {historyList.length > 0 ? (
              <div className="flex flex-col overflow-hidden rounded-[10px] border border-border">
                {historyList.map((h, i) => (
                  <div key={i} className="flex flex-col gap-1.5 border-b border-border px-3.5 py-[11px] last:border-b-0">
                    <div className="flex items-center gap-2 text-[12.5px]">
                      <Avatar name={h.by} size={22} />
                      <strong className="font-semibold">{h.by}</strong>
                      <span className="text-text-3">{h.at}</span>
                    </div>
                    {h.changes.map((c, k) => (
                      <div key={k} className="grid grid-cols-[90px_auto_auto_1fr] items-center gap-2 pl-[30px] text-[12.5px]">
                        <span className="text-text-3">{fieldLabel(c.field)}</span>
                        <span className="rounded-md bg-bad-bg px-[7px] py-px font-mono text-bad line-through">{changeValue(c, "from")}</span>
                        <span className="rounded-md bg-ok-bg px-[7px] py-px font-mono text-ok">{changeValue(c, "to")}</span>
                        <span />
                      </div>
                    ))}
                    <div className="pl-[30px] text-[12.5px] text-text-2">“{h.reason}”</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[12.5px] text-text-3">{t("history.none")}</div>
            )}
          </section>

          {/* Notes */}
          <section>
            <div className={sectionTitle}>{t("notes.title")}</div>
            <div className="flex flex-col gap-3">
              {notes.map((n, i) => (
                <div key={i} className="flex gap-2.5">
                  <Avatar name={n.by} size={28} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px]">
                      <strong className="font-semibold">{n.by}</strong> <span className="text-text-3">{n.at}</span>
                    </div>
                    <div className="mt-0.5 rounded-[0_10px_10px_10px] border border-border bg-surface-2 px-[11px] py-2 text-[13px] text-text text-pretty">{n.text}</div>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-2.5">
                <Avatar name={me.name} size={28} />
                <div className="flex flex-1 flex-col gap-1.5">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={2}
                    placeholder={t("notes.placeholder")}
                    className="resize-y rounded-[9px] border border-solid border-border-strong bg-surface p-2.5 text-[13px] text-text outline-none focus:border-accent"
                  />
                  <button onClick={postNote} disabled={!noteText.trim()} className={cn(secondaryButton, "self-start")}>
                    {t("notes.post")}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface-2 px-5 py-3">
          {(perms.admin || perms.edit) && (
            <button onClick={() => setDeleting(true)} title={t("delete.action")} className={cn(secondaryButton, "text-bad")}>
              <Trash2 size={15} /> {t("delete.action")}
            </button>
          )}
          <div className="flex-1" />
          {perms.edit && (
            <button onClick={() => setEdit({ mode: "status", status: record.status, reason: "", tried: false })} className={secondaryButton}>
              {t("edit.changeStatus")}
            </button>
          )}
          {showBehalf && (
            <button onClick={checkInBehalf} className={cn(secondaryButton, "border-0 bg-accent text-white hover:bg-accent-hover")}>
              <ChevronsRight size={15} /> {t("checkInBehalf")}
            </button>
          )}
          {canApproveRecord && (
            <button onClick={approveRecord} className={cn(secondaryButton, "border-0 bg-accent text-white hover:bg-accent-hover")}>
              <Check size={15} /> {t("approveRecord")}
            </button>
          )}
        </div>
      </aside>

      <Modal
        open={deleting}
        onClose={() => setDeleting(false)}
        title={t("delete.title")}
        className="max-w-[420px]"
        footer={
          <>
            <Button onClick={() => setDeleting(false)}>{t("cancel")}</Button>
            <Button variant="danger" onClick={confirmDelete} disabled={!deleteReason.trim()}>
              {t("delete.confirm")}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="m-0 text-[13px] text-text-2 text-pretty">{t("delete.description", { name: record.name, day })}</p>
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium">
            {t("edit.reason")}
            <input
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder={t("delete.placeholder")}
              autoFocus
              className="h-9 rounded-[9px] border border-solid border-border-strong bg-surface px-2.5 text-[13px] font-normal text-text outline-none focus:border-accent"
            />
          </label>
        </div>
      </Modal>
    </>
  );
}
