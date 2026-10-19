"use client";

import { KeepMounted } from "@/components/ui/overlay";
import { Check, ChevronDown, ChevronLeft } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { Segmented } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { useOrg } from "@/lib/org";
import { exportTable } from "@/lib/export";
import { cn } from "@/lib/utils";
import type { ExportKind, GroupBy, RangeKey, ReportConfig } from "@/types/reports";
import { ScopeDialog } from "./dialogs";
import { computeReport, formatValue, GROUPS, parseDay, RANGE_KEYS, RANGES, rangeOf, REPORTS } from "./model";

const trigger = "flex h-[34px] items-center gap-2 rounded-[9px] border border-solid bg-surface px-3 text-[13px] text-text";

interface Props {
  config: ReportConfig;
  onChange: (p: Partial<ReportConfig>) => void;
  title: string;
  onBack: () => void;
  onSave: () => void;
  onSchedule: () => void;
}

export function ReportView({ config, onChange, title, onBack, onSave, onSchedule }: Props) {
  const org = useOrg();
  const t = useTranslations("Reports.view");
  const tRange = useTranslations("Reports.ranges");
  const tGroup = useTranslations("Reports.groups");
  const tCol = useTranslations("Reports.cols");
  const tUnit = useTranslations("Reports.units");
  const tExport = useTranslations("Reports.export");
  const tFmt = useTranslations("Reports.export.formats");
  const format = useFormatter();
  const toast = useToast();
  const [mode, setMode] = useState<"table" | "chart">("table");
  const [metric, setMetric] = useState("");
  const [scopeOpen, setScopeOpen] = useState(false);

  const shortDay = (ms: number) => format.dateTime(new Date(ms), { day: "numeric", month: "short", timeZone: "UTC" });
  const [from, to] = rangeOf(config);
  const badRange = !from || !to || parseDay(to) < parseDay(from);
  const data = useMemo(
    () => computeReport(config, org, (ms) => format.dateTime(new Date(ms), { day: "numeric", month: "short", timeZone: "UTC" })),
    [config, org, format],
  );
  const label = (key: string) => tCol(`${config.type}.${key}`);
  const header = (c: (typeof data.cols)[number]) => `${label(c.key)}${c.unit === "%" ? "" : ` (${tUnit(c.unit)})`}`;
  const groupWord = tGroup(`${config.group}.plural`);

  const metricKey = data.cols.some((c) => c.key === metric) ? metric : (data.cols[0]?.key ?? "");
  const mi = data.cols.findIndex((c) => c.key === metricKey);
  const chartRows = useMemo(() => {
    if (mi < 0) return [];
    const src = config.group === "day" ? data.rows.slice(0, 31) : [...data.rows].sort((a, b) => b.vals[mi] - a.vals[mi]).slice(0, 12);
    return src.map((r) => ({ name: r.key.split(" ")[0], full: r.key, value: Math.round(r.vals[mi] * 10) / 10 }));
  }, [data, mi, config.group]);
  const totals = data.cols.map((c, i) => { const arr = data.rows.map((r) => r.vals[i]); const sum = arr.reduce((a, b) => a + b, 0); return formatValue(c.sum ? sum : sum / Math.max(1, arr.length), c.unit); });

  const nScope = (config.branches.length ? 1 : 0) + (config.sites.length ? 1 : 0) + (config.emps.length ? 1 : 0);
  const scopeLabel = nScope === 0 ? t("everything") : [
    config.branches.length && (config.branches.length === 1 ? (org.branches.find((b) => b.id === config.branches[0])?.name ?? "") : t("branchesCount", { count: config.branches.length })),
    config.sites.length && (config.sites.length === 1 ? org.siteById(config.sites[0]).name.split(" ")[0] : t("sitesCount", { count: config.sites.length })),
    config.emps.length && (config.emps.length === 1 ? config.emps[0].split(" ")[0] : t("peopleCount", { count: config.emps.length })),
  ].filter(Boolean).join(" · ");
  const rangeLabel = config.range === "custom" ? (from && to ? `${shortDay(parseDay(from))} – ${shortDay(parseDay(to))}` : t("pickDates")) : tRange(`${config.range}.label`);
  const rangeError = config.range === "custom" && badRange ? t(from && to ? "endBeforeStart" : "chooseBoth") : "";

  const doExport = async (kind: ExportKind) => {
    if (!data.rows.length) return toast(t("nothingToExport"), "bad");
    const table = [[tGroup(`${config.group}.label`), ...data.cols.map(header)], ...data.rows.map((r) => [r.key, ...r.vals.map((v, i) => formatValue(v, data.cols[i].unit))])];
    await exportTable(kind, config.type, title, table);
    toast(t("exported", { count: data.rows.length, format: tFmt(kind) }));
  };

  const noRowsText = !config.cols.length ? t("noColumns") : badRange ? t("fixRange") : t("noMatch");
  const toggleCol = (k: string) => onChange({ cols: config.cols.includes(k) ? config.cols.filter((x) => x !== k) : [...config.cols, k] });
  const optionRow = "flex h-[34px] w-full items-center gap-2 rounded-lg border-0 px-2.5 text-left text-[13px] text-text hover:bg-hover";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={onBack} aria-label={t("back")} className="flex h-8 items-center gap-1.5 rounded-lg border-0 bg-transparent pl-1.5 pr-2.5 text-[13px] text-text-2 hover:bg-hover"><ChevronLeft size={16} />{t("reports")}</button>
        <h2 className="m-0 min-w-[160px] flex-1 text-[20px] font-semibold tracking-tight">{title}</h2>
        <Button onClick={onSave}>{t("save")}</Button>
        <Button onClick={onSchedule}>{t("schedule")}</Button>
        <Popover align="right" panelClassName="w-[160px] p-1.5" trigger={({ toggle }) => <Button variant="primary" onClick={toggle}>{t("export")}</Button>}>
          {(close) => (["csv", "xlsx", "pdf"] as const).map((k) => <button key={k} onClick={() => { close(); void doExport(k); }} className={optionRow}>{tExport(`menu.${k}`)}</button>)}
        </Popover>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 shadow-card">
        <Popover panelClassName="w-[260px] p-1.5" trigger={({ toggle }) => <button onClick={toggle} className={cn(trigger, badRange ? "border-bad-dot" : "border-border-strong")}><span className="text-text-3">{t("dates")}</span><b className="font-medium">{rangeLabel}</b><ChevronDown size={13} /></button>}>
          {(close) => (<>
            {RANGE_KEYS.map((k: RangeKey) => (
              <button key={k} onClick={() => { onChange(k === "custom" ? { range: k, from: from || RANGES.month.from, to: to || RANGES.month.to } : { range: k }); if (k !== "custom") close(); }} className={cn(optionRow, config.range === k && "bg-accent-soft")}>
                <span className="w-3.5 font-bold text-accent">{config.range === k ? <Check size={13} /> : null}</span>{tRange(`${k}.label`)}{k !== "custom" && <span className="text-text-3"> · {tRange(`${k}.short`)}</span>}
              </button>
            ))}
            {config.range === "custom" && (
              <div className="flex gap-1.5 px-1.5 pb-1.5 pt-2">
                <input type="date" value={config.from} onChange={(e) => onChange({ from: e.target.value })} aria-label={t("from")} className="h-8 min-w-0 flex-1 rounded-lg border border-solid border-border-strong bg-surface px-1.5 text-[12.5px] text-text" />
                <input type="date" value={config.to} onChange={(e) => onChange({ to: e.target.value })} aria-label={t("to")} aria-invalid={badRange} className={cn("h-8 min-w-0 flex-1 rounded-lg border border-solid bg-surface px-1.5 text-[12.5px] text-text", badRange ? "border-bad-dot" : "border-border-strong")} />
              </div>
            )}
          </>)}
        </Popover>
        <Popover panelClassName="w-[200px] p-1.5" trigger={({ toggle }) => <button onClick={toggle} className={cn(trigger, "border-border-strong")}><span className="text-text-3">{t("groupBy")}</span><b className="font-medium">{tGroup(`${config.group}.label`)}</b><ChevronDown size={13} /></button>}>
          {(close) => GROUPS.map((k: GroupBy) => <button key={k} onClick={() => { onChange({ group: k }); close(); }} className={cn(optionRow, config.group === k && "bg-accent-soft")}><span className="w-3.5 text-accent">{config.group === k ? <Check size={13} /> : null}</span>{tGroup(`${k}.label`)}</button>)}
        </Popover>
        <button onClick={() => setScopeOpen(true)} className={cn(trigger, nScope ? "border-accent bg-accent-soft" : "border-border-strong")}><span className="text-text-3">{t("scope")}</span><b className="font-medium">{scopeLabel}</b><ChevronDown size={13} /></button>
        <Popover panelClassName="w-[250px] p-1.5" trigger={({ toggle }) => <button onClick={toggle} className={cn(trigger, config.cols.length ? "border-border-strong" : "border-bad-dot")}><span className="text-text-3">{t("columns")}</span><b className="font-medium">{config.cols.length}</b><ChevronDown size={13} /></button>}>
          {() => (<>
            {REPORTS[config.type].cols.map((c) => {
              const on = config.cols.includes(c.key);
              return (
                <button key={c.key} role="checkbox" aria-checked={on} onClick={() => toggleCol(c.key)} className={optionRow}>
                  <span className={cn("grid size-4 place-items-center rounded-[4px] border-[1.5px] border-solid text-white", on ? "border-accent bg-accent" : "border-border-strong text-transparent")}><Check size={11} strokeWidth={3.4} /></span>{label(c.key)}<span className="ml-auto text-[11.5px] text-text-3">{tUnit(c.unit)}</span>
                </button>
              );
            })}
            {!config.cols.length && <div className="px-2.5 pb-1 pt-1 text-[12px] text-bad">{t("colError")}</div>}
          </>)}
        </Popover>
        <div className="flex-1" />
        <Segmented value={mode} onChange={setMode} items={[{ id: "table", label: t("table") }, { id: "chart", label: t("chart") }]} />
      </div>
      {rangeError && <div role="alert" className="text-[12.5px] text-bad">{rangeError}</div>}

      {data.rows.length > 0 ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[13px] text-text-2">{t("summary", { count: data.rows.length, noun: groupWord, range: badRange ? "" : `${shortDay(parseDay(from))} – ${shortDay(parseDay(to))}` })}</span>
            <div className="flex-1" />
            {mode === "chart" && (
              <label className="flex items-center gap-2 text-[12.5px] text-text-2">{t("metric")}
                <select value={metricKey} onChange={(e) => setMetric(e.target.value)} className="h-[30px] rounded-lg border border-solid border-border-strong bg-surface px-2 text-[12.5px] text-text">{data.cols.map((c) => <option key={c.key} value={c.key}>{label(c.key)}</option>)}</select>
              </label>
            )}
          </div>
          {mode === "chart" ? (
            <div className="overflow-x-auto rounded-xl border border-border bg-surface px-4 pb-2.5 pt-[18px] shadow-card">
              <div style={{ minWidth: Math.max(300, chartRows.length * 34), height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartRows} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-3)" }} tickLine={false} axisLine={false} interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--text-3)" }} tickLine={false} axisLine={false} width={36} />
                    <Tooltip cursor={{ fill: "var(--hover)" }} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} labelFormatter={(_l, p) => p?.[0]?.payload?.full ?? ""} formatter={(v) => [`${v} ${data.cols[mi].unit}`, label(metricKey)]} />
                    <Bar dataKey="value" fill="var(--accent)" radius={[5, 5, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
              <div style={{ minWidth: Math.max(520, 180 + data.cols.length * 120) }}>
                <div className="flex rounded-t-xl border-b border-border bg-surface-2 text-[11.5px] font-semibold uppercase tracking-[.04em] text-text-3">
                  <div className="min-w-0 flex-[1.6] px-4 py-2.5">{tGroup(`${config.group}.label`)}</div>
                  {data.cols.map((c) => <div key={c.key} className="min-w-0 flex-1 px-4 py-2.5 text-right">{header(c)}</div>)}
                </div>
                {data.rows.map((r) => (
                  <div key={r.key} className="flex border-b border-border text-[13px] hover:bg-hover">
                    <div className="min-w-0 flex-[1.6] truncate px-4 py-2.5 font-medium">{r.key}</div>
                    {r.vals.map((v, i) => <div key={data.cols[i].key} className="min-w-0 flex-1 px-4 py-2.5 text-right font-mono text-[12.5px] text-text-2">{formatValue(v, data.cols[i].unit)}</div>)}
                  </div>
                ))}
                <div className="flex rounded-b-xl bg-surface-2 text-[13px] font-semibold">
                  <div className="min-w-0 flex-[1.6] px-4 py-[11px]">{t("total", { count: data.rows.length, noun: groupWord })}</div>
                  {totals.map((v, i) => <div key={data.cols[i].key} className="min-w-0 flex-1 px-4 py-[11px] text-right font-mono text-[12.5px]">{v}</div>)}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border-strong bg-surface px-4 py-12 text-center text-[13.5px] text-text-3">{noRowsText}</div>
      )}
      <KeepMounted show={!!scopeOpen}>{scopeOpen && <ScopeDialog config={config} onChange={onChange} onClose={() => setScopeOpen(false)} />}</KeepMounted>
    </div>
  );
}
