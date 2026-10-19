"use client";

import { Paperclip, Search, TriangleAlert, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/overlay";
import { StatusChip } from "@/components/ui/status-chip";
import { useToast } from "@/components/ui/toast";
import { RECORDS } from "@/data/records";
import { useOrg } from "@/lib/org";
import { DEMO_TODAY } from "@/data/live";
import { formatDuration, parseTime, wrapDelta } from "@/lib/time";
import { cn } from "@/lib/utils";
import { useData } from "@/store/data";
import type { AttendanceRecord, RecordStatus } from "@/types/domain";
import { employeeCode, newManualId, withDate } from "./model";

const STATUSES: RecordStatus[] = ["ontime", "late", "early", "absent", "missing", "overtime", "leave", "holiday"];
const NO_TIMES: RecordStatus[] = ["absent", "leave", "holiday"];
const field = "h-[38px] rounded-[9px] border border-solid bg-surface px-2.5 text-[13.5px] text-text outline-none focus:border-accent";

interface FileInfo {
  name: string;
  size: number;
}

const fileSize = (b: number) => (b > 1_048_576 ? `${(b / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** Creates a record for someone who could not check in. A reason is mandatory and overlaps are blocked. */
export function AddRecordDialog({
  open,
  onClose,
  siteIds,
  actor,
  onOpenRecord,
}: {
  open: boolean;
  onClose: () => void;
  siteIds: string[];
  actor: string;
  onOpenRecord: (id: number) => void;
}) {
  return open ? <Form siteIds={siteIds} actor={actor} onClose={onClose} onOpenRecord={onOpenRecord} /> : null;
}

function Form({ siteIds, actor, onClose, onOpenRecord }: { siteIds: string[]; actor: string; onClose: () => void; onOpenRecord: (id: number) => void }) {
  const org = useOrg();
  const t = useTranslations("Attendance.add");
  const tStatus = useTranslations("Status");
  const tJobs = useTranslations("Data.jobs");
  const tKinds = useTranslations("Drawer.kinds");
  const toast = useToast();
  const today = useData((s) => s.today);
  const history = useData((s) => s.history);
  const addRecord = useData((s) => s.addRecord);

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [empId, setEmpId] = useState<number | null>(null);
  const [site, setSite] = useState("");
  const [date, setDate] = useState("2026-10-15");
  const [timeIn, setTimeIn] = useState("08:00");
  const [timeOut, setTimeOut] = useState("17:00");
  const [status, setStatus] = useState<"auto" | RecordStatus>("auto");
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [tried, setTried] = useState(false);

  const base = empId ? (RECORDS.find((r) => r.id === empId) ?? null) : null;
  const q = query.trim().toLowerCase();
  const results = useMemo(
    () => RECORDS.filter((r) => siteIds.includes(r.site)).filter((r) => !q || r.name.toLowerCase().includes(q) || employeeCode(r).toLowerCase().includes(q)).slice(0, 6),
    [q, siteIds],
  );

  const noTimes = status !== "auto" && NO_TIMES.includes(status);
  const day = Number(date.slice(8, 10));
  const crossesMidnight = base?.kind === "recurringN";
  const timeError = !noTimes && !!timeIn && !!timeOut && parseTime(timeOut) <= parseTime(timeIn) && !crossesMidnight;
  const inError = tried && !noTimes && !timeIn;

  const overlap = useMemo<AttendanceRecord | null>(() => {
    if (!base || !day) return null;
    const ni = parseTime(timeIn);
    const no0 = timeOut ? parseTime(timeOut) : ni + 1;
    const no = no0 <= ni ? no0 + 1440 : no0;
    const all = [...today.map(withDate), ...history];
    return (
      all.filter((r) => (r.emp || r.id) === base.id && (r.date ?? DEMO_TODAY) === day).find((r) => {
        if (!r.in || noTimes) return true;
        const ri = parseTime(r.in);
        let ro = r.out ? parseTime(r.out) : parseTime(r.sched.split("–")[1]);
        if (ro <= ri) ro += 1440;
        return ni < ro && ri < no;
      }) ?? null
    );
  }, [base, day, timeIn, timeOut, noTimes, today, history]);

  const sched = base?.sched ?? "08:00–17:00";
  const [ss, se] = sched.split("–");
  const auto: RecordStatus | null =
    !timeIn || noTimes ? null
    : wrapDelta(parseTime(timeIn), parseTime(ss)) > 10 ? "late"
    : timeOut && wrapDelta(parseTime(timeOut), parseTime(se)) < -5 ? "early"
    : timeOut && wrapDelta(parseTime(timeOut), parseTime(se)) > 20 ? "overtime"
    : !timeOut && day < DEMO_TODAY ? "missing"
    : "ontime";

  const errors = [!base, timeError, inError, !!overlap, !reason.trim()].filter(Boolean).length;

  const save = () => {
    if (errors > 0 || !base) return setTried(true);
    const finalStatus: RecordStatus = status === "auto" ? (auto ?? "ontime") : status;
    const record: AttendanceRecord = {
      ...base,
      id: newManualId(history),
      emp: base.id,
      date: day,
      site: site || base.site,
      in: noTimes ? "" : timeIn,
      out: noTimes ? "" : timeOut,
      worked: !noTimes && timeIn && timeOut ? formatDuration(timeIn, timeOut) : "",
      status: finalStatus,
      method: "admin",
      edit: { by: actor, at: "15 Oct 10:42" },
      manualReason: reason.trim(),
      evidence: files,
      offline: false,
      flag: undefined,
      dist: undefined,
      lateBy: undefined,
      cleared: false,
      fraud: false,
    };
    addRecord(record);
    toast(`${t("added", { name: base.name })}${files.length ? ` · ${t("filesAttached", { count: files.length })}` : ""}`);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t("title")}
      className="max-w-[560px]"
      footer={
        <>
          <Button onClick={onClose}>{t("cancel")}</Button>
          <Button variant="primary" onClick={save} className={cn(overlap && "opacity-50")}>
            {t("save")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        {tried && errors > 0 && (
          <div role="alert" className="flex items-center gap-2 rounded-[10px] bg-bad-bg px-3 py-2.5 text-[13px] font-medium text-bad">
            <TriangleAlert size={15} /> {t("summary", { count: errors })}
          </div>
        )}

        {/* Employee */}
        <div className="relative flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">{t("employee")}</span>
          {base ? (
            <div className="flex items-center gap-2.5 rounded-[9px] border border-border bg-surface-2 px-3 py-2">
              <Avatar name={base.name} size={32} />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{base.name}</div>
                <div className="text-[12px] text-text-3">
                  {employeeCode(base)} · {tJobs(base.job)} · {base.sched}
                </div>
              </div>
              <button onClick={() => { setEmpId(null); setSearchOpen(true); }} className="border-0 bg-transparent text-[12.5px] font-medium text-accent">
                {t("change")}
              </button>
            </div>
          ) : (
            <>
              <label className={cn("flex h-[38px] items-center gap-2 rounded-[9px] border border-solid bg-surface px-3 text-text-3", tried ? "border-bad-dot" : "border-border-strong")}>
                <Search size={15} />
                <input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder={t("searchPlaceholder")}
                  aria-label={t("employee")}
                  className="min-w-0 flex-1 border-0 bg-transparent text-[14px] text-text outline-0"
                />
              </label>
              {searchOpen && (
                <ul className="absolute inset-x-0 top-[68px] z-10 m-0 max-h-[240px] list-none overflow-auto rounded-[10px] border border-border bg-surface p-0 shadow-pop">
                  {results.map((r) => (
                    <li key={r.id}>
                      <button
                        onClick={() => { setEmpId(r.id); setSite(r.site); setQuery(""); setSearchOpen(false); setTimeIn(r.sched.split("–")[0]); setTimeOut(r.sched.split("–")[1]); }}
                        className="flex w-full items-center gap-2.5 border-0 bg-transparent px-3 py-2 text-left hover:bg-hover"
                      >
                        <Avatar name={r.name} size={28} />
                        <span className="flex-1">
                          <span className="block text-[13.5px] font-medium text-text">{r.name}</span>
                          <span className="block text-[12px] text-text-3">
                            {employeeCode(r)} · {org.siteById(r.site).name}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                  {results.length === 0 && <li className="px-3 py-3 text-[13px] text-text-3">{t("noEmployees")}</li>}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            {t("site")}
            <select value={site} onChange={(e) => setSite(e.target.value)} className={cn(field, "border-border-strong")}>
              {!site && <option value="">{t("selectSite")}</option>}
              {siteIds.map((id) => (
                <option key={id} value={id}>
                  {org.siteById(id).name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            {t("date")}
            <input type="date" min="2026-10-01" max="2026-10-15" value={date} onChange={(e) => setDate(e.target.value)} className={cn(field, "border-border-strong")} />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            {t("checkIn")}
            <input type="time" value={timeIn} disabled={noTimes} onChange={(e) => setTimeIn(e.target.value)} className={cn(field, "font-mono", inError || overlap ? "border-bad-dot" : "border-border-strong", noTimes && "bg-surface-2")} />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            {t("checkOut")}
            <input type="time" value={timeOut} disabled={noTimes} onChange={(e) => setTimeOut(e.target.value)} className={cn(field, "font-mono", timeError || overlap ? "border-bad-dot" : "border-border-strong", noTimes && "bg-surface-2")} />
          </label>
        </div>
        {timeError && <span className="-mt-2 text-[12.5px] text-bad">{t("timeError")}</span>}

        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
          {t("status")}
          <select value={status} onChange={(e) => setStatus(e.target.value as "auto" | RecordStatus)} className={cn(field, "border-border-strong")}>
            <option value="auto">{auto ? t("autoWith", { status: tStatus(auto) }) : t("auto")}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {tStatus(s)}
              </option>
            ))}
          </select>
          <span className="text-[12px] font-normal text-text-3">
            {noTimes ? t("noTimesHint") : `${t("scheduledHint", { sched })}${base ? ` · ${tKinds(base.kind)}` : ""}${status === "auto" && auto ? ` · ${t("willBe", { status: tStatus(auto).toLowerCase() })}` : ""}`}
          </span>
        </label>

        {overlap && (
          <div role="alert" className="flex flex-col gap-1 rounded-[10px] bg-bad-bg px-3 py-2.5 text-bad">
            <div className="flex items-center gap-2 text-[13px] font-semibold">
              <TriangleAlert size={15} /> {t("overlapTitle")} <StatusChip status={overlap.status} className="ml-1" />
            </div>
            <div className="text-[12.5px]">
              {t("overlapDescription", { range: overlap.in ? `${overlap.in}–${overlap.out || "…"}` : tStatus(overlap.status), site: org.siteById(overlap.site).name, day })}{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); onClose(); onOpenRecord(overlap.id); }} className="font-medium text-inherit underline">
                {t("openExisting")}
              </a>
            </div>
          </div>
        )}

        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
          <span>
            {t("reason")} <span className="text-bad">*</span>
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder={t("reasonPlaceholder")}
            className={cn("resize-y rounded-[9px] border border-solid bg-surface p-2.5 text-[13.5px] font-normal text-text outline-none focus:border-accent", tried && !reason.trim() ? "border-bad-dot" : "border-border-strong")}
          />
          {tried && !reason.trim() && <span className="text-[12.5px] font-normal text-bad">{t("reasonError")}</span>}
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">
            {t("evidence")} <span className="font-normal text-text-3">({t("optional")})</span>
          </span>
          <label className="flex cursor-pointer items-center gap-2.5 rounded-[10px] border-[1.5px] border-dashed border-border-strong bg-surface-2 px-3 py-2.5 text-text-2 hover:border-accent">
            <Paperclip size={16} />
            <span className="flex-1">
              <span className="block text-[13px] font-medium text-text">{t("attach")}</span>
              <span className="block text-[12px] text-text-3">{t("attachHint")}</span>
            </span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const picked = [...(e.target.files ?? [])].map((f) => ({ name: f.name, size: f.size }));
                e.target.value = "";
                if (picked.length) setFiles((prev) => [...prev, ...picked]);
              }}
            />
          </label>
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} className="flex items-center gap-2.5 rounded-lg border border-border px-2.5 py-1.5 text-[12.5px]">
              <span className="rounded bg-neutral-bg px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase">{(f.name.split(".").pop() ?? "").slice(0, 4)}</span>
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="text-text-3">{fileSize(f.size)}</span>
              <button onClick={() => setFiles(files.filter((_, k) => k !== i))} aria-label={t("remove")} className="grid size-6 place-items-center border-0 bg-transparent text-text-3">
                <X size={13} />
              </button>
            </div>
          ))}
        </div>

        <p className="m-0 rounded-lg bg-surface-2 px-3 py-2 text-[12.5px] text-text-2">{t("audit", { actor })}</p>
      </div>
    </Modal>
  );
}
