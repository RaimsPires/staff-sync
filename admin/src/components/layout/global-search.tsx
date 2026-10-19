"use client";

import { MapPin, GitBranch, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { forwardRef, useMemo, useState } from "react";
import { avatarColors, initials } from "@/components/ui/misc";
import { StatusChip } from "@/components/ui/status-chip";
import { useOrg } from "@/lib/org";
import { roleSiteIds, sitesIn } from "@/lib/scope";
import { cn } from "@/lib/utils";
import { useData } from "@/store/data";
import { useSession } from "@/store/session";
import { useAccess } from "@/store/use-access";
import { useRuledRecords } from "@/lib/attendance-rules";

interface Props {
  open: boolean;
  onOpen: () => void;
  onToggle: () => void;
  onClose: () => void;
}

/** Search across employees, sites and branches in the current scope. ⌘K / Ctrl+K focuses it. */
export const GlobalSearch = forwardRef<HTMLInputElement, Props>(function GlobalSearch({ open, onOpen, onToggle, onClose }, inputRef) {
  const org = useOrg();
  const t = useTranslations("Shell.search");
  const tg = useTranslations("Shell.search.groups");
  const tj = useTranslations("Data.jobs");
  const router = useRouter();
  const { role, siteIds } = useAccess();
  const setScope = useSession((s) => s.setScope);
  const today = useRuledRecords(useData((s) => s.today));
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const match = (v: string) => v.toLowerCase().includes(q);
  const limit = q ? 5 : 3;
  const sites = sitesIn(siteIds, org);
  const people = (ids: string[]) => ids.reduce((sum, id) => sum + org.siteById(id).expected, 0);
  const allowed = roleSiteIds(role, org);

  const groups = useMemo(() => {
    const employees = today.filter((r) => siteIds.includes(r.site)).filter((r) => !q || match(r.name) || match(tj(r.job)) || match(org.siteById(r.site).name));
    const siteList = sites.filter((s) => !q || match(s.name) || match(s.address) || match(org.branches.find((b) => b.id === s.branchId)?.name ?? ""));
    const branchList = org.branches.filter((b) => role !== "site" && b.siteIds.every((s) => allowed.includes(s))).filter((b) => !q || match(b.name));
    return [
      { key: "employees", count: employees.length, items: employees.slice(0, limit).map((r) => ({
        key: `e${r.id}`, title: r.name, sub: `${tj(r.job)} · ${org.siteById(r.site).name}`, avatar: r.name, status: (r.fraud ? "fraud" : r.status) as Parameters<typeof StatusChip>[0]["status"],
        go: () => router.push(`/attendance?drawer=${r.id}&date=today`) })) },
      { key: "sites", count: siteList.length, items: siteList.slice(0, limit).map((s) => ({
        key: `s${s.id}`, title: s.name, sub: `${org.branches.find((b) => b.id === s.branchId)?.name} · ${s.address}`, icon: MapPin, tile: "bg-accent-soft text-accent",
        go: () => router.push(`/dashboard?site=${s.id}`) })) },
      { key: "branches", count: branchList.length, items: branchList.slice(0, limit).map((b) => ({
        key: `b${b.id}`, title: b.name, sub: t("branchMeta", { sites: b.siteIds.length, people: people(b.siteIds) }), icon: GitBranch, tile: "bg-violet-bg text-violet",
        go: () => setScope({ kind: "branch", id: b.id }) })) },
    ].filter((g) => g.items.length > 0);
    // `match` and `people` are derived from q/siteIds, which are already dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, today, siteIds, role, limit, tj, router, setScope, t, org]);

  const scopeLabel = role === "admin" ? t("scopeCompany") : t("scopeLimited");

  const panel = (
    <div
      id="global-search-results"
      role="listbox"
      aria-label={t("results")}
      className="z-[2] animate-rise overflow-hidden rounded-xl border border-border bg-surface shadow-pop max-lg:fixed max-lg:inset-x-3 max-lg:top-[72px] lg:absolute lg:left-0 lg:top-[calc(100%+8px)] lg:w-[max(100%,460px)]"
    >
      <div className="border-b border-border p-2.5 lg:hidden">
        <label className="flex h-10 items-center gap-2 rounded-[9px] border border-solid border-accent px-2.5 text-text-3">
          <Search size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} autoFocus placeholder={t("placeholder")} aria-label={t("placeholder")} className="min-w-0 flex-1 border-0 bg-transparent text-[14px] text-text outline-0" />
        </label>
      </div>
      <div className="max-h-[440px] overflow-auto pb-1.5 pt-1">
        {groups.map((g) => (
          <div key={g.key}>
            <div className="flex justify-between px-3.5 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-3">
              <span>{q ? tg(g.key) : `${t("suggested")} · ${tg(g.key)}`}</span>
              <span className="font-mono">{g.count}</span>
            </div>
            {g.items.map((it) => (
              <button key={it.key} role="option" aria-selected={false} onClick={() => { it.go(); setQuery(""); onClose(); }} className="flex w-full items-center gap-3 border-0 bg-transparent px-3.5 py-2 text-left text-text hover:bg-hover">
                {"avatar" in it ? (
                  <span className="grid size-[30px] flex-none place-items-center rounded-full text-[11.5px] font-semibold" style={avatarColors(it.avatar)}>{initials(it.avatar)}</span>
                ) : (
                  <span className={cn("grid size-[30px] flex-none place-items-center rounded-lg", it.tile)}>{it.icon && <it.icon size={15} />}</span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium">{it.title}</span>
                  <span className="block truncate text-[12px] text-text-3">{it.sub}</span>
                </span>
                {"status" in it && <StatusChip status={it.status} />}
              </button>
            ))}
          </div>
        ))}
        {groups.length === 0 && (
          <div className="px-4 py-7 text-center">
            <div className="text-[13.5px] font-semibold">{t("noResults", { query })}</div>
            <div className="mt-0.5 text-[12.5px] text-text-3">{t("noResultsHint")}</div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-border bg-surface-2 px-3.5 py-2 text-[12px] text-text-3">{t("searchingIn", { scope: scopeLabel })}</div>
    </div>
  );

  return (
    <>
      <div className="relative z-[1] hidden min-w-0 max-w-[460px] flex-1 lg:block">
        <label className={cn("flex h-10 items-center gap-2 rounded-[10px] border border-solid bg-surface-2 pl-3 pr-2 text-text-3", open ? "border-accent shadow-[0_0_0_3px_var(--accent-soft)]" : "border-border")}>
          <Search size={16} />
          <input ref={inputRef} value={query} onChange={(e) => { setQuery(e.target.value); onOpen(); }} onFocus={onOpen} placeholder={t("placeholder")} aria-label={t("placeholder")} role="combobox" aria-expanded={open} aria-controls="global-search-results" className="min-w-0 flex-1 border-0 bg-transparent text-[13.5px] text-text outline-0" />
          <kbd className="whitespace-nowrap rounded-[5px] border border-solid border-border bg-surface px-1.5 py-0.5 font-mono text-[11px]">⌘K</kbd>
        </label>
        {open && panel}
      </div>
      <div className="relative z-[1] lg:hidden">
        <button onClick={onToggle} title={t("short")} aria-label={t("short")} className="relative grid size-[38px] place-items-center rounded-[10px] border border-solid border-border bg-surface text-text-2"><Search size={17} /></button>
        {open && panel}
      </div>
    </>
  );
});
