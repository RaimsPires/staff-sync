"use client";

import { Check, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { avatarColors, initials } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { ALERTS, FENCE_RADIUS, type AlertItem, type AlertReason, type AlertTab, type RejectOutcome } from "@/data/alerts";
import { useOrg } from "@/lib/org";
import { cn } from "@/lib/utils";
import { useAccess } from "@/store/use-access";
import { AlertDetail } from "./alert-detail";
import { REASON_TONE, SEVERITY_DOT, STATUS_STYLE, useAlertWhen } from "./shared";

type TabKey = AlertTab | "resolved";
const TABS: TabKey[] = ["flagged", "miss", "uns", "unc", "resolved"];
const REASONS = Object.keys(REASON_TONE) as AlertReason[];
const DATE_OPTIONS = ["all", "0", "7", "30"] as const;
const GRID = "grid grid-cols-[28px_minmax(150px,1.2fr)_minmax(120px,1fr)_104px_minmax(160px,1.3fr)_70px_82px] items-center gap-3";
const select = "h-[34px] rounded-[9px] border border-solid border-border-strong bg-surface px-2.5 text-[13px] text-text";

function Checkbox({ checked, onClick, label, hidden }: { checked: boolean; onClick: (e: React.MouseEvent) => void; label: string; hidden?: boolean }) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      tabIndex={hidden ? -1 : 0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === " " || e.key === "Enter") && onClick(e as unknown as React.MouseEvent)}
      className={cn(
        "grid size-[18px] cursor-pointer place-items-center rounded-[5px] border-[1.5px] border-solid text-white",
        checked ? "border-accent bg-accent" : "border-border-strong bg-transparent",
        hidden && "invisible",
      )}
    >
      {checked && <Check size={12} strokeWidth={3.2} />}
    </div>
  );
}

export function AlertsScreen() {
  const org = useOrg();
  const t = useTranslations("Alerts");
  const tItems = useTranslations("Alerts.items");
  const toast = useToast();
  const when = useAlertWhen();
  const { siteIds, me } = useAccess();

  const [items, setItems] = useState<AlertItem[]>(ALERTS);
  const [tab, setTab] = useState<TabKey>("flagged");
  const [selected, setSelected] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>("a1");
  const [branch, setBranch] = useState("all");
  const [site, setSite] = useState("all");
  const [reason, setReason] = useState<"all" | AlertReason>("all");
  const [date, setDate] = useState<(typeof DATE_OPTIONS)[number]>("all");
  const [query, setQuery] = useState("");
  const [bulk, setBulk] = useState<"approve" | "reject" | null>(null);
  const [bulkText, setBulkText] = useState("");

  const scoped = useMemo(() => items.filter((i) => siteIds.includes(i.site)), [items, siteIds]);
  const open = scoped.filter((i) => i.status === "open");
  const q = query.trim().toLowerCase();

  const visible = scoped.filter((it) => {
    if (tab === "resolved" ? it.status === "open" : it.status !== "open" || it.tab !== tab) return false;
    if (branch !== "all" && org.branchOfSite(it.site).id !== branch) return false;
    if (site !== "all" && it.site !== site) return false;
    if (reason !== "all" && it.reason !== reason) return false;
    if (date !== "all" && it.days > Number(date)) return false;
    const label = it.tab === "unc" ? tItems(`${it.id}.title`) : it.name;
    return !q || label.toLowerCase().includes(q);
  });

  const current = scoped.find((i) => i.id === openId) ?? null;
  const selectableOpen = visible.filter((i) => i.status === "open");
  const allSelected = selectableOpen.length > 0 && selectableOpen.every((i) => selected.includes(i.id));
  const siteOptions = org.branches.flatMap((b) => (branch === "all" || b.id === branch ? b.siteIds : [])).filter((id) => siteIds.includes(id));
  const hasFilter = branch !== "all" || site !== "all" || reason !== "all" || date !== "all" || !!query;
  const needBulkText = bulkText.trim().length < 3;

  const resolve = (ids: string[], status: "approved" | "rejected", text: string, outcome?: RejectOutcome) => {
    setItems((all) => all.map((it) => (ids.includes(it.id) ? { ...it, status, resolution: { by: me.name, outcome } } : it)));
    setSelected((s) => s.filter((x) => !ids.includes(x)));
    setBulk(null);
    setBulkText("");
    void text;
  };

  const handlers = {
    onResolve: (id: string, status: "approved" | "rejected", text: string, outcome?: RejectOutcome) => {
      resolve([id], status, text, outcome);
      toast(status === "approved" ? t("toasts.approved") : t(outcome === "invalid" ? "toasts.rejectedInvalid" : "toasts.rejectedAbsent"));
    },
    onNote: (id: string, text: string) => {
      setItems((all) => all.map((it) => (it.id === id ? { ...it, notes: [...it.notes, { who: me.name, when: t("justNow"), text }] } : it)));
      toast(t("toasts.noteSaved"));
    },
    onEscalate: (id: string, to: string, text: string) => {
      setItems((all) => all.map((it) => (it.id === id ? { ...it, notes: [...it.notes, { who: me.name, when: t("justNow"), text: t("escalatedNote", { to, text }) }] } : it)));
      toast(t("toasts.escalated", { to }));
    },
    onContact: (item: AlertItem, how: "call" | "message") => toast(t(how === "call" ? "toasts.calling" : "toasts.messageSent", { name: item.name })),
  };

  const confirmBulk = () => {
    if (!bulk || needBulkText) return;
    const count = selected.length;
    resolve(selected, bulk === "approve" ? "approved" : "rejected", bulkText.trim(), bulk === "reject" ? "absent" : undefined);
    toast(t(bulk === "approve" ? "toasts.bulkApproved" : "toasts.bulkRejected", { count }));
  };

  const openCount = (k: TabKey) => (k === "resolved" ? scoped.length - open.length : open.filter((i) => i.tab === k).length);
  const siteCount = new Set(open.map((i) => i.site)).size;

  return (
    <div className="relative flex flex-col gap-3.5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="m-0 text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <div className="mt-1 text-[13.5px] text-text-2">{t("subtitle", { open: open.length, sites: siteCount, high: open.filter((i) => i.severity === "high").length })}</div>
        </div>
        <label className="flex h-[34px] items-center gap-2 rounded-[9px] border border-solid border-border-strong bg-surface px-[11px] text-text-3">
          <Search size={15} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} className="border-0 bg-transparent text-[13px] text-text outline-0" />
        </label>
      </div>

      <div role="tablist" className="flex gap-0.5 overflow-x-auto border-b border-border">
        {TABS.map((k) => {
          const on = tab === k;
          return (
            <button
              key={k}
              role="tab"
              aria-selected={on}
              onClick={() => { setTab(k); setSelected([]); setBulk(null); }}
              className={cn("-mb-px flex h-10 cursor-pointer items-center gap-2 whitespace-nowrap border-0 border-b-2 border-solid bg-transparent px-3.5 text-[13.5px]", on ? "border-b-accent font-semibold text-text" : "border-b-transparent font-medium text-text-2")}
            >
              {t(`tabs.${k}`)}
              <span className={cn("grid h-5 min-w-5 place-items-center rounded-full px-1.5 font-mono text-[11px] font-semibold", on ? "bg-accent text-white" : "bg-neutral-bg text-neutral")}>{openCount(k)}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select value={branch} onChange={(e) => { setBranch(e.target.value); setSite("all"); setSelected([]); }} aria-label={t("filters.branch")} className={select}>
          <option value="all">{t("filters.allBranches")}</option>
          {org.branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select value={site} onChange={(e) => { setSite(e.target.value); setSelected([]); }} aria-label={t("filters.site")} className={select}>
          <option value="all">{t("filters.allSites")}</option>
          {siteOptions.map((id) => (
            <option key={id} value={id}>{org.siteById(id).name}</option>
          ))}
        </select>
        <select value={reason} onChange={(e) => { setReason(e.target.value as "all" | AlertReason); setSelected([]); }} aria-label={t("filters.reason")} className={select}>
          <option value="all">{t("filters.allReasons")}</option>
          {REASONS.map((r) => (
            <option key={r} value={r}>{t(`reasons.${r}`)}</option>
          ))}
        </select>
        <select value={date} onChange={(e) => { setDate(e.target.value as (typeof DATE_OPTIONS)[number]); setSelected([]); }} aria-label={t("filters.date")} className={select}>
          {DATE_OPTIONS.map((d) => (
            <option key={d} value={d}>{t(`filters.dates.${d}`)}</option>
          ))}
        </select>
        {hasFilter && (
          <button onClick={() => { setBranch("all"); setSite("all"); setReason("all"); setDate("all"); setQuery(""); }} className="h-[34px] border-0 bg-transparent px-2.5 text-[13px] text-accent">
            {t("filters.clear")}
          </button>
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-solid border-accent bg-accent-soft px-3 py-2.5">
          <span className="text-[13.5px] font-semibold text-accent">{t("bulk.selected", { count: selected.length })}</span>
          {!bulk ? (
            <>
              <button onClick={() => { setBulk("approve"); setBulkText(""); }} className="h-8 rounded-lg border-0 bg-accent px-3 text-[13px] font-medium text-white">{t("bulk.resolveValid")}</button>
              <button onClick={() => { setBulk("reject"); setBulkText(""); }} className="h-8 rounded-lg border border-solid border-border-strong bg-surface px-3 text-[13px] font-medium text-text">{t("bulk.rejectAll")}</button>
            </>
          ) : (
            <>
              <input value={bulkText} onChange={(e) => setBulkText(e.target.value)} autoFocus placeholder={t(bulk === "approve" ? "bulk.approvePlaceholder" : "bulk.rejectPlaceholder")} className="h-8 min-w-[220px] flex-[1_1_220px] rounded-lg border border-solid border-border-strong bg-surface px-2.5 text-[13px] text-text outline-none focus:border-accent" />
              <button onClick={confirmBulk} disabled={needBulkText} className={cn("h-8 rounded-lg border-0 px-3 text-[13px] font-medium text-white disabled:opacity-45", bulk === "approve" ? "bg-ok-dot" : "bg-bad-dot")}>
                {t(bulk === "approve" ? "bulk.confirmApprove" : "bulk.confirmReject", { count: selected.length })}
              </button>
              <button onClick={() => { setBulk(null); setBulkText(""); }} className="h-8 border-0 bg-transparent px-2.5 text-[13px] text-text-2">{t("cancel")}</button>
            </>
          )}
          <button onClick={() => { setSelected([]); setBulk(null); }} className="ml-auto h-8 border-0 bg-transparent px-2.5 text-[13px] text-text-2">{t("bulk.clear")}</button>
        </div>
      )}

      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-[1_1_560px] overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
          <div className="min-w-[700px]">
            <div className={cn(GRID, "border-b border-border bg-surface-2 px-4 py-2.5 text-[12px] font-medium text-text-3")}>
              <Checkbox checked={allSelected} label={t("selectAll")} onClick={() => setSelected(allSelected ? [] : selectableOpen.map((i) => i.id))} />
              <div>{t("columns.employee")}</div>
              <div>{t("columns.site")}</div>
              <div>{t("columns.when")}</div>
              <div>{t("columns.reason")}</div>
              <div>{t("columns.severity")}</div>
              <div>{t("columns.status")}</div>
            </div>
            {visible.map((it) => {
              const title = it.tab === "unc" ? tItems(`${it.id}.title`) : it.name;
              const tone = REASON_TONE[it.reason];
              const isSelected = selected.includes(it.id);
              const reasonText = it.reason === "geo" ? t("reasons.geoBy", { meters: Math.max(0, it.distance - FENCE_RADIUS[it.site]) }) : t(`reasons.${it.reason}`);
              return (
                <div
                  key={it.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setOpenId(it.id)}
                  onKeyDown={(e) => e.key === "Enter" && setOpenId(it.id)}
                  className={cn(GRID, "cursor-pointer border-b border-border px-4 py-3 text-[13.5px] last:border-b-0", it.id === openId ? "bg-accent-soft" : "hover:bg-hover")}
                >
                  <Checkbox
                    checked={isSelected}
                    label={title}
                    hidden={it.status !== "open"}
                    onClick={(e) => { e.stopPropagation(); setSelected((s) => (s.includes(it.id) ? s.filter((x) => x !== it.id) : [...s, it.id])); setBulk(null); }}
                  />
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="grid size-8 flex-none place-items-center rounded-full text-[12px] font-semibold" style={avatarColors(title)}>{initials(title)}</span>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{title}</div>
                      <div className="truncate text-[12px] text-text-3">{it.tab === "unc" ? tItems(`${it.id}.slot`) : t(`roles.${it.role}`)}</div>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="truncate">{org.siteById(it.site).name}</div>
                    <div className="text-[12px] text-text-3">{org.branchOfSite(it.site).name}</div>
                  </div>
                  <div className="leading-snug text-text-2">{when(it)}</div>
                  <div>
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-[9px] py-1 text-[12px] font-medium", tone.className)}>
                      <span className="size-1.5 flex-none rounded-full" style={{ background: `var(--${tone.name}-dot)` }} />
                      {reasonText}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12.5px] text-text-2">
                    <span className="size-2 rounded-full" style={{ background: SEVERITY_DOT[it.severity] }} />
                    {t(`severity.${it.severity}`)}
                  </div>
                  <div>
                    <span className={cn("rounded-md px-2 py-[3px] text-[12px] font-medium", STATUS_STYLE[it.status].className)}>{t(`status.${it.status}`)}</span>
                  </div>
                </div>
              );
            })}
            {visible.length === 0 && (
              <div className="px-6 py-14 text-center text-[13.5px] text-text-3">
                <div className="mb-1 text-[15px] font-semibold text-text">{t(tab === "resolved" ? "empty.resolvedTitle" : "empty.title")}</div>
                {t("empty.hint")}
              </div>
            )}
          </div>
        </div>

        {current && <AlertDetail item={current} {...handlers} />}
      </div>
    </div>
  );
}
