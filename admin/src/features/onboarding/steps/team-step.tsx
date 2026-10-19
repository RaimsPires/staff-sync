"use client";

import { FileSpreadsheet, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { downloadText } from "@/lib/export";
import { cn } from "@/lib/utils";
import { useOnboarding } from "../store";
import type { CsvRow, Person, TeamRole } from "../types";
import { useStepErrors } from "../use-step-errors";

const ROLES: TeamRole[] = ["employee", "site", "branch", "admin"];
const CSV_TEMPLATE =
  "name,phone_or_email,role,site\nCamille Durand,+33612345678,employee,Part-Dieu Tower\nYanis Benali,yanis@batiplus.fr,site_manager,Part-Dieu Tower\n";
const GRID = "grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)_160px_36px] gap-2.5";
const cell =
  "h-[38px] min-w-0 rounded-[9px] border border-solid bg-surface px-2.5 text-[13.5px] text-text outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)]";

export function TeamStep() {
  const t = useTranslations("Onboarding.team");
  const form = useOnboarding((s) => s.form);
  const set = useOnboarding((s) => s.set);
  const { raw, error } = useStepErrors(7);

  const updatePerson = (index: number, patch: Partial<Person>) =>
    set("people", form.people.map((p, i) => (i === index ? { ...p, ...patch } : p)));

  const removePerson = (index: number) =>
    set("people", form.people.length > 1 ? form.people.filter((_, i) => i !== index) : [{ name: "", contact: "", role: "employee" }]);

  const onCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const lines = String(reader.result).trim().split(/\r?\n/).slice(1).filter(Boolean);
      const rows: CsvRow[] = lines.slice(0, 4).map((line) => {
        const [a = "", b = "", c = ""] = line.split(",");
        return { a, b, c };
      });
      set("csvName", file.name);
      set("csvCount", lines.length);
      set("csvRows", rows);
    };
    reader.readAsText(file);
  };

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-surface shadow-card">
      <div role="tablist" className="flex gap-5 border-b border-border px-6">
        {(["manual", "csv"] as const).map((mode) => (
          <button
            key={mode}
            role="tab"
            aria-selected={form.mode === mode}
            onClick={() => set("mode", mode)}
            className={cn(
              "-mb-px border-0 border-b-2 border-solid bg-transparent pb-3 pt-3.5 text-[13.5px] font-medium",
              form.mode === mode ? "border-b-accent text-text" : "border-b-transparent text-text-3",
            )}
          >
            {t(mode === "manual" ? "addManually" : "uploadCsv")}
          </button>
        ))}
      </div>

      {form.mode === "manual" ? (
        <div className="flex flex-col gap-2.5 px-6 py-5">
          <div className={cn(GRID, "text-[12px] font-medium text-text-3")}>
            <span>{t("fullName")}</span>
            <span>{t("contact")}</span>
            <span>{t("role")}</span>
            <span />
          </div>
          {form.people.map((p, i) => {
            const message = error(`p${i}`);
            const field = raw[`p${i}:field`];
            return (
              <div key={i} className="flex flex-col gap-1">
                <div className={GRID}>
                  <input
                    value={p.name}
                    onChange={(e) => updatePerson(i, { name: e.target.value })}
                    placeholder={t("namePlaceholder")}
                    aria-label={t("fullName")}
                    aria-invalid={field === "name"}
                    className={cn(cell, field === "name" ? "border-bad-dot" : "border-border-strong")}
                  />
                  <input
                    value={p.contact}
                    onChange={(e) => updatePerson(i, { contact: e.target.value })}
                    placeholder={t("contactPlaceholder")}
                    aria-label={t("contact")}
                    aria-invalid={field === "contact"}
                    className={cn(cell, field === "contact" ? "border-bad-dot" : "border-border-strong")}
                  />
                  <select
                    value={p.role}
                    onChange={(e) => updatePerson(i, { role: e.target.value as TeamRole })}
                    aria-label={t("role")}
                    className={cn(cell, "border-border-strong px-2")}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {t(`roles.${r}`)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removePerson(i)}
                    title={t("remove")}
                    aria-label={t("remove")}
                    className="grid h-[38px] w-9 place-items-center rounded-[9px] border border-solid border-border bg-transparent text-text-3 hover:bg-bad-bg hover:text-bad"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                {message && <span className="text-[12.5px] text-bad">{message}</span>}
              </div>
            );
          })}
          <button
            onClick={() => set("people", [...form.people, { name: "", contact: "", role: "employee" }])}
            className="flex h-[34px] items-center gap-1.5 self-start rounded-[9px] border border-dashed border-border-strong bg-transparent px-3 text-[13px] font-medium text-accent"
          >
            <Plus size={14} /> {t("addAnother")}
          </button>
          <p className="mb-0 mt-1.5 text-[12.5px] text-text-3 text-pretty">{t("note")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5 px-6 py-5">
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-[1.5px] border-dashed bg-surface-2 px-5 py-8 text-center hover:border-accent",
              form.csvName ? "border-ok-dot" : "border-border-strong",
            )}
          >
            <input type="file" accept=".csv,text/csv" onChange={onCsv} className="hidden" />
            <div className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent">
              <FileSpreadsheet size={22} />
            </div>
            <div className="font-semibold">{form.csvName ? t("csvFound", { name: form.csvName, count: form.csvCount }) : t("csvDrop")}</div>
            <div className="text-[12.5px] text-text-3">{form.csvName ? t("csvReplace") : t("csvLimit")}</div>
          </label>

          {form.csvRows.length > 0 && (
            <div className="overflow-hidden rounded-[10px] border border-border text-[13px]">
              {form.csvRows.map((r, i) => (
                <div key={i} className="grid grid-cols-[1fr_1.3fr_0.8fr] gap-2.5 border-b border-border px-3 py-2 last:border-b-0">
                  <span>{r.a}</span>
                  <span className="text-text-2">{r.b}</span>
                  <span className="text-text-2">{r.c}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2.5 text-[13px] text-text-2">
            {t("columns")}{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                downloadText("staffsync-team-template.csv", CSV_TEMPLATE);
              }}
            >
              {t("downloadTemplate")}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
