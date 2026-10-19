"use client";

import { Building2, Check, ChevronDown, ChevronRight, GitBranch, MapPin, Search, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BRANCHES, COMPANY_NAME, siteById } from "@/data/org";
import { ROLE_SITES } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useSession } from "@/store/session";
import { useAccess } from "@/store/use-access";
import type { Scope } from "@/types/auth";

const KIND: Record<Scope["kind"], { icon: LucideIcon; tile: string }> = {
  company: { icon: Building2, tile: "bg-text text-surface" },
  branch: { icon: GitBranch, tile: "bg-violet-bg text-violet" },
  site: { icon: MapPin, tile: "bg-accent-soft text-accent" },
};

interface Row {
  key: string;
  scope: Scope;
  label: string;
  sub: string;
  indent: number;
  toggleBranch?: string;
}

const people = (ids: string[]) => ids.reduce((sum, id) => sum + siteById(id).expected, 0);

/** Company → branch → site picker that filters every screen to one level. */
export function ScopeSwitcher({ open, onToggle, onClose }: { open: boolean; onToggle: () => void; onClose: () => void }) {
  const t = useTranslations("Shell.scope");
  const { role, scope } = useAccess();
  const setScope = useSession((s) => s.setScope);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const allowed = ROLE_SITES[role];
  const canCompany = role === "admin";
  const branches = BRANCHES.filter((b) => role !== "site" && b.siteIds.every((s) => allowed.includes(s)));
  const q = query.trim().toLowerCase();
  const match = (v: string) => v.toLowerCase().includes(q);
  const peopleLabel = (ids: string[]) => t("meta", { sites: ids.length, people: people(ids) });
  const selected = (s: Scope) => scope.kind === s.kind && (s.kind === "company" || scope.id === s.id);

  const rows: Row[] = [];
  const company = (indent: number): Row => ({ key: "company", scope: { kind: "company" }, label: COMPANY_NAME, sub: `${t("all")} · ${peopleLabel(allowed)}`, indent });
  const branchRow = (b: (typeof BRANCHES)[number], indent: number, tree: boolean): Row => ({ key: `b-${b.id}`, scope: { kind: "branch", id: b.id }, label: b.name, sub: peopleLabel(b.siteIds), indent, toggleBranch: tree ? b.id : undefined });
  const siteRow = (id: string, indent: number, path: boolean): Row => {
    const s = siteById(id);
    const branch = BRANCHES.find((b) => b.id === s.branchId)?.name;
    return { key: `s-${id}`, scope: { kind: "site", id }, label: s.name, sub: `${path ? `${branch} · ` : ""}${t("people", { count: s.expected })} · ${s.address.split(", ").pop()}`, indent };
  };

  if (!q) {
    if (canCompany) rows.push(company(0));
    branches.forEach((b) => {
      rows.push(branchRow(b, canCompany ? 14 : 0, true));
      if (!collapsed[b.id]) b.siteIds.forEach((id) => rows.push(siteRow(id, canCompany ? 42 : 28, false)));
    });
    if (role === "site") allowed.forEach((id) => rows.push(siteRow(id, 0, true)));
  } else {
    if (canCompany && (match(COMPANY_NAME) || match(t("all")))) rows.push(company(0));
    branches.filter((b) => match(b.name)).forEach((b) => rows.push(branchRow(b, 0, false)));
    allowed.filter((id) => match(siteById(id).name) || match(siteById(id).address)).forEach((id) => rows.push(siteRow(id, 0, true)));
  }

  const branchName = BRANCHES.find((b) => b.id === scope.id)?.name ?? "";
  const siteName = scope.kind === "site" && scope.id ? siteById(scope.id).name : "";
  const siteBranch = scope.kind === "site" && scope.id ? (BRANCHES.find((b) => b.id === siteById(scope.id!).branchId)?.name ?? "") : "";
  const label = scope.kind === "company" ? t("all") : scope.kind === "branch" ? branchName : siteName;
  const kicker = scope.kind === "company" ? COMPANY_NAME : scope.kind === "branch" ? `${COMPANY_NAME} › ${t("branch")}` : `${COMPANY_NAME} › ${siteBranch}`;
  const { icon: Icon, tile } = KIND[scope.kind];

  return (
    <div className="relative z-[1] min-w-0">
      <button
        onClick={onToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn("box-border flex h-[42px] max-w-[230px] items-center gap-2.5 rounded-[10px] border border-solid bg-surface py-0 pl-1.5 pr-2.5 text-text hover:bg-hover lg:max-w-[280px]", open ? "border-accent" : "border-border")}
      >
        <span className={cn("grid size-[30px] flex-none place-items-center rounded-lg", tile)}><Icon size={16} /></span>
        <span className="flex min-w-0 flex-col items-start text-left leading-tight">
          <span className="max-w-full truncate text-[11px] text-text-3">{kicker}</span>
          <span className="max-w-full truncate text-[13.5px] font-semibold">{label}</span>
        </span>
        <ChevronDown size={15} className="flex-none text-text-3" />
      </button>

      {open && (
        <div role="dialog" aria-label={t("title")} className="absolute left-0 top-[calc(100%+8px)] z-[2] w-[340px] max-w-[calc(100vw-24px)] animate-rise overflow-hidden rounded-xl border border-border bg-surface shadow-pop">
          <div className="border-b border-border p-2.5">
            <label className="flex h-9 items-center gap-2 rounded-[9px] border border-solid border-border-strong px-2.5 text-text-3">
              <Search size={15} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} autoFocus placeholder={t("search")} aria-label={t("search")} className="min-w-0 flex-1 border-0 bg-transparent text-[13.5px] text-text outline-0" />
            </label>
          </div>
          <div className="max-h-[360px] overflow-auto p-1.5">
            {rows.map((r) => {
              const { icon: RowIcon, tile: rowTile } = KIND[r.scope.kind];
              const on = selected(r.scope);
              return (
                <div key={r.key} className="flex items-center gap-0.5" style={{ paddingLeft: r.indent }}>
                  {r.toggleBranch ? (
                    <button onClick={(e) => { e.stopPropagation(); setCollapsed((c) => ({ ...c, [r.toggleBranch!]: !c[r.toggleBranch!] })); }} title={t(collapsed[r.toggleBranch] ? "expand" : "collapse")} aria-label={t(collapsed[r.toggleBranch] ? "expand" : "collapse")} className="grid size-[22px] flex-none place-items-center rounded-md border-0 bg-transparent p-0 text-text-3 hover:bg-hover">
                      <ChevronRight size={14} className={cn("transition-transform", !collapsed[r.toggleBranch] && "rotate-90")} />
                    </button>
                  ) : <span className="w-[22px] flex-none" />}
                  <button
                    onClick={() => { setScope(r.scope); setQuery(""); onClose(); }}
                    role="option"
                    aria-selected={on}
                    className={cn("flex min-w-0 flex-1 items-center gap-2.5 rounded-lg border-0 px-2 py-[7px] text-left text-text hover:bg-hover", on && "bg-accent-soft")}
                  >
                    <span className={cn("grid size-[26px] flex-none place-items-center rounded-[7px]", rowTile)}><RowIcon size={14} /></span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-[13.5px]", on ? "font-semibold" : "font-medium")}>{r.label}</span>
                      <span className="block truncate text-[11.5px] text-text-3">{r.sub}</span>
                    </span>
                    {on && <Check size={15} className="flex-none text-accent" />}
                  </button>
                </div>
              );
            })}
            {rows.length === 0 && <div className="px-3 py-5 text-center text-[13px] text-text-3">{t("none", { query })}</div>}
          </div>
          <div className="border-t border-border bg-surface-2 px-3 py-2.5 text-[12px] text-text-3">{t(canCompany ? "noteAll" : "noteLimited")}</div>
        </div>
      )}
    </div>
  );
}
