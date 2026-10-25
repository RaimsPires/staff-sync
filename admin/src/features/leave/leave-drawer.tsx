"use client";

import { Check, Download, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { useOrg } from "@/lib/org";
import { useEscape } from "@/components/ui/overlay";
import { cn } from "@/lib/utils";
import { type Decision, useLeave } from "@/store/leave";
import { loadLeaveAttachments, loadLeaveCoverage, loadLeaveDetail, recommendLeave } from "@/services/leave";
import { useAccess } from "@/store/use-access";
import type { LeaveRequest } from "@/types/leave";
import { DAY_MS, parseIso, STATUS_STYLE, weekdayOf } from "./model";
import { useLeaveFormat } from "./use-leave-format";
import { useLeaveTypes } from "./use-leave-types";
import { useSettings } from "@/store/settings";

const card = "flex flex-col gap-3 rounded-xl border border-border bg-surface p-[16px_18px] shadow-card";
const COVERAGE = { good: "bg-ok-bg text-ok", tight: "bg-warn-bg text-warn", short: "bg-bad-bg text-bad" } as const;
const MANAGERS: Record<string, string> = { pd: "Nadia Koné", cf: "Julien Roche", sd: "Marc Olivier", rl: "Marc Olivier", pv: "Sarah Benoît" };

/** Side panel for one leave request: balance, team coverage, affected shifts, approval trail and the decision. */
export function LeaveDrawer({ requestId, onClose }: { requestId: string | null; onClose: () => void }) {
  const request = useLeave((s) => s.requests.find((r) => r.id === requestId));
  return request ? <Body key={request.id} request={request} onClose={onClose} /> : null;
}

function Body({ request: r, onClose }: { request: LeaveRequest; onClose: () => void }) {
  const org = useOrg();
  const oneLevel = useSettings((st) => st.values.wf === "one");
  const t = useTranslations("Leave.drawer");
  const leaveTypes = useLeaveTypes();
  const tStatus = useTranslations("Status");
  const tRoles = useTranslations("Alerts.roles");
  const format = useFormatter();
  const leaveFormat = useLeaveFormat();
  const toast = useToast();
  const { perms, me } = useAccess();
  const all = useLeave((s) => s.requests);
  const decide = useLeave((s) => s.decide);
  const [mode, setMode] = useState<Decision | null>(null);
  const [advice, setAdvice] = useState<"approve" | "reject" | null>(null);
  const [text, setText] = useState("");
  const [notify, setNotify] = useState(true);
  const [files, setFiles] = useState<{ key: string; url: string }[]>([]);
  useEscape(true, onClose);
  // The approval trail and any rejection reason come from the detail endpoint.
  useEffect(() => {
    void loadLeaveDetail(r.id).catch(() => undefined);
    if (r.attachment) void loadLeaveAttachments(r.id).then(setFiles).catch(() => undefined);
  }, [r.id, r.attachment]);

  const site = org.siteById(r.site);
  const first = r.name.split(" ")[0];
  const from = parseIso(r.from);
  const to = parseIso(r.to);
  const before = r.balance + r.days;
  const over = r.balance < 0;
  const sameBranch = useMemo(() => all.filter((o) => o.id !== r.id && (o.status === "approved" || o.status === "pending") && org.branchOfSite(o.site).id === org.branchOfSite(r.site).id && parseIso(o.from) <= to + 7 * DAY_MS && parseIso(o.to) >= from), [all, r, from, to, org]);

  // Coverage calendar: whole weeks around the request, red dots for colleagues at the same site who are off.
  const calStart = from - weekdayOf(from) * DAY_MS;
  const calEnd = Math.max(to + (6 - weekdayOf(to)) * DAY_MS, calStart + 13 * DAY_MS);
  const cal: { t: number; inReq: boolean; offs: LeaveRequest[] }[] = [];
  for (let d = calStart; d <= calEnd && cal.length < 42; d += DAY_MS) {
    cal.push({ t: d, inReq: d >= from && d <= to, offs: sameBranch.filter((o) => o.site === r.site && parseIso(o.from) <= d && parseIso(o.to) >= d) });
  }
  const maxOff = Math.max(0, ...cal.filter((c) => c.inReq).map((c) => c.offs.length));
  const coverage = maxOff >= 2 ? "short" : maxOff === 1 ? "tight" : "good";
  const overlaps = sameBranch.filter((o) => parseIso(o.from) <= to && parseIso(o.to) >= from);

  const [shiftsOff, setShiftsOff] = useState<{ t: number; intervention: boolean; early: boolean }[]>([]);
  useEffect(() => {
    let live = true;
    loadLeaveCoverage(r.id).then((list) => live && setShiftsOff(list), () => live && setShiftsOff([]));
    return () => {
      live = false;
    };
  }, [r.id]);
  const affected = shiftsOff.slice(0, 7);

  const pending = r.status === "pending";
  const canDecide = pending && r.stage !== "chg" && perms.approve;
  const canCancel = r.status === "approved" && perms.approve;
  // A site manager cannot decide, but can recommend; the approver then sees the opinion on the request.
  const canRecommend = pending && r.stage !== "chg" && perms.recommend && !perms.approve;
  const tooShort = text.trim().length < 3;
  const needText = mode !== null && mode !== "approve";
  const day = (d: number) => format.dateTime(new Date(d), { day: "numeric", month: "short" });

  const sendAdvice = () => {
    if (!advice || tooShort) return;
    recommendLeave(r.id, advice, text.trim()).then(
      () => toast(t(`recommend.sent.${advice}`)),
      (e: unknown) => toast(e instanceof Error ? e.message : t("recommend.failed"), "bad"),
    );
    setAdvice(null);
    setText("");
  };

  const go = () => {
    if (!mode || (needText && tooShort)) return;
    decide([r.id], mode, me.name, text.trim());
    toast(`${t(`toasts.${mode}`)}${notify ? ` · ${t("toasts.notified", { name: first })}` : ""}`, mode === "reject" || mode === "cancel" ? "bad" : "ok");
    setMode(null);
    setText("");
  };

  const trail = [
    { tone: "ok" as const, mark: "✓", who: r.name, action: t("trail.submitted"), role: t("trail.employee"), when: leaveFormat.submitted(r.submitted), comment: "" },
    ...(oneLevel ? [] : [r.stage === "site"
      ? { tone: "warn" as const, mark: "2", who: MANAGERS[r.site], action: t("trail.awaitingRecommendation"), role: t("trail.siteManager"), when: t("trail.currentStep"), comment: "" }
      : { tone: "ok" as const, mark: "✓", who: MANAGERS[r.site], action: t("trail.recommended"), role: t("trail.siteManager"), when: format.dateTime(new Date(parseIso(r.submitted) + DAY_MS), { day: "numeric", month: "short" }), comment: r.type === "sick" ? t("trail.sickComment") : t("trail.okComment") }]),
    ...(r.status === "approved" ? [{ tone: "ok" as const, mark: "✓", who: r.stageBy ?? "", action: t("trail.approved"), role: "HR", when: r.log.length ? t("trail.justNow") : t("trail.decided"), comment: "" }]
      : r.status === "rejected" ? [{ tone: "bad" as const, mark: "×", who: r.stageBy ?? "Claire Vasseur", action: t("trail.rejected"), role: "HR", when: r.log.length ? t("trail.justNow") : t("trail.decided"), comment: r.rejection ?? "" }]
      : r.status === "cancelled" ? [{ tone: "neutral" as const, mark: "–", who: first, action: t("trail.cancelled"), role: t("trail.employee"), when: "", comment: "" }]
      : [{ tone: r.stage === "chg" ? ("orange" as const) : ("info" as const), mark: r.stage === "chg" ? "!" : "3", who: "HR", action: t("trail.awaitingDecision"), role: t("trail.hrTeam"), when: r.stage === "site" ? t("trail.nextStep") : t("trail.currentStep"), comment: "" }]),
    ...r.log.map((l) => ({ tone: (l.kind === "approve" ? "ok" : l.kind === "changes" ? "orange" : l.kind === "reject" ? "bad" : "neutral") as "ok" | "orange" | "bad" | "neutral", mark: { approve: "✓", reject: "×", changes: "!", cancel: "–" }[l.kind], who: l.who, action: t(`trail.log.${l.kind}`), role: "HR", when: t("trail.justNow"), comment: l.comment })),
  ];
  const toneBox = { ok: "bg-ok-bg text-ok", warn: "bg-warn-bg text-warn", bad: "bg-bad-bg text-bad", info: "bg-info-bg text-info", orange: "bg-orange-bg text-orange", neutral: "bg-neutral-bg text-neutral" } as const;

  const history = all.filter((o) => o.name === r.name && o.id !== r.id && o.status !== "cancelled").map((o) => ({ type: o.type, range: leaveFormat.range(o.from, o.to), days: o.half ? "½ d" : `${o.days} d`, status: o.status }))
    .concat([{ type: "annual" as const, range: leaveFormat.range("2026-07-21", "2026-08-01"), days: "10 d", status: "approved" as const }, { type: "rtt" as const, range: leaveFormat.range("2026-08-14", "2026-08-14"), days: "1 d", status: "approved" as const }]).slice(0, 4);

  const weekdayShort = Array.from({ length: 7 }, (_, i) => format.dateTime(new Date(Date.UTC(2026, 9, 12 + i)), { weekday: "narrow", timeZone: "UTC" }));

  return (
    <div onClick={onClose} className="fixed inset-0 z-[55] flex justify-end bg-overlay">
      <aside role="dialog" aria-label={t("title")} onClick={(e) => e.stopPropagation()} className="flex h-full w-[min(580px,100%)] animate-drawer flex-col bg-bg shadow-pop">
        <div className="flex items-center gap-3.5 border-b border-border bg-surface px-[22px] py-4">
          <Avatar name={r.name} size={48} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5"><div className="text-[17px] font-semibold">{r.name}</div><span className={cn("rounded-md px-[9px] py-[3px] text-[12px] font-medium", STATUS_STYLE[r.status])}>{tStatus(r.status)}</span></div>
            <div className="mt-0.5 text-[12.5px] text-text-3">{tRoles(r.role)} · {site.name} · {org.branchOfSite(r.site).name}</div>
          </div>
          <button onClick={onClose} aria-label={t("close")} className="grid size-8 place-items-center rounded-lg border-0 bg-transparent text-text-2 hover:bg-hover"><X size={20} /></button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-[22px] py-[18px]">
          <section className={card}>
            <div className="flex items-center justify-between gap-2"><div className="text-[14.5px] font-semibold">{t("request")} <span className="font-mono text-[12px] font-normal text-text-3">{r.id}</span></div><span style={leaveTypes.get(r.type).pill} className="rounded-full px-[9px] py-[3px] text-[12px] font-medium">{leaveTypes.label(r.type)}</span></div>
            <dl className="m-0 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-border bg-border">
              {([["dates", leaveFormat.range(r.from, r.to)], ["duration", r.half ? t("halfDayOf", { half: r.half }) : t("workingDays", { count: r.days })], ["halfDay", r.half ? t(r.half === "AM" ? "morningOff" : "afternoonOff") : t("fullDays")], ["submitted", `${format.dateTime(new Date(r.submitted), { day: "numeric", month: "short" })}${r.attachment ? ` · ${t("withAttachment")}` : ""}`]] as const).map(([k, v]) => (
                <div key={k} className="bg-surface px-3 py-2.5"><dt className="text-[11.5px] text-text-3">{t(`facts.${k}`)}</dt><dd className="m-0 mt-0.5 text-[13px] font-medium">{v}</dd></div>
              ))}
            </dl>
            <div className="rounded-[10px] border border-border bg-surface-2 px-3 py-2.5 text-[13px]"><div className="mb-0.5 text-[11.5px] text-text-3">{t("reasonFrom", { name: first })}</div>{t(`reasons.${r.type}`)}</div>
            {files.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {files.map((f, i) => (
                  <a key={f.key} href={f.url} target="_blank" rel="noreferrer" className="flex h-8 items-center gap-2 rounded-lg border border-solid border-border-strong bg-surface px-3 text-[12.5px] font-medium text-text no-underline hover:bg-hover"><Download size={13} />{t("attachmentFile", { n: i + 1 })}</a>
                ))}
              </div>
            )}
          </section>

          <section className={card}>
            <div className="text-[14.5px] font-semibold">{t("balanceOf", { type: leaveTypes.label(r.type) })}</div>
            <div className="flex items-center gap-2">
              {([["before", `${before < 0 ? "−" : ""}${Math.abs(before)}`, "text-text", "border-border bg-surface"], ["requested", `− ${r.half ? "0.5" : r.days}`, "text-accent", "border-accent bg-accent-soft"], ["after", `${r.balance < 0 ? "−" : ""}${Math.abs(r.balance)}`, over ? "text-bad" : "text-ok", over ? "border-bad-dot bg-bad-bg" : "border-border bg-surface"]] as const).map(([k, v, tone, box]) => (
                <div key={k} className={cn("flex-1 rounded-[10px] border border-solid px-3 py-2.5 text-center", box)}><div className="text-[11.5px] text-text-3">{t(`balance.${k}`)}</div><div className={cn("text-[20px] font-semibold", tone)}>{v}</div></div>
              ))}
            </div>
            {over && <div className="rounded-[10px] bg-bad-bg px-3 py-2.5 text-[13px] text-bad"><b>{t("exceeds", { count: Math.abs(r.balance) })}</b> {t("exceedsHint")}</div>}
          </section>

          <section className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2"><div className="text-[14.5px] font-semibold">{t("coverage")}</div><span className={cn("rounded-full px-[9px] py-[3px] text-[12px] font-medium", COVERAGE[coverage])}>{t(`coverageStates.${coverage}`, { count: maxOff + 1 })}</span></div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-text-3">{weekdayShort.map((d, i) => <span key={i}>{d}</span>)}</div>
            <div className="grid grid-cols-7 gap-1">
              {cal.map((c) => {
                const date = new Date(c.t);
                return (
                  <div key={c.t} title={c.offs.length ? t("offTooltip", { names: c.offs.map((o) => o.name).join(", ") }) : undefined} className={cn("flex min-h-11 flex-col justify-between rounded-lg border border-solid p-1", c.inReq ? "border-accent bg-accent-soft text-accent" : "border-border text-text-2", weekdayOf(c.t) >= 5 && !c.inReq && "opacity-55")}>
                    <span className="text-[11.5px] font-semibold">{date.getUTCDate() === 1 ? day(c.t) : date.getUTCDate()}</span>
                    <span className="flex min-h-1.5 gap-0.5">{c.offs.slice(0, 3).map((o) => <span key={o.id} className="size-1.5 rounded-full bg-bad-dot" />)}</span>
                  </div>
                );
              })}
            </div>
            <ul className="m-0 flex list-none flex-wrap gap-3.5 p-0 text-[12px] text-text-2"><li className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] border border-solid border-accent bg-accent-soft" />{t("thisRequest")}</li><li className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-bad-dot" />{t("colleagueOff")}</li></ul>
            {overlaps.length > 0 ? (
              <div className="flex flex-col gap-1.5"><div className="text-[12.5px] font-medium text-text-2">{t("alsoOff")}</div>
                {overlaps.map((o) => <div key={o.id} className="flex items-center gap-2.5 text-[13px]"><span className="font-medium">{o.name}</span><span className="text-[12.5px] text-text-3">{leaveFormat.range(o.from, o.to)}</span><span className={cn("ml-auto rounded-md px-2 py-0.5 text-[12px]", o.site === r.site ? "bg-warn-bg text-warn" : "bg-neutral-bg text-neutral")}>{o.site === r.site ? t("sameSite") : t("sameBranch", { site: org.siteById(o.site).name.split(" ")[0] })} · {t(o.status === "approved" ? "approvedShort" : "pendingShort")}</span></div>)}
              </div>
            ) : <div className="text-[13px] text-ok">{t("nobodyElse", { site: site.name })}</div>}
            <div className="flex flex-col gap-1.5 border-t border-border pt-3"><div className="text-[12.5px] font-medium text-text-2">{t("affected", { count: affected.length })}</div>
              {affected.map((a) => <div key={a.t} className="flex items-center gap-2.5 py-1.5 text-[13px]"><span className="w-[78px] font-medium">{day(a.t)}</span><span className="min-w-0 flex-1 text-text-2">{a.intervention ? t("affectedIntervention") : t("affectedShift", { hours: a.early ? "06:00–14:00" : "08:00–16:00", site: site.name.split(" ")[0] })}</span><a href="/schedules" className="text-[12.5px]">{t("reassign")}</a></div>)}
              {affected.length === 0 && <div className="text-[13px] text-text-3">{t("noAffected")}</div>}
            </div>
          </section>

          <section className={card}>
            <div className="text-[14.5px] font-semibold">{t("trail.title")}</div>
            <ol className="m-0 flex list-none flex-col p-0">
              {trail.map((x, i) => (
                <li key={i} className="flex gap-3">
                  <div className="flex flex-col items-center"><span className={cn("grid size-6 flex-none place-items-center rounded-full text-[12px] font-bold", toneBox[x.tone])}>{x.mark}</span>{i < trail.length - 1 && <span className="min-h-3 w-px flex-1 bg-border" />}</div>
                  <div className="min-w-0 flex-1 pb-3"><div className="text-[13px]"><strong className="font-semibold">{x.who}</strong> <span className="text-text-2">{x.action}</span></div><div className="text-[12px] text-text-3">{x.role}{x.when ? ` · ${x.when}` : ""}</div>{x.comment && <div className="mt-1 rounded-lg bg-surface-2 px-2.5 py-1.5 text-[12.5px] text-text-2">“{x.comment}”</div>}</div>
                </li>
              ))}
            </ol>
          </section>

          <section className={card}>
            <div className="text-[14.5px] font-semibold">{t("history", { name: first })}</div>
            <div className="overflow-hidden rounded-[10px] border border-border">
              {history.map((h, i) => <div key={i} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 border-b border-border px-3 py-2 text-[12.5px] last:border-b-0"><span style={leaveTypes.get(h.type).pill} className="rounded-full px-2 py-0.5 text-[12px] font-medium">{leaveTypes.label(h.type)}</span><span className="text-text-2">{h.range}</span><span className="font-mono text-text-3">{h.days}</span><span className={cn("rounded-md px-2 py-0.5 text-[12px]", STATUS_STYLE[h.status])}>{tStatus(h.status)}</span></div>)}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-3 border-t border-border bg-surface px-[22px] py-3.5">
          {mode ? (
            <>
              <div className="text-[13.5px] font-semibold">{t(`modes.${mode}.title`)}</div>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} autoFocus placeholder={t(`modes.${mode}.placeholder`, { name: first })} className="resize-y rounded-[9px] border border-solid border-border-strong bg-surface p-2.5 text-[13px] text-text outline-none focus:border-accent" />
              <label className="flex cursor-pointer items-center gap-2 text-[13px] text-text-2"><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="m-0 size-4 accent-accent" />{t("notify", { name: first })}</label>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setMode(null); setText(""); }} className="h-9 rounded-[9px] border border-solid border-border-strong bg-surface px-3.5 text-[13px] text-text">{t("cancel")}</button>
                <button onClick={go} disabled={needText && tooShort} className={cn("flex h-9 items-center gap-1.5 rounded-[9px] border-0 px-4 text-[13px] font-medium text-white disabled:opacity-45", mode === "approve" ? "bg-ok-dot" : mode === "changes" ? "bg-accent" : "bg-bad-dot")}>{mode === "approve" && <Check size={14} />}{t(`modes.${mode}.confirm`)}</button>
              </div>
            </>
          ) : advice ? (
            <>
              <div className="text-[13.5px] font-semibold">{t(`recommend.title.${advice}`)}</div>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} autoFocus placeholder={t("recommend.placeholder", { name: first })} className="resize-y rounded-[9px] border border-solid border-border-strong bg-surface p-2.5 text-[13px] text-text outline-none focus:border-accent" />
              <div className="flex justify-end gap-2">
                <button onClick={() => { setAdvice(null); setText(""); }} className="h-9 rounded-[9px] border border-solid border-border-strong bg-surface px-3.5 text-[13px] text-text">{t("cancel")}</button>
                <button onClick={sendAdvice} disabled={tooShort} className={cn("h-9 rounded-[9px] border-0 px-4 text-[13px] font-medium text-white disabled:opacity-45", advice === "approve" ? "bg-ok-dot" : "bg-bad-dot")}>{t("recommend.send")}</button>
              </div>
            </>
          ) : canRecommend ? (
            <div className="flex flex-col gap-2">
              {r.recommendation && <div className="rounded-[9px] bg-surface-2 px-3 py-2 text-[12.5px] text-text-2">{t(`recommend.given.${r.recommendation.decision}`)}{r.recommendation.comment ? ` — “${r.recommendation.comment}”` : ""}</div>}
              <div className="flex flex-wrap justify-end gap-2">
                <button onClick={() => setAdvice("reject")} className="h-9 rounded-[9px] border border-solid border-border-strong bg-surface px-3.5 text-[13px] font-medium text-bad">{t("recommend.against")}</button>
                <button onClick={() => setAdvice("approve")} className="h-9 rounded-[9px] border-0 bg-ok-dot px-4 text-[13px] font-medium text-white">{t("recommend.for")}</button>
              </div>
              <div className="text-center text-[12px] text-text-3">{t("recommend.note")}</div>
            </div>
          ) : canDecide ? (
            <div className="flex flex-col gap-2">
              {r.recommendation && <div className="rounded-[9px] bg-surface-2 px-3 py-2 text-[12.5px] text-text-2">{t(`recommend.given.${r.recommendation.decision}`)}{r.recommendation.comment ? ` — “${r.recommendation.comment}”` : ""}</div>}
            <div className="flex flex-wrap justify-end gap-2">
              <button onClick={() => setMode("changes")} className="h-9 rounded-[9px] border border-solid border-border-strong bg-surface px-3.5 text-[13px] font-medium text-text">{t("modes.changes.title")}</button>
              <button onClick={() => setMode("reject")} className="h-9 rounded-[9px] border border-solid border-border-strong bg-surface px-3.5 text-[13px] font-medium text-bad">{t("modes.reject.title")}</button>
              <button onClick={() => setMode("approve")} className="h-9 rounded-[9px] border-0 bg-ok-dot px-4 text-[13px] font-medium text-white">{t("modes.approve.title")}</button>
            </div>
            </div>
          ) : canCancel ? (
            <div className="flex justify-end"><button onClick={() => setMode("cancel")} className="h-9 rounded-[9px] border border-solid border-border-strong bg-surface px-3.5 text-[13px] font-medium text-bad">{t("modes.cancel.title")}</button></div>
          ) : (
            <div className="text-center text-[13px] text-text-3">{pending ? (perms.approve ? t("waitingFor", { name: first }) : t("readOnly")) : t("finalState", { status: tStatus(r.status).toLowerCase() })}</div>
          )}
        </div>
      </aside>
    </div>
  );
}
