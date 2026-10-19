"use client";

import { MessageSquare, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RecordMap } from "@/components/map/record-map";
import { Avatar } from "@/components/ui/misc";
import { ESCALATION_ADMINS, FENCE_RADIUS, type AlertItem, type RejectOutcome } from "@/data/alerts";
import { branchOfSite, siteById } from "@/data/org";
import { offsetMeters } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { REASON_TONE, STATUS_STYLE, useAlertWhen } from "./shared";

type Action = "approve" | "reject" | "contact" | "note" | "esc";

export interface DetailHandlers {
  onResolve: (id: string, status: "approved" | "rejected", reason: string, outcome?: RejectOutcome) => void;
  onNote: (id: string, text: string) => void;
  onEscalate: (id: string, to: string, text: string) => void;
  onContact: (item: AlertItem, how: "call" | "message") => void;
}

const smallButton = "h-[34px] whitespace-nowrap rounded-[9px] border border-solid border-border-strong bg-surface px-3 text-[13px] font-medium text-text";

export function AlertDetail({ item, ...handlers }: { item: AlertItem } & DetailHandlers) {
  // The form state belongs to one alert; remount when another is opened.
  return <DetailBody key={item.id} item={item} {...handlers} />;
}

function DetailBody({ item, onResolve, onNote, onEscalate, onContact }: { item: AlertItem } & DetailHandlers) {
  const t = useTranslations("Alerts.detail");
  const ta = useTranslations("Alerts");
  const tItems = useTranslations("Alerts.items");
  const when = useAlertWhen();
  const [action, setAction] = useState<Action | null>(null);
  const [text, setText] = useState("");
  const [outcome, setOutcome] = useState<RejectOutcome>("absent");
  const [escTo, setEscTo] = useState(ESCALATION_ADMINS[0]);

  const site = siteById(item.site);
  const fence = FENCE_RADIUS[item.site];
  const hasPosition = item.tab !== "unc";
  const isIntervention = item.tab === "unc";
  const title = isIntervention ? tItems(`${item.id}.title`) : item.name;
  const roleLabel = isIntervention ? tItems(`${item.id}.slot`) : ta(`roles.${item.role}`);
  const tone = REASON_TONE[item.reason];
  const outside = item.distance > fence;
  const badAccuracy = item.accuracy > 50;
  const suspicious = item.accuracy < 4;
  const open = item.status === "open";
  const needText = text.trim().length < 3;

  // Reported position: a deterministic bearing and the measured distance from the site centre.
  const bearing = (((item.name.length * 47 + item.days * 31) % 360) * Math.PI) / 180;
  const position = offsetMeters(site.position, Math.cos(bearing) * item.distance, Math.sin(bearing) * item.distance);
  const pinColor = ["geo", "mock", "tamper"].includes(item.reason) ? "#E5372A" : "#E59A00";

  const reasonText = item.reason === "geo" ? ta("reasons.geoBy", { meters: Math.max(0, item.distance - fence) }) : ta(`reasons.${item.reason}`);
  const status = STATUS_STYLE[item.status];
  const confirmLabel = action === "reject" ? t(outcome === "absent" ? "confirm.rejectAbsent" : "confirm.rejectInvalid") : action ? t(`confirm.${action}`) : "";
  const confirmTone = action === "approve" ? "bg-ok-dot" : action === "reject" ? "bg-bad-dot" : "bg-accent";

  const toggle = (a: Action) => {
    setAction((cur) => (cur === a ? null : a));
    setText("");
    setOutcome("absent");
  };
  const confirm = () => {
    if (!action || (action !== "note" && needText) || (action === "note" && !text.trim())) return;
    const value = text.trim();
    if (action === "approve") onResolve(item.id, "approved", value);
    else if (action === "reject") onResolve(item.id, "rejected", value, outcome);
    else if (action === "note") onNote(item.id, value);
    else if (action === "esc") onEscalate(item.id, escTo, value);
    setAction(null);
    setText("");
  };

  const facts = hasPosition
    ? [
        { k: "distance", v: `${item.distance} m · ${outside ? t("facts.outsideBy", { meters: item.distance - fence }) : t("facts.inside")}`, bad: outside },
        { k: "accuracy", v: `±${item.accuracy} m · ${t(badAccuracy ? "facts.poor" : suspicious ? "facts.suspicious" : "facts.good")}`, warn: badAccuracy || suspicious },
        { k: "device", v: item.device },
        { k: "registered", v: item.registered ? t("facts.yes") : t("facts.newDevice"), violet: !item.registered },
      ]
    : [
        { k: "site", v: site.name },
        { k: "slot", v: roleLabel.replace(/^.*? /, "") },
        { k: "coverage", v: t("facts.noCoverage"), bad: true },
        { k: "manager", v: site.manager },
      ];

  return (
    <aside className="min-w-0 max-w-[480px] flex-[1_1_360px] overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <Avatar name={title} size={44} />
        <div className="min-w-0 flex-1">
          <div className="text-[15.5px] font-semibold">{title}</div>
          <div className="text-[12.5px] text-text-3">
            {roleLabel} · {site.name}, {branchOfSite(item.site).name}
          </div>
        </div>
        <span className={cn("rounded-md px-2 py-[3px] text-[12px] font-medium", status.className)}>{ta(`status.${item.status}`)}</span>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-1.5">
          <span className={cn("inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-[12.5px] font-medium", tone.className)}>
            <span className="size-1.5 rounded-full" style={{ background: `var(--${tone.name}-dot)` }} />
            {reasonText}
          </span>
          <div className="text-[13px] text-text-2">{tItems(`${item.id}.description`)}</div>
          <div className="text-[12px] text-text-3">{t("meta", { when: when(item), severity: ta(`severity.${item.severity}`) })}</div>
        </div>

        {hasPosition && (
          <div className="overflow-hidden rounded-[10px] border border-border">
            <div className="relative z-0 aspect-[340/200] bg-map-bg">
              <div className="absolute inset-0">
                <RecordMap center={site.position} geofence={site.geofence} checkIn={{ position, color: pinColor }} accuracy={Math.min(item.accuracy, 200)} />
              </div>
            </div>
            <div className="flex flex-wrap gap-3.5 border-t border-border bg-surface-2 px-3 py-2 text-[12px] text-text-2">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full border-[1.5px] border-dashed border-accent bg-fence" />
                {t("geofence", { meters: fence })}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ background: pinColor }} />
                {t("reportedPosition")}
              </span>
            </div>
          </div>
        )}
        {!hasPosition && <div className="rounded-[10px] border border-border bg-surface-2 px-3 py-2.5 text-[12.5px] text-text-3">{t("noGps")}</div>}

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-border bg-border">
          {facts.map((f) => (
            <div key={f.k} className="bg-surface px-3 py-2.5">
              <div className="text-[11.5px] text-text-3">{t(`facts.${f.k}`)}</div>
              <div className={cn("mt-0.5 text-[13px] font-medium", "bad" in f && f.bad ? "text-bad" : "warn" in f && f.warn ? "text-warn" : "violet" in f && f.violet ? "text-violet" : "text-text")}>{f.v}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="grid size-[72px] flex-none place-items-center whitespace-pre-line rounded-[10px] border border-border bg-[repeating-linear-gradient(135deg,var(--surface-2)_0_8px,var(--neutral-bg)_8px_16px)] text-center font-mono text-[10px] text-text-3">
            {item.selfie ? `${t("selfie.label")}\n${item.time}` : t("selfie.none")}
          </div>
          <div className="text-[13px] text-text-2">
            <div className="font-medium text-text">{t("selfie.title")}</div>
            {item.selfie ? t("selfie.captured") : hasPosition ? t("selfie.denied") : t("selfie.notApplicable")}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[13.5px] font-semibold">{t("history.title")}</div>
            <span className={cn("rounded-md px-[7px] py-[3px] font-mono text-[11px] font-semibold", item.flagCount >= 3 ? "bg-bad-bg text-bad" : item.flagCount ? "bg-warn-bg text-warn" : "bg-ok-bg text-ok")}>
              {t("history.count", { count: item.flagCount })}
            </span>
          </div>
          <div className="mb-1.5 text-[12px] text-text-3">{t("history.subtitle")}</div>
          <div className="overflow-hidden rounded-[10px] border border-border">
            {item.previous.map((p, i) => (
              <div key={i} className="flex items-center gap-2.5 border-t border-border px-3 py-2 text-[12.5px] first:border-t-0">
                <span className={cn("size-[7px] flex-none rounded-full", p.ok ? "bg-ok-dot" : "bg-bad-dot")} />
                <span className="w-[78px] text-text-2">{when({ ...item, days: p.daysAgo, time: "", isCheckInTime: false }, true)}</span>
                <span className="font-mono text-[12px]">{p.range}</span>
                <span className="ml-auto text-right text-text-3">
                  {p.note ? (p.note.kind === "outside" ? t("history.outside", { meters: p.note.meters }) : t("history.mock")) : t("history.valid")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {item.notes.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="text-[13.5px] font-semibold">{t("notes")}</div>
            {item.notes.map((n, i) => (
              <div key={i} className="rounded-[10px] border border-border bg-surface-2 px-3 py-2 text-[13px]">
                <div className="mb-0.5 text-[11.5px] text-text-3">
                  {n.who} · {n.when}
                </div>
                {n.text}
              </div>
            ))}
          </div>
        )}

        {!open && item.resolution && (
          <div className={cn("rounded-[10px] p-3 text-[13px]", status.className)}>
            <div className="font-semibold">
              {item.status === "approved" ? t("resolved.approved", { name: item.resolution.by }) : t(item.resolution.outcome === "invalid" ? "resolved.rejectedInvalid" : "resolved.rejectedAbsent", { name: item.resolution.by })}
            </div>
            <div>{tItems(`${item.id}.resolution`)}</div>
          </div>
        )}
      </div>

      {open && (
        <div className="flex flex-col gap-2.5 border-t border-border bg-surface-2 p-3.5">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => toggle("approve")} className={cn(smallButton, action === "approve" && "outline outline-2 outline-accent")}>{t("actions.approve")}</button>
            <button onClick={() => toggle("reject")} className={cn(smallButton, "text-bad", action === "reject" && "outline outline-2 outline-accent")}>{t("actions.reject")}</button>
            <button onClick={() => toggle("contact")} className={cn(smallButton, action === "contact" && "bg-hover")}>{t("actions.contact")}</button>
            <button onClick={() => toggle("note")} className={cn(smallButton, action === "note" && "bg-hover")}>{t("actions.note")}</button>
            <button onClick={() => toggle("esc")} className={cn(smallButton, action === "esc" && "bg-hover")}>{t("actions.escalate")}</button>
          </div>

          {action === "contact" && (
            <div className="flex animate-rise flex-wrap items-center gap-2">
              <span className="mr-auto font-mono text-[12.5px] text-text-2">{item.phone}</span>
              <button onClick={() => { onContact(item, "call"); setAction(null); }} className={cn(smallButton, "flex items-center gap-1.5")}>
                <Phone size={14} /> {t("contact.call")}
              </button>
              <button onClick={() => { onContact(item, "message"); setAction(null); }} className={cn(smallButton, "flex items-center gap-1.5")}>
                <MessageSquare size={14} /> {t("contact.message")}
              </button>
            </div>
          )}

          {action && action !== "contact" && (
            <div className="flex animate-rise flex-col gap-2">
              <div className="text-[13px] font-semibold">{t(`form.${action}`)}</div>
              {action === "reject" && (
                <div className="grid grid-cols-2 gap-2">
                  {(["absent", "invalid"] as const).map((o) => (
                    <button
                      key={o}
                      onClick={() => setOutcome(o)}
                      aria-pressed={outcome === o}
                      className={cn("rounded-[9px] border border-solid px-3 py-2 text-left text-[12.5px]", outcome === o ? "border-bad-dot bg-bad-bg text-text" : "border-border-strong bg-surface text-text")}
                    >
                      <div className="font-semibold">{t(`outcome.${o}.title`)}</div>
                      <div className="text-text-3">{t(`outcome.${o}.hint`)}</div>
                    </button>
                  ))}
                </div>
              )}
              {action === "esc" && (
                <select value={escTo} onChange={(e) => setEscTo(e.target.value)} aria-label={t("form.escalateTo")} className="h-9 rounded-[9px] border border-solid border-border-strong bg-surface px-2.5 text-[13px] text-text">
                  {ESCALATION_ADMINS.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              )}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                autoFocus
                placeholder={t(`placeholder.${action}`)}
                className="resize-y rounded-[9px] border border-solid border-border-strong bg-surface p-2.5 text-[13px] text-text outline-none focus:border-accent"
              />
              {action !== "note" && needText && <span className="text-[12px] text-text-3">{t("reasonRequired")}</span>}
              <div className="flex justify-end gap-2">
                <button onClick={() => { setAction(null); setText(""); }} className={smallButton}>{t("cancel")}</button>
                <button
                  onClick={confirm}
                  disabled={action === "note" ? !text.trim() : needText}
                  className={cn(smallButton, "border-0 text-white disabled:opacity-45", confirmTone)}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
