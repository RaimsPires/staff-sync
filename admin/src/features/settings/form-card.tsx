"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/overlay";
import { Switch } from "@/components/ui/switch";
import { controlClass } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useSettings } from "@/store/settings";
import type { SettingsValues } from "@/types/settings";
import { EMAIL, type FieldSpec, type Group, type Option, type ScalarKey } from "./model";

type Editable = Exclude<FieldSpec, { kind: "tog" | "logo" }>;
const isEditable = (f: FieldSpec): f is Editable => f.kind !== "tog" && f.kind !== "logo";

/** Label of a select option: literal when given, otherwise translated. */
export function useOptionLabel() {
  const t = useTranslations("Settings.options");
  return (key: string, o: Option) => o.label ?? t(`${key}.${o.value}`);
}

function validate(f: Editable, raw: string, tr: (k: string, v?: Record<string, number>) => string): string {
  if (f.kind === "text") {
    if (f.required && !raw.trim()) return tr("required");
    if (f.mail && !EMAIL.test(raw)) return tr("email");
    if (f.url && !/^https?:\/\//.test(raw)) return tr("url");
  }
  if (f.kind === "num" && (raw === "" || Number.isNaN(+raw) || +raw < f.min || +raw > f.max)) return tr("range", { min: f.min, max: f.max });
  return "";
}

/** Dialog that edits a group of text, number, time and select settings together. */
export function EditFieldsModal({ title, fields, onClose }: { title: string; fields: Editable[]; onClose: () => void }) {
  const t = useTranslations("Settings");
  const tField = useTranslations("Settings.fields");
  const tUnit = useTranslations("Settings.units");
  const tErr = useTranslations("Settings.errors");
  const optionLabel = useOptionLabel();
  const toast = useToast();
  const { values, patch } = useSettings();
  const [draft, setDraft] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.key, String(values[f.key])])));
  const [tried, setTried] = useState(false);

  const errors = Object.fromEntries(fields.map((f) => [f.key, validate(f, draft[f.key], tErr)]));
  const save = () => {
    if (Object.values(errors).some(Boolean)) return setTried(true);
    const next: Partial<Record<ScalarKey, string | number>> = {};
    fields.forEach((f) => { next[f.key] = f.kind === "num" ? Number(draft[f.key]) : draft[f.key]; });
    patch(next as Partial<SettingsValues>);
    toast(t("saved"));
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={title} className="max-w-[460px]" footer={<><Button onClick={onClose}>{t("cancel")}</Button><Button variant="primary" onClick={save}>{t("save")}</Button></>}>
      <div className="flex flex-col gap-3.5">
        {fields.map((f) => {
          const err = tried ? errors[f.key] : "";
          const set = (v: string) => setDraft((d) => ({ ...d, [f.key]: v }));
          return (
            <label key={f.key} className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">
              {tField(`${f.key}.label`)}
              {f.kind === "sel" ? (
                <select value={draft[f.key]} onChange={(e) => set(e.target.value)} className={controlClass()}>{f.options.map((o) => <option key={o.value} value={o.value}>{optionLabel(f.key, o)}</option>)}</select>
              ) : f.kind === "num" ? (
                <span className="flex items-center gap-2"><input type="number" value={draft[f.key]} onChange={(e) => set(e.target.value)} aria-invalid={!!err} className={cn(controlClass(!!err), "w-[120px] font-mono")} /><span className="text-[12.5px] font-normal text-text-3">{tUnit(f.unit)}</span></span>
              ) : (
                <input type={f.kind === "time" ? "time" : "text"} value={draft[f.key]} onChange={(e) => set(e.target.value)} aria-invalid={!!err} className={controlClass(!!err)} />
              )}
              {err && <span className="text-[12px] font-normal text-bad">{err}</span>}
            </label>
          );
        })}
      </div>
    </Modal>
  );
}

/** One settings card: a read-only list of values with an Edit dialog, and switches that save instantly. */
export function FormCard({ group }: { group: Group }) {
  const t = useTranslations("Settings");
  const tGroup = useTranslations("Settings.groups");
  const tField = useTranslations("Settings.fields");
  const tUnit = useTranslations("Settings.units");
  const optionLabel = useOptionLabel();
  const toast = useToast();
  const { values, patch } = useSettings();
  const [editing, setEditing] = useState(false);
  const editable = group.fields.filter(isEditable);

  const show = (f: FieldSpec): string => {
    if (f.kind === "sel") { const o = f.options.find((x) => x.value === values[f.key]); return o ? optionLabel(f.key, o) : String(values[f.key]); }
    if (f.kind === "num") return `${values[f.key]} ${tUnit(f.unit)}`;
    if (f.kind === "tog" || f.kind === "logo") return "";
    return String(values[f.key] || "—");
  };

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-[18px] py-3.5">
        <div className="min-w-[180px] flex-1">
          <h2 className="m-0 text-[14.5px] font-semibold">{tGroup(`${group.id}.title`)}</h2>
          {tGroup.has(`${group.id}.sub`) && <p className="mt-0.5 text-[12.5px] text-text-3">{tGroup(`${group.id}.sub`)}</p>}
        </div>
        {editable.length > 0 && <Button size="sm" onClick={() => setEditing(true)}>{t("edit")}</Button>}
      </div>
      {group.fields.map((f, i) => (
        <div key={f.key} className={cn("grid grid-cols-[minmax(180px,1fr)_minmax(220px,1.2fr)] items-center gap-x-6 gap-y-2 px-[18px] py-[13px]", i > 0 && "border-t border-border")}>
          <div>
            <div className="text-[13.5px] font-medium">{tField(`${f.key}.label`)}</div>
            {tField.has(`${f.key}.hint`) && <div className="mt-px text-[12.5px] text-text-3">{tField(`${f.key}.hint`)}</div>}
          </div>
          <div className="flex items-start">
            {f.kind === "tog" ? (
              <Switch checked={Boolean(values[f.key])} label={tField(`${f.key}.label`)} onChange={(v) => { patch({ [f.key]: v } as Partial<SettingsValues>); toast(t("saved")); }} />
            ) : f.kind === "logo" ? (
              <div className="flex items-center gap-3">
                <div className="grid size-14 place-items-center rounded-xl bg-accent-soft text-[18px] font-bold text-accent">{(values.name || "?")[0]}</div>
                <label className="flex h-8 cursor-pointer items-center rounded-[9px] border border-solid border-border-strong bg-surface px-3 text-[13px] text-text">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.length) toast(t("logoUploaded")); }} />
                  {t("uploadLogo")}
                </label>
              </div>
            ) : (
              <span className="break-words text-[13.5px] text-text">{show(f)}</span>
            )}
          </div>
        </div>
      ))}
      {editing && <EditFieldsModal title={tGroup(`${group.id}.title`)} fields={editable} onClose={() => setEditing(false)} />}
    </section>
  );
}
