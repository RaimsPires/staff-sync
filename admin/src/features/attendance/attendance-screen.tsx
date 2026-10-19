"use client";

import { CalendarPlus, ChevronLeft, ChevronRight, ClipboardList, Download, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Popover } from "@/components/ui/popover";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/misc";
import { useOrg } from "@/lib/org";
import { exportTable, type ExportFormat, type Table } from "@/lib/export";
import { cn } from "@/lib/utils";
import { useAccess } from "@/store/use-access";
import { useData } from "@/store/data";
import type { AttendanceRecord, RecordStatus } from "@/types/domain";
import { AddRecordDialog } from "./add-record-dialog";
import { ALL_COLUMNS, FiltersBar, STATUS_OPTIONS, type Column } from "./filters-bar";
import { applyBaseFilters, applyFilters, DEFAULT_FILTERS, employeeCode, isFlagged, methodOf, rangeOf, sortRecords, statusOf, withDate, type Filters, type Sort, type SortKey } from "./model";
import { RecordDrawer } from "./record-drawer";
import { RecordsTable } from "./records-table";
import { useRuledRecords } from "@/lib/attendance-rules";
import { useDateFormat } from "@/lib/preferences";

interface SavedView {
  id: string;
  name: string;
  filters: Filters;
  /** Built-in views cannot be deleted. */
  builtin?: boolean;
}

const PER_PAGE = [10, 25, 50];
const NOW_AT = "15 Oct 10:42";

export interface AttendanceInitial {
  /** Preset from a dashboard card or map link. */
  status?: string;
  site?: string;
  date?: string;
  drawer?: number;
}

function initialFilters(initial: AttendanceInitial): Filters {
  const preset: Partial<Filters> = {};
  if (initial.status && initial.status !== "all" && (STATUS_OPTIONS as string[]).includes(initial.status)) preset.statuses = [initial.status as RecordStatus];
  if (initial.site) preset.site = initial.site;
  if (initial.status || initial.site || initial.date === "today") preset.range = "today";
  return { ...DEFAULT_FILTERS, ...preset };
}

export function AttendanceScreen({ initial }: { initial: AttendanceInitial }) {
  const org = useOrg();
  const t = useTranslations("Attendance");
  const tStatus = useTranslations("Status");
  const router = useRouter();
  const format = useFormatter();
  const toast = useToast();
  const { siteIds, perms, scope, me } = useAccess();
  const today = useRuledRecords(useData((s) => s.today));
  const history = useRuledRecords(useData((s) => s.history));
  const updateRecord = useData((s) => s.updateRecord);
  const numericDate = useDateFormat();

  const [filters, setFilters] = useState<Filters>(() => initialFilters(initial));
  const [sort, setSort] = useState<Sort>({ key: "date", dir: "desc" });
  const [hidden, setHidden] = useState<Partial<Record<Column, boolean>>>({});
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [drawerId, setDrawerId] = useState<number | null>(initial.drawer ?? null);
  const [adding, setAdding] = useState(false);
  const [views, setViews] = useState<SavedView[]>([{ id: "pn-late", name: t("views.parisLate"), filters: { ...DEFAULT_FILTERS, range: "month", branch: "pn", statuses: ["late"] } }]);
  const [activeView, setActiveView] = useState<string | null>("all");

  const builtinViews: SavedView[] = [
    { id: "all", name: t("views.all"), filters: DEFAULT_FILTERS, builtin: true },
    { id: "flagged", name: t("views.flagged"), filters: { ...DEFAULT_FILTERS, flaggedOnly: true }, builtin: true },
    { id: "missing", name: t("views.missing"), filters: { ...DEFAULT_FILTERS, range: "month", statuses: ["missing"] }, builtin: true },
  ];
  const allViews = [...builtinViews, ...views];

  const all = useMemo(() => [...today.map(withDate), ...history], [today, history]);
  const base = useMemo(() => applyBaseFilters(all, filters, siteIds, org), [all, filters, siteIds, org]);
  const filtered = useMemo(() => applyFilters(all, filters, siteIds, org), [all, filters, siteIds, org]);
  const sorted = useMemo(() => sortRecords(filtered, sort, org), [filtered, sort, org]);
  const pages = Math.max(1, Math.ceil(sorted.length / perPage));
  const current = Math.min(page, pages);
  const rows = sorted.slice((current - 1) * perPage, current * perPage);
  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(STATUS_OPTIONS.map((s) => [s, 0])) as Record<RecordStatus, number>;
    base.forEach((r) => (counts[statusOf(r)] += 1));
    return counts;
  }, [base]);

  const change = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
    setSelected(new Set());
    setActiveView(null);
  };
  const apply = (v: SavedView) => {
    setFilters(v.filters);
    setActiveView(v.id);
    setPage(1);
    setSelected(new Set());
  };

  const [from, to] = rangeOf(filters);
  const rangeText = filters.range === "custom" ? `${format.dateTime(new Date(2026, 9, from), { day: "numeric", month: "short" })} – ${format.dateTime(new Date(2026, 9, to), { day: "numeric", month: "short" })}` : t(`ranges.${filters.range}`);
  const scopeText = scope.kind === "company" ? t("scope.company") : scope.kind === "branch" ? (org.branchById(scope.id ?? "")?.name ?? "") : org.siteById(scope.id ?? "").name;

  const selectedRecords = all.filter((r) => selected.has(r.id));
  const pageIds = rows.map((r) => r.id);
  const pageAllSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const toTable = (list: AttendanceRecord[]): Table => [
    [t("export.date"), t("export.employeeId"), t("export.employee"), t("export.site"), t("export.scheduled"), t("export.checkIn"), t("export.checkOut"), t("export.worked"), t("export.status"), t("export.method"), t("export.flagged"), t("export.editedBy")],
    ...list.map((r) => [
      numericDate(Date.UTC(2026, 9, r.date ?? 15)), employeeCode(r), r.name, org.siteById(r.site).name, r.sched, r.in, r.out, r.worked,
      tStatus(r.fraud ? "fraud" : r.status), methodOf(r), isFlagged(r) ? t("export.yes") : "", r.edit?.by ?? "",
    ]),
  ];
  const doExport = async (formatKey: ExportFormat, list: AttendanceRecord[]) => {
    try {
      await exportTable(formatKey, "staffsync-attendance", t("title"), toTable(list));
      toast(t("export.done", { count: list.length, format: formatKey.toUpperCase() }));
    } catch {
      toast(t("export.failed"), "bad");
    }
  };

  const bulkApprove = () => {
    selectedRecords.forEach((r) => updateRecord(r.id, { approved: me.name, approvedAt: NOW_AT, ...(isFlagged(r) ? { cleared: true, status: r.lateBy ? "late" : "ontime" } : {}) }));
    toast(t("bulk.approved", { count: selectedRecords.length }));
    setSelected(new Set());
  };
  const bulkAbsent = () => {
    const targets = selectedRecords.filter((r) => r.status !== "leave" && r.status !== "holiday");
    targets.forEach((r) => updateRecord(r.id, { status: "absent", in: "", out: "", worked: "", flag: undefined, edit: { by: me.name, at: NOW_AT } }));
    toast(`${t("bulk.absent", { count: targets.length })}${selectedRecords.length - targets.length ? ` · ${t("bulk.leaveSkipped")}` : ""}`, "bad");
    setSelected(new Set());
  };

  const toggleSort = (key: SortKey) => {
    setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }));
    setPage(1);
  };
  const pageNumbers = Array.from({ length: pages }, (_, i) => i + 1).reduce<(number | "gap")[]>((acc, p) => {
    if (p === 1 || p === pages || Math.abs(p - current) <= 1) acc.push(p);
    else if (acc[acc.length - 1] !== "gap") acc.push("gap");
    return acc;
  }, []);

  const button = "flex h-[34px] items-center gap-[7px] whitespace-nowrap rounded-[9px] border border-solid border-border-strong bg-surface px-3 text-[13px] font-medium text-text hover:bg-hover";

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="m-0 text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <div className="mt-1 text-[13.5px] text-text-2">{t("subtitle", { count: filtered.length, range: rangeText.toLowerCase(), scope: scopeText })}</div>
        </div>
        <div className="flex items-center gap-2">
          <Popover
            align="right"
            panelClassName="w-[230px] p-1.5"
            trigger={({ toggle }) => (
              <button onClick={toggle} className={button}>
                <Download size={15} /> {t("export.button")}
              </button>
            )}
          >
            {(close) => (
              <>
                <div className="px-2.5 pb-2 pt-1.5 text-[12px] text-text-3">{t("export.note", { count: filtered.length })}</div>
                {([["csv", "CSV", "bg-ok-bg text-ok"], ["xlsx", "Excel (.xlsx)", "bg-accent-soft text-accent"], ["pdf", "PDF", "bg-bad-bg text-bad"]] as const).map(([key, label, tone]) => (
                  <button key={key} onClick={() => { close(); void doExport(key, sorted); }} className="flex h-9 w-full items-center gap-2.5 rounded-lg border-0 bg-transparent px-2.5 text-[13px] text-text hover:bg-hover">
                    <span className={cn("w-8 rounded-[5px] px-[5px] py-[3px] text-center font-mono text-[10px] font-semibold", tone)}>{key.toUpperCase()}</span>
                    {label}
                  </button>
                ))}
              </>
            )}
          </Popover>
          {(perms.edit || perms.admin) && (
            <button onClick={() => setAdding(true)} className={button}>
              <CalendarPlus size={15} /> {t("add.button")}
            </button>
          )}
        </div>
      </div>

      {all.length === 0 ? (
        <EmptyState
          title={t("emptyCompany.title")}
          hint={t("emptyCompany.hint")}
          action={
            <div className="flex justify-center gap-2">
              <button onClick={() => router.push("/schedules")} className={button}>
                {t("emptyCompany.createSchedule")}
              </button>
              <button onClick={() => setAdding(true)} className={button}>
                {t("add.button")}
              </button>
            </div>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[12px] font-semibold uppercase tracking-wider text-text-3">{t("views.title")}</span>
            {allViews.map((v) => {
              const on = activeView === v.id;
              return (
                <span key={v.id} className={cn("inline-flex h-[30px] items-center overflow-hidden rounded-full border border-solid", on ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-text-2")}>
                  <button onClick={() => apply(v)} className="flex h-full items-center border-0 bg-transparent px-3 text-[12.5px] font-medium text-inherit">
                    {v.name}
                  </button>
                  {!v.builtin && (
                    <button
                      onClick={() => { setViews((vs) => vs.filter((x) => x.id !== v.id)); if (on) setActiveView(null); toast(t("views.deleted"), "info"); }}
                      title={t("views.delete")}
                      aria-label={t("views.delete")}
                      className="grid h-full w-6 place-items-center border-0 bg-transparent text-text-3"
                    >
                      <X size={12} />
                    </button>
                  )}
                </span>
              );
            })}
          </div>

          <div className="rounded-xl border border-border bg-surface shadow-card">
            <FiltersBar
              filters={filters}
              onChange={change}
              onClear={() => { setFilters(DEFAULT_FILTERS); setPage(1); setSelected(new Set()); setActiveView("all"); }}
              statusCounts={statusCounts}
              accessibleSites={siteIds}
              hidden={hidden}
              onToggleColumn={(c) => setHidden((h) => ({ ...h, [c]: !h[c] }))}
              onSaveView={(name) => {
                const id = `v${views.length + 1}-${name}`;
                setViews((vs) => [...vs, { id, name, filters }]);
                setActiveView(id);
                toast(t("views.saved", { name }));
              }}
            />

            {selected.size > 0 && (
              <div className="flex flex-wrap items-center gap-2.5 border-b border-border bg-accent-soft px-3.5 py-2">
                <span className="text-[13px] font-semibold text-accent">{t("bulk.selected", { count: selected.size })}</span>
                {pageAllSelected && sorted.length > selected.size && (
                  <button onClick={() => setSelected(new Set(sorted.map((r) => r.id)))} className="border-0 bg-transparent p-0 text-[12.5px] text-accent underline">
                    {t("bulk.selectAll", { count: sorted.length })}
                  </button>
                )}
                <div className="flex-1" />
                {(perms.review || perms.edit) && <button onClick={bulkApprove} className={button}>{t("bulk.approve")}</button>}
                {perms.edit && <button onClick={bulkAbsent} className={button}>{t("bulk.markAbsent")}</button>}
                <button onClick={() => void doExport("csv", selectedRecords)} className={button}>{t("bulk.exportSelected")}</button>
                <button onClick={() => setSelected(new Set())} title={t("bulk.clear")} aria-label={t("bulk.clear")} className="grid size-[30px] place-items-center rounded-lg border-0 bg-transparent text-text-2">
                  <X size={15} />
                </button>
              </div>
            )}

            {sorted.length > 0 ? (
              <RecordsTable
                rows={rows}
                columns={ALL_COLUMNS}
                hidden={hidden}
                sort={sort}
                onSort={toggleSort}
                selected={selected}
                onToggle={(id) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; })}
                onTogglePage={() => setSelected((s) => { const n = new Set(s); pageIds.forEach((id) => (pageAllSelected ? n.delete(id) : n.add(id))); return n; })}
                openId={drawerId}
                onOpen={setDrawerId}
              />
            ) : (
              <div className="flex flex-col items-center gap-1.5 px-6 py-14 text-center">
                <ClipboardList size={26} className="text-text-3" />
                <div className="text-[15px] font-semibold">{t("noResults.title")}</div>
                <div className="max-w-[420px] text-[13px] text-text-3">{t("noResults.hint")}</div>
                <button onClick={() => { setFilters(DEFAULT_FILTERS); setActiveView("all"); }} className={cn(button, "mt-2")}>
                  {t("filters.clearAll", { count: 0 })}
                </button>
              </div>
            )}

            {sorted.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 px-3.5 py-2.5 text-[13px] text-text-2">
                <label className="flex items-center gap-2">
                  {t("pagination.perPage")}
                  <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} className="h-8 rounded-lg border border-solid border-border-strong bg-surface px-2 text-[13px] text-text">
                    {PER_PAGE.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="font-mono text-[12.5px]">
                  {(current - 1) * perPage + 1}–{Math.min(current * perPage, sorted.length)} {t("pagination.of")} {sorted.length}
                </span>
                <div className="flex-1" />
                <nav className="flex items-center gap-1" aria-label={t("pagination.label")}>
                  <button onClick={() => setPage(Math.max(1, current - 1))} disabled={current <= 1} aria-label={t("pagination.previous")} className="grid size-8 place-items-center rounded-lg border border-solid border-border bg-surface disabled:opacity-40">
                    <ChevronLeft size={15} />
                  </button>
                  {pageNumbers.map((p, i) =>
                    p === "gap" ? (
                      <span key={`g${i}`} className="px-1 text-text-3">…</span>
                    ) : (
                      <button key={p} onClick={() => setPage(p)} aria-current={p === current ? "page" : undefined} className={cn("h-8 min-w-8 rounded-lg border border-solid px-2 text-[12.5px] font-medium", p === current ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-text")}>
                        {p}
                      </button>
                    ),
                  )}
                  <button onClick={() => setPage(Math.min(pages, current + 1))} disabled={current >= pages} aria-label={t("pagination.next")} className="grid size-8 place-items-center rounded-lg border border-solid border-border bg-surface disabled:opacity-40">
                    <ChevronRight size={15} />
                  </button>
                </nav>
              </div>
            )}
          </div>
        </>
      )}

      <RecordDrawer recordId={drawerId} onClose={() => setDrawerId(null)} />
      <AddRecordDialog open={adding} onClose={() => setAdding(false)} siteIds={siteIds} actor={me.name} onOpenRecord={setDrawerId} />
    </div>
  );
}
