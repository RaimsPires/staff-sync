"use client";

import { useOrg } from "@/lib/org";
import { Check, FileSpreadsheet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { downloadText, toCsv } from "@/lib/export";
import { cn } from "@/lib/utils";
import { useEmployees } from "@/store/employees";
import { CSV_HEADERS, CSV_TEMPLATE, DEFAULT_MAP, IMPORT_FIELDS, draftFromEmployee, rowToEmployee, SAMPLE_CSV, validateRows, type ColumnMap, type ImportField } from "./model";

const STEPS = ["upload", "map", "preview", "result"] as const;

/** Parses a CSV file: first line is the header; quoted commas are supported. */
function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.replace(/^﻿/, "").trim().split(/\r?\n/).filter(Boolean);
  const split = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let quoted = false;
    for (const ch of line) {
      if (ch === '"') quoted = !quoted;
      else if (ch === "," && !quoted) { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  };
  return { headers: split(lines[0] ?? ""), rows: lines.slice(1).map(split) };
}

export function ImportWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  return open ? <Wizard onClose={onClose} /> : null;
}

function Wizard({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Employees.import");
  const te = useTranslations("Employees.titles");
  const toast = useToast();
  const org = useOrg();
  const employees = useEmployees((s) => s.employees);
  const upsert = useEmployees((s) => s.upsert);
  const [busy, setBusy] = useState(false);

  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState(CSV_HEADERS);
  const [rows, setRows] = useState<string[][]>(SAMPLE_CSV);
  const [map, setMap] = useState<ColumnMap>(DEFAULT_MAP);
  const [imported, setImported] = useState(0);

  const preview = useMemo(() => (step >= 3 ? validateRows(rows, map, employees.map((e) => e.id), org) : []), [step, rows, map, employees, org]);
  const ok = preview.filter((p) => p.errors.length === 0);
  const bad = preview.length - ok.length;
  const missingRequired = IMPORT_FIELDS.some((f) => f.required && map[f.key] === "");

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const parsed = parseCsv(await file.text());
    if (parsed.headers.length === 0 || parsed.rows.length === 0) return toast(t("emptyFile"), "bad");
    setFileName(file.name);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    // Match columns by header name when possible; otherwise keep the positional default.
    const guess = (words: string[], fallback: number): number | "" => {
      const i = parsed.headers.findIndex((h) => words.some((w) => h.toLowerCase().includes(w)));
      return i >= 0 ? i : fallback < parsed.headers.length ? fallback : "";
    };
    setMap({ name: guess(["name", "nom"], 0), id: guess(["id"], 1), phone: guess(["phone", "mobile", "tel"], 2), branch: guess(["branch", "agence"], 3), site: guess(["site"], 4), title: guess(["title", "role", "job", "poste"], 5) });
  };

  const next = async () => {
    if (step === 1 && fileName) setStep(2);
    else if (step === 2 && !missingRequired) setStep(3);
    else if (step === 3 && ok.length > 0) {
      // One employee at a time so a bad row (for example a phone number without a country code) doesn't stop the others.
      setBusy(true);
      let done = 0;
      for (const p of ok) {
        try {
          await upsert(draftFromEmployee(rowToEmployee(p, org)));
          done += 1;
        } catch {
          // counted below
        }
      }
      setBusy(false);
      if (done < ok.length) toast(t("someFailed", { count: ok.length - done }), "bad");
      setImported(done);
      setStep(4);
    } else if (step === 4) onClose();
  };
  const disabled = busy || (step === 1 && !fileName) || (step === 2 && missingRequired) || (step === 3 && ok.length === 0);
  const label = step === 3 ? t("importCount", { count: ok.length }) : t(`next.${step}`);

  return (
    <Modal
      open
      onClose={onClose}
      className="max-w-[760px]"
      title={
        <ol className="m-0 flex list-none items-center gap-3 p-0 text-[13px]">
          {STEPS.map((s, i) => {
            const n = i + 1;
            return (
              <li key={s} className={cn("flex items-center gap-2", n === step ? "font-semibold text-text" : "font-medium text-text-3")} aria-current={n === step ? "step" : undefined}>
                <span className={cn("grid size-[22px] place-items-center rounded-full text-[11.5px]", n === step ? "bg-accent text-white" : n < step ? "bg-ok-bg text-ok" : "bg-neutral-bg text-neutral")}>
                  {n < step ? <Check size={12} strokeWidth={3} /> : n}
                </span>
                {t(`steps.${s}`)}
              </li>
            );
          })}
        </ol>
      }
      footer={
        <>
          {step > 1 && step < 4 && <Button onClick={() => setStep(step - 1)}>{t("back")}</Button>}
          <Button variant="primary" onClick={next} disabled={disabled}>
            {label}
          </Button>
        </>
      }
    >
      {step === 1 && (
        <div className="flex flex-col gap-3.5">
          <label className={cn("flex cursor-pointer flex-col items-center gap-2 rounded-xl border-[1.5px] border-dashed px-5 py-9 text-center hover:border-accent", fileName ? "border-ok-dot bg-ok-bg" : "border-border-strong bg-surface-2")}>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
            <FileSpreadsheet size={26} className="text-accent" />
            <div className="font-semibold">{fileName || t("choose")}</div>
            <div className="text-[12.5px] text-text-3">{fileName ? t("ready", { count: rows.length }) : t("dropHint")}</div>
          </label>
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-text-2">
            <button onClick={() => { downloadText("staffsync-employees-template.csv", CSV_TEMPLATE); toast(t("templateDownloaded")); }} className="border-0 bg-transparent p-0 text-accent underline">
              {t("downloadTemplate")}
            </button>
            <span>·</span>
            <button onClick={() => { setFileName("employees-sample.csv"); setHeaders(CSV_HEADERS); setRows(SAMPLE_CSV); setMap(DEFAULT_MAP); }} className="border-0 bg-transparent p-0 text-accent underline">
              {t("useSample")}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="m-0 mb-3 text-[13px] text-text-2">{t("mapHint", { count: rows.length })}</p>
          <div className="overflow-hidden rounded-[10px] border border-border">
            {IMPORT_FIELDS.map((f, i) => {
              const value = map[f.key];
              const invalid = f.required && value === "";
              return (
                <div key={f.key} className={cn("grid grid-cols-[1fr_1.2fr_1fr] items-center gap-3 px-3.5 py-2.5", i > 0 && "border-t border-border")}>
                  <label htmlFor={`map-${f.key}`} className="text-[13px] font-medium">
                    {t(`fields.${f.key}`)}
                    {f.required && <span className="text-bad"> *</span>}
                  </label>
                  <select
                    id={`map-${f.key}`}
                    value={value === "" ? "" : String(value)}
                    onChange={(e) => setMap((m) => ({ ...m, [f.key as ImportField]: e.target.value === "" ? "" : Number(e.target.value) }))}
                    aria-invalid={invalid}
                    className={cn("h-9 rounded-lg border border-solid bg-surface px-2 text-[13px] text-text", invalid ? "border-bad-dot" : "border-border-strong")}
                  >
                    <option value="">{t("skip")}</option>
                    {headers.map((h, j) => (
                      <option key={j} value={j}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <span className="truncate text-[12px] text-text-3">{value === "" ? "" : t("example", { value: rows[0]?.[value] ?? "" })}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-3 text-[13px]">
            <span className="rounded-full bg-ok-bg px-2.5 py-1 font-semibold text-ok">{t("valid", { count: ok.length })}</span>
            <span className={cn("rounded-full px-2.5 py-1 font-semibold", bad ? "bg-bad-bg text-bad" : "bg-neutral-bg text-neutral")}>{t("withErrors", { count: bad })}</span>
          </div>
          <div className="max-h-[320px] overflow-auto rounded-[10px] border border-border">
            <table className="w-full border-collapse text-[12.5px]">
              <thead className="sticky top-0 bg-surface-2 text-left text-text-3">
                <tr>
                  {(["line", "name", "id", "phone", "site", "title"] as const).map((c) => (
                    <th key={c} className="px-3 py-2 font-medium">
                      {t(`columns.${c}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((p) => (
                  <tr key={p.line} className={cn("border-t border-border align-top", p.errors.length > 0 && "bg-bad-bg")}>
                    <td className="px-3 py-2 font-mono text-text-3">{p.line}</td>
                    <td className="px-3 py-2">{p.name || "—"}</td>
                    <td className="px-3 py-2 font-mono">{p.id || "—"}</td>
                    <td className="px-3 py-2">{p.phone || "—"}</td>
                    <td className="px-3 py-2">{p.site || "—"}</td>
                    <td className="px-3 py-2">
                      {p.title ? (JOB_TITLE_KEYS.includes(p.title) ? te(p.title) : p.title) : "—"}
                      {p.errors.length > 0 && (
                        <div className="mt-1 text-[11.5px] text-bad">{p.errors.map((e) => t(`errors.${e.key}`, { value: e.value ?? "" })).join(" · ")}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { n: imported, l: "imported", c: "text-ok" },
              { n: bad, l: "skipped", c: bad ? "text-bad" : "text-text-3" },
              { n: 0, l: "updated", c: "text-text-3" },
            ].map(({ n, l, c }) => (
              <div key={l} className="rounded-xl border border-border p-4 text-center">
                <div className={cn("text-[28px] font-semibold", c)}>{n}</div>
                <div className="text-[12.5px] text-text-3">{t(`result.${l}`)}</div>
              </div>
            ))}
          </div>
          {bad > 0 && (
            <button
              onClick={() => downloadText("skipped-rows.csv", toCsv([[t("columns.line"), t("result.error")], ...preview.filter((p) => p.errors.length).map((p) => [p.line, p.errors.map((e) => t(`errors.${e.key}`, { value: e.value ?? "" })).join(" · ")])]))}
              className="self-start border-0 bg-transparent p-0 text-[13px] text-accent underline"
            >
              {t("downloadErrors")}
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}

const JOB_TITLE_KEYS: string[] = ["machinist", "forkliftOperator", "cleaner", "technician", "electrician", "driver", "loader", "inspector", "siteManager"];
