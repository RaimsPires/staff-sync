"use client";

import { Check, Paperclip, TriangleAlert, Inbox } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { BRANCHES, SITES, siteById } from "@/data/org";
import { cn } from "@/lib/utils";
import { useLeave } from "@/store/leave";
import { useAccess } from "@/store/use-access";
import type { LeaveRequest } from "@/types/leave";
import { DAY_MS, LEAVE_TYPES, overlapping, parseIso, TODAY_ISO, TYPE_STYLE } from "./model";
import { useLeaveFormat } from "./use-leave-format";

const TABS = ["pending", "approved", "rejected", "cancelled", "all"] as const;
type Tab = (typeof TABS)[number];
const select = "h-[34px] max-w-[190px] rounded-[9px] border border-solid border-border-strong bg-surface px-2.5 text-[13px] text-text";
const GRID = "grid grid-cols-[28px_minmax(170px,1.3fr)_120px_minmax(130px,1fr)_70px_70px_minmax(160px,1.2fr)_90px_minmax(130px,auto)] items-center gap-3";

export function LeaveInbox({ initialTab, onOpen }: { initialTab: Tab; onOpen: (id: string) => void }) {
  const t = useTranslations("Leave.inbox");
  const tt = useTranslations("Leave.types");
  const ts = useTranslations("Leave.stages");
  const tRoles = useTranslations("Alerts.roles");
  const format = useFormatter();
  const leaveFormat = useLeaveFormat();
  const toast = useToast();
  const { siteIds, perms, me } = useAccess();
  const all = useLeave((s) => s.requests);
  const decide = useLeave((s) => s.decide);

  const [tab, setTab] = useState<Tab>(initialTab);
  const [branch, setBranch] = useState("all");
  const [site, setSite] = useState("all");
  const [type, setType] = useState("all");
  const [range, setRange] = useState<"all" | "7" | "30">("all");
  const [emp, setEmp] = useState("all");
  const [mine, setMine] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulk, setBulk] = useState<"approve" | "reject" | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [text, setText] = useState("");

  const scoped = useMemo(() => all.filter((r) => siteIds.includes(r.site)), [all, siteIds]);
  const pending = scoped.filter((r) => r.status === "pending");
  const today = parseIso(TODAY_ISO);
  const days = range === "all" ? null : Number(range);
  const list = scoped.filter((r) =>
    (tab === "all" || r.status === tab) && (branch === "all" || siteById(r.site).branchId === branch) && (site === "all" || r.site === site) && (type === "all" || r.type === type) &&
    (emp === "all" || r.name === emp) && (!mine || (r.waitingOnMe && r.status === "pending")) && (days === null || (parseIso(r.to) >= today && parseIso(r.from) <= today + days * DAY_MS)),
  );
  const pendingInList = list.filter((r) => r.status === "pending");
  const allSelected = pendingInList.length > 0 && pendingInList.every((r) => selected.includes(r.id));
  const sitesAvailable = SITES.filter((s) => siteIds.includes(s.id) && (branch === "all" || s.branchId === branch));
  const need = text.trim().length < 3;
  const negatives = scoped.filter((r) => selected.includes(r.id) && r.balance < 0).length;
  const hasFilter = branch !== "all" || site !== "all" || type !== "all" || range !== "all" || emp !== "all" || mine;
  const waitingOnMe = pending.filter((r) => r.waitingOnMe).length;
  const names = [...new Set(scoped.map((r) => r.name))].sort();
  const canDecide = perms.approve;

  const dateLabel = (r: LeaveRequest) => leaveFormat.range(r.from, r.to);
  const duration = (r: LeaveRequest) => (r.half ? t("halfDay", { half: r.half }) : t("days", { count: r.days }));
  const stageLabel = (r: LeaveRequest) => (r.status === "pending" ? ts(r.stage) : r.status === "approved" ? ts("done") : r.status === "rejected" ? ts("no") : ts("can"));
  const stageSub = (r: LeaveRequest) => {
    const on = r.stageOn ? format.dateTime(new Date(r.stageOn), { month: "short", day: "numeric" }) : "";
    if (r.note === "certificate") return ts("notes.certificate");
    if (r.note === "recommended") return ts("notes.recommended", { name: r.stageBy ?? "" });
    if (r.note === "insufficient") return ts("notes.insufficient");
    if (r.note === "shortNotice") return ts("notes.shortNotice", { name: r.stageBy ?? "" });
    if (r.stage === "done") return ts("approvedBy", { name: r.stageBy ?? "" });
    if (r.stage === "can") return ts("cancelledOn", { date: on });
    return r.stageOn ? `${r.stageBy} · ${on}` : (r.stageBy ?? "");
  };

  const approve = (r: LeaveRequest) => { decide([r.id], "approve", me.name); toast(`${t("approvedToast", { name: r.name.split(" ")[0] })}${r.balance < 0 ? ` · ${t("goesNegative")}` : ""}`); setSelected((s) => s.filter((x) => x !== r.id)); };
  const confirmReject = (r: LeaveRequest) => { if (need) return; decide([r.id], "reject", me.name, text.trim()); toast(t("rejectedToast", { name: r.name.split(" ")[0] }), "bad"); setRejecting(null); setText(""); setSelected((s) => s.filter((x) => x !== r.id)); };
  const confirmBulk = () => {
    if (!bulk || (bulk === "reject" && need)) return;
    const n = selected.length;
    decide(selected, bulk, me.name, text.trim());
    toast(t(bulk === "approve" ? "bulkApproved" : "bulkRejected", { count: n }), bulk === "reject" ? "bad" : "ok");
    setSelected([]); setBulk(null); setText("");
  };
  const reset = () => { setBranch("all"); setSite("all"); setType("all"); setRange("all"); setEmp("all"); setMine(false); };
  const onTab = (k: Tab) => { setTab(k); setSelected([]); setBulk(null); setRejecting(null); };
  const counts = (k: Tab) => (k === "all" ? scoped.length : scoped.filter((r) => r.status === k).length);

  return (
    <div className="flex flex-col gap-3.5">
      <div role="tablist" className="flex gap-0.5 overflow-x-auto border-b border-border">
        {TABS.map((k) => {
          const on = tab === k;
          return (
            <button key={k} role="tab" aria-selected={on} onClick={() => onTab(k)} className={cn("-mb-px flex h-10 items-center gap-2 whitespace-nowrap border-0 border-b-2 border-solid bg-transparent px-3.5 text-[13.5px]", on ? "border-b-accent font-semibold text-text" : "border-b-transparent font-medium text-text-2")}>
              {t(`tabs.${k}`)}
              <span className={cn("grid h-5 min-w-5 place-items-center rounded-full px-1.5 font-mono text-[11px] font-semibold", on ? (k === "pending" ? "bg-warn-dot text-white" : "bg-accent text-white") : k === "pending" ? "bg-warn-bg text-warn" : "bg-neutral-bg text-neutral")}>{counts(k)}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select value={branch} onChange={(e) => { setBranch(e.target.value); setSite("all"); setSelected([]); }} aria-label={t("filters.branch")} className={select}><option value="all">{t("filters.allBranches")}</option>{BRANCHES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
        <select value={site} onChange={(e) => { setSite(e.target.value); setSelected([]); }} aria-label={t("filters.site")} className={select}><option value="all">{t("filters.allSites")}</option>{sitesAvailable.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <select value={type} onChange={(e) => { setType(e.target.value); setSelected([]); }} aria-label={t("filters.type")} className={select}><option value="all">{t("filters.allTypes")}</option>{LEAVE_TYPES.map((k) => <option key={k} value={k}>{tt(k)}</option>)}</select>
        <select value={range} onChange={(e) => { setRange(e.target.value as typeof range); setSelected([]); }} aria-label={t("filters.dates")} className={select}><option value="all">{t("filters.anyDates")}</option><option value="7">{t("filters.next7")}</option><option value="30">{t("filters.next30")}</option></select>
        <select value={emp} onChange={(e) => { setEmp(e.target.value); setSelected([]); }} aria-label={t("filters.employee")} className={select}><option value="all">{t("filters.allEmployees")}</option>{names.map((n) => <option key={n}>{n}</option>)}</select>
        <button aria-pressed={mine} onClick={() => { setMine(!mine); setSelected([]); if (!mine) setTab("pending"); }} className={cn("flex h-[34px] items-center gap-1.5 rounded-[9px] border border-solid px-3 text-[13px] font-medium", mine ? "border-accent bg-accent text-white" : "border-border-strong bg-surface text-text-2")}>
          {t("waitingOnMe")} <span className="font-mono text-[11.5px] opacity-80">{waitingOnMe}</span>
        </button>
        {hasFilter && <button onClick={reset} className="h-[34px] border-0 bg-transparent px-2.5 text-[13px] text-accent">{t("filters.clear")}</button>}
        <div className="ml-auto text-[13px] text-text-3">{t("summary", { pending: pending.length, mine: waitingOnMe })}</div>
      </div>

      {selected.length > 0 && canDecide && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-solid border-accent bg-accent-soft px-3 py-2.5">
          <span className="text-[13.5px] font-semibold text-accent">{t("selected", { count: selected.length })}</span>
          {negatives > 0 && <span className="flex items-center gap-1.5 text-[12.5px] text-bad"><TriangleAlert size={14} />{t("negativeWarning", { count: negatives })}</span>}
          {!bulk ? (
            <>
              <button onClick={() => { setBulk("approve"); setText(""); setRejecting(null); }} className="h-8 rounded-lg border-0 bg-accent px-3 text-[13px] font-medium text-white">{t("approveSelected")}</button>
              <button onClick={() => { setBulk("reject"); setText(""); setRejecting(null); }} className="h-8 rounded-lg border border-solid border-border-strong bg-surface px-3 text-[13px] font-medium text-text">{t("rejectSelected")}</button>
            </>
          ) : (
            <>
              <input value={text} onChange={(e) => setText(e.target.value)} autoFocus placeholder={t(bulk === "approve" ? "bulkApprovePlaceholder" : "bulkRejectPlaceholder")} className="h-8 min-w-[220px] flex-[1_1_220px] rounded-lg border border-solid border-border-strong bg-surface px-2.5 text-[13px] text-text outline-none focus:border-accent" />
              <button onClick={confirmBulk} disabled={bulk === "reject" && need} className={cn("h-8 rounded-lg border-0 px-3 text-[13px] font-medium text-white disabled:opacity-45", bulk === "approve" ? "bg-ok-dot" : "bg-bad-dot")}>{t(bulk === "approve" ? "confirmApprove" : "confirmReject", { count: selected.length })}</button>
              <button onClick={() => { setBulk(null); setText(""); }} className="h-8 border-0 bg-transparent px-2.5 text-[13px] text-text-2">{t("cancel")}</button>
            </>
          )}
          <button onClick={() => { setSelected([]); setBulk(null); }} className="ml-auto h-8 border-0 bg-transparent px-2.5 text-[13px] text-text-2">{t("clearSelection")}</button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
        <div className="min-w-[1000px]">
          <div className={cn(GRID, "border-b border-border bg-surface-2 px-4 py-2.5 text-[12px] font-medium text-text-3")}>
            <div role="checkbox" aria-checked={allSelected} aria-label={t("selectAll")} tabIndex={0} onClick={() => setSelected(allSelected ? [] : pendingInList.map((r) => r.id))} onKeyDown={(e) => (e.key === " " || e.key === "Enter") && setSelected(allSelected ? [] : pendingInList.map((r) => r.id))}
              className={cn("grid size-[18px] cursor-pointer place-items-center rounded-[5px] border-[1.5px] border-solid text-white", allSelected ? "border-accent bg-accent" : "border-border-strong", pendingInList.length === 0 && "invisible")}>{allSelected && <Check size={12} strokeWidth={3.2} />}</div>
            {(["employee", "type", "dates", "duration", "balance", "stage", "submitted"] as const).map((c) => <div key={c}>{t(`columns.${c}`)}</div>)}
            <div className="text-right">{t("columns.actions")}</div>
          </div>
          {list.map((r) => {
            const pend = r.status === "pending";
            const on = selected.includes(r.id);
            const overlaps = pend ? overlapping(r, all) : [];
            const style = TYPE_STYLE[r.type];
            return (
              <div key={r.id} className="border-b border-border last:border-b-0">
                <div role="button" tabIndex={0} onClick={() => onOpen(r.id)} onKeyDown={(e) => e.key === "Enter" && onOpen(r.id)} className={cn(GRID, "cursor-pointer px-4 py-3 text-[13.5px]", on ? "bg-accent-soft" : "hover:bg-hover")}>
                  <div role="checkbox" aria-checked={on} aria-label={r.name} tabIndex={pend ? 0 : -1}
                    onClick={(e) => { e.stopPropagation(); if (pend) { setSelected((s) => (s.includes(r.id) ? s.filter((x) => x !== r.id) : [...s, r.id])); setBulk(null); } }}
                    className={cn("grid size-[18px] cursor-pointer place-items-center rounded-[5px] border-[1.5px] border-solid text-white", on ? "border-accent bg-accent" : "border-border-strong", !pend && "invisible")}>{on && <Check size={12} strokeWidth={3.2} />}</div>
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={r.name} size={34} />
                    <div className="min-w-0"><div className="truncate font-medium">{r.name}</div><div className="truncate text-[12px] text-text-3">{siteById(r.site).name} · {tRoles(r.role)}</div></div>
                  </div>
                  <div><span className={cn("rounded-full px-2 py-[3px] text-[12px] font-medium", style.pill)}>{tt(r.type)}</span></div>
                  <div className="text-text-2">{dateLabel(r)}</div>
                  <div className="text-text-2">{duration(r)}</div>
                  <div className="flex items-center gap-1.5" title={r.status === "pending" ? t(r.balance < 0 ? "exceedsBalance" : "remaining", { count: Math.abs(r.balance) }) : undefined}>
                    <span className="font-mono text-[12.5px]" style={{ color: pend && r.balance < 0 ? "var(--bad)" : "var(--text-2)" }}>{pend ? (r.balance >= 0 ? `${r.balance} d` : `−${Math.abs(r.balance)} d`) : "—"}</span>
                    {r.attachment && <Paperclip size={13} className="text-text-3" aria-label={t("attachment")} />}
                    {overlaps.length > 0 && <span title={t("overlapWith", { names: overlaps.map((o) => o.name.split(" ")[0]).join(", "), site: siteById(r.site).name })}><TriangleAlert size={14} className="text-warn" /></span>}
                  </div>
                  <div className="min-w-0">
                    <div className={cn("text-[13px] font-medium", r.status === "approved" ? "text-ok" : r.status === "rejected" ? "text-bad" : r.status === "cancelled" ? "text-text-3" : r.waitingOnMe ? "text-accent" : "text-text")}>{stageLabel(r)}</div>
                    <div className="truncate text-[12px] text-text-3">{stageSub(r)}</div>
                  </div>
                  <div className="text-[12.5px] text-text-3">{format.dateTime(new Date(r.submitted), { day: "numeric", month: "short" })}</div>
                  <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {pend && canDecide && rejecting !== r.id && (
                      <>
                        <button onClick={() => approve(r)} className="h-8 rounded-lg border-0 bg-ok-dot px-2.5 text-[12.5px] font-medium text-white">{t("approve")}</button>
                        <button onClick={() => { setRejecting(r.id); setText(""); setBulk(null); }} className="h-8 rounded-lg border border-solid border-border-strong bg-surface px-2.5 text-[12.5px] font-medium text-text">{t("reject")}</button>
                      </>
                    )}
                  </div>
                </div>
                {rejecting === r.id && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-border bg-bad-bg px-4 py-2.5">
                    <input value={text} onChange={(e) => setText(e.target.value)} autoFocus placeholder={t("rejectReason", { name: r.name.split(" ")[0] })} aria-label={t("rejectReason", { name: r.name.split(" ")[0] })} className="h-8 min-w-[240px] flex-1 rounded-lg border border-solid border-border-strong bg-surface px-2.5 text-[13px] text-text outline-none focus:border-accent" />
                    <button onClick={() => confirmReject(r)} disabled={need} className="h-8 rounded-lg border-0 bg-bad-dot px-3 text-[13px] font-medium text-white disabled:opacity-45">{t("confirmRejectOne")}</button>
                    <button onClick={() => { setRejecting(null); setText(""); }} className="h-8 border-0 bg-transparent px-2.5 text-[13px] text-text-2">{t("cancel")}</button>
                  </div>
                )}
              </div>
            );
          })}
          {list.length === 0 && (
            <div className="flex flex-col items-center gap-1 px-6 py-14 text-center">
              <Inbox size={26} className="text-text-3" />
              <div className="text-[15px] font-semibold">{t(tab === "pending" && !mine && !hasFilter ? "empty.zero" : "empty.none")}</div>
              <div className="text-[13px] text-text-3">{t(tab === "pending" ? "empty.nothingWaiting" : "empty.tryAnother")}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
