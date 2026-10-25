"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal, KeepMounted } from "@/components/ui/overlay";
import { Switch } from "@/components/ui/switch";
import { controlClass } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import { WEBHOOK_EVENTS } from "@/data/settings";
import { cn } from "@/lib/utils";
import { useSettings } from "@/store/settings";
import { useSyncError } from "@/store/sync-error";
import type { ApiKey, Webhook } from "@/types/settings";
import { EditFieldsModal, useOptionLabel } from "./form-card";
import { SSO_OPTIONS, type FieldSpec } from "./model";

const header = "flex flex-wrap items-center gap-3 border-b border-border px-[18px] py-3.5";
const card = "overflow-hidden rounded-xl border border-border bg-surface shadow-card";
const row = "flex flex-wrap items-center gap-3.5 border-t border-border px-[18px] py-3 first:border-t-0";

function SecretBox({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[10px] border border-border bg-surface-2 px-3 py-2.5"><div className="mb-1 text-[12px] text-text-3">{label}</div><div className="break-all font-mono text-[13px]">{value}</div></div>;
}

function KeyModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Settings.keys");
  const tc = useTranslations("Settings");
  const createKey = useSettings((s) => s.createKey);
  const [name, setName] = useState("");
  const [tried, setTried] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const bad = !name.trim();
  return (
    <Modal open onClose={onClose} title={t(secret ? "createdTitle" : "createTitle")} className="max-w-[460px]"
      footer={secret ? <Button variant="primary" onClick={onClose}>{t("done")}</Button> : <><Button onClick={onClose}>{tc("cancel")}</Button><Button variant="primary" onClick={() => (bad ? setTried(true) : void createKey(name.trim()).then(setSecret, (e: unknown) => useSyncError.getState().report(e instanceof Error ? e.message : t("failed"))))}>{t("create")}</Button></>}>
      {secret ? (
        <div className="flex flex-col gap-3"><div className="rounded-[10px] bg-warn-bg px-3 py-2.5 text-[13px] text-warn">{t("copyNow")}</div><SecretBox label={t("secret")} value={secret} /></div>
      ) : (
        <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">{t("name")}<input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} aria-invalid={tried && bad} autoFocus className={controlClass(tried && bad)} />{tried && bad && <span className="text-[12px] font-normal text-bad">{t("nameError")}</span>}</label>
      )}
    </Modal>
  );
}

function HookModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Settings.hooks");
  const tEvent = useTranslations("Settings.hooks.events");
  const tc = useTranslations("Settings");
  const addHook = useSettings((s) => s.addHook);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["checkinFlagged"]);
  const [tried, setTried] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const badUrl = !/^https:\/\/.+\..+/.test(url);
  const badEvents = events.length === 0;
  return (
    <Modal open onClose={onClose} title={t(secret ? "createdTitle" : "addTitle")} className="max-w-[460px]"
      footer={secret ? <Button variant="primary" onClick={onClose}>{t("done")}</Button> : <><Button onClick={onClose}>{tc("cancel")}</Button><Button variant="primary" onClick={() => (badUrl || badEvents ? setTried(true) : void addHook(url.trim(), events).then(setSecret, (e: unknown) => useSyncError.getState().report(e instanceof Error ? e.message : t("failed"))))}>{t("add")}</Button></>}>
      {secret ? (
        <div className="flex flex-col gap-3"><div className="rounded-[10px] bg-warn-bg px-3 py-2.5 text-[13px] text-warn">{t("copyNow")}</div><SecretBox label={t("secret")} value={secret} /></div>
      ) : (
        <div className="flex flex-col gap-3.5">
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">{t("url")}<input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/hooks" aria-invalid={tried && badUrl} autoFocus className={controlClass(tried && badUrl)} />{tried && badUrl && <span className="text-[12px] font-normal text-bad">{t("urlError")}</span>}</label>
          <div className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">
            {t("eventsLabel")}
            <div className="flex flex-wrap gap-1.5">
              {WEBHOOK_EVENTS.map((e) => {
                const on = events.includes(e);
                return <button key={e} type="button" aria-pressed={on} onClick={() => setEvents(on ? events.filter((x) => x !== e) : [...events, e])} className={cn("flex h-[30px] items-center gap-1.5 rounded-full border-[1.5px] border-solid px-[11px] text-[12.5px] font-medium text-text", on ? "border-accent bg-accent-soft" : "border-border bg-surface")}><span className={cn("size-[9px] rounded-full", on ? "bg-accent" : "bg-border-strong")} />{tEvent(e)}</button>;
              })}
            </div>
            {tried && badEvents && <span className="text-[12px] font-normal text-bad">{t("eventsError")}</span>}
          </div>
        </div>
      )}
    </Modal>
  );
}

function ApiKeys() {
  const t = useTranslations("Settings.keys");
  const toast = useToast();
  const { keys, revokeKey } = useSettings();
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<ApiKey | null>(null);
  return (
    <section className={card}>
      <div className={header}><div className="min-w-[180px] flex-1"><h2 className="m-0 text-[14.5px] font-semibold">{t("title")}</h2><p className="mt-0.5 text-[12.5px] text-text-3">{t("sub")}</p></div><Button variant="primary" size="sm" onClick={() => setCreating(true)}>{t("create")}</Button></div>
      {keys.map((k) => (
        <div key={k.id} className={row}>
          <div className="min-w-[160px] flex-1"><div className="text-[13.5px] font-medium">{k.name}</div><div className="font-mono text-[12px] text-text-3">{k.prefix}</div></div>
          <div className="text-[12.5px] text-text-3">{t(k.created === "now" ? "createdNow" : "createdSeed")}</div>
          <Button size="sm" className="text-bad" onClick={() => setRevoking(k)}>{t("revoke")}</Button>
        </div>
      ))}
      {keys.length === 0 && <div className="px-[18px] py-6 text-[13px] text-text-3">{t("empty")}</div>}
      <KeepMounted show={!!creating}>{creating && <KeyModal onClose={() => setCreating(false)} />}</KeepMounted>
      <ConfirmDialog open={revoking !== null} danger title={t("revokeTitle", { name: revoking?.name ?? "" })} message={t("revokeMessage")} cancelLabel={t("cancel")} okLabel={t("revokeConfirm")} onCancel={() => setRevoking(null)} onOk={() => { if (revoking) { revokeKey(revoking.id); toast(t("revoked")); } setRevoking(null); }} />
    </section>
  );
}

function Webhooks() {
  const t = useTranslations("Settings.hooks");
  const tEvent = useTranslations("Settings.hooks.events");
  const toast = useToast();
  const { hooks, toggleHook, deleteHook } = useSettings();
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Webhook | null>(null);
  return (
    <section className={card}>
      <div className={header}><div className="min-w-[180px] flex-1"><h2 className="m-0 text-[14.5px] font-semibold">{t("title")}</h2><p className="mt-0.5 text-[12.5px] text-text-3">{t("sub")}</p></div><Button variant="primary" size="sm" onClick={() => setAdding(true)}>{t("add")}</Button></div>
      {hooks.map((h) => (
        <div key={h.id} className={row}>
          <div className="min-w-[200px] flex-1"><div className="break-all font-mono text-[13px]">{h.url}</div><div className="mt-0.5 text-[12.5px] text-text-3">{h.events.length ? h.events.map((e) => tEvent(e)).join(", ") : t("noEvents")}</div></div>
          <Switch checked={h.on} label={t("enabled", { url: h.url })} onChange={() => toggleHook(h.id)} />
          <Button size="sm" className="text-bad" onClick={() => setDeleting(h)}>{t("delete")}</Button>
        </div>
      ))}
      {hooks.length === 0 && <div className="px-[18px] py-6 text-[13px] text-text-3">{t("empty")}</div>}
      <KeepMounted show={!!adding}>{adding && <HookModal onClose={() => setAdding(false)} />}</KeepMounted>
      <ConfirmDialog open={deleting !== null} danger title={t("deleteTitle")} message={deleting?.url ?? ""} cancelLabel={t("cancel")} okLabel={t("delete")} onCancel={() => setDeleting(null)} onOk={() => { if (deleting) { deleteHook(deleting.id); toast(t("deleted")); } setDeleting(null); }} />
    </section>
  );
}

function Sso() {
  const t = useTranslations("Settings.sso");
  const tField = useTranslations("Settings.fields");
  const toast = useToast();
  const optionLabel = useOptionLabel();
  const { values, patch } = useSettings();
  const [editing, setEditing] = useState(false);
  const on = values.sso !== "none";
  const fields: FieldSpec[] = [
    { key: "sso", kind: "sel", options: SSO_OPTIONS },
    ...(on ? [{ key: "ssoDom", kind: "text", required: true } as FieldSpec] : []),
    ...(values.sso === "saml" ? [{ key: "ssoUrl", kind: "text", required: true, url: true } as FieldSpec] : []),
  ];
  const label = (key: string) => tField(`${key}.label`);
  const test = () => {
    if (!values.ssoDom.trim() || (values.sso === "saml" && !/^https?:\/\//.test(values.ssoUrl))) return setEditing(true);
    toast(t("connected", { provider: optionLabel("sso", { value: values.sso }) }));
  };
  const rows: [string, string][] = [[label("sso"), optionLabel("sso", { value: values.sso })], ...(on ? [[label("ssoDom"), values.ssoDom || "—"] as [string, string]] : []), ...(values.sso === "saml" ? [[label("ssoUrl"), values.ssoUrl || "—"] as [string, string]] : [])];
  return (
    <section className={card}>
      <div className={header}><div className="min-w-[180px] flex-1"><h2 className="m-0 text-[14.5px] font-semibold">{t("title")}</h2><p className="mt-0.5 text-[12.5px] text-text-3">{t("sub")}</p></div><Button size="sm" onClick={() => setEditing(true)}>{t("edit")}</Button></div>
      {rows.map(([k, v]) => <div key={k} className="grid grid-cols-[minmax(180px,1fr)_minmax(220px,1.2fr)] gap-x-6 border-t border-border px-[18px] py-[13px] first:border-t-0"><div className="text-[13.5px] font-medium">{k}</div><div className="break-words text-[13.5px]">{v}</div></div>)}
      {on && (
        <div className="flex items-center justify-between gap-3 border-t border-border px-[18px] py-[13px]">
          <div><div className="text-[13.5px] font-medium">{label("ssoForce")}</div><div className="text-[12.5px] text-text-3">{tField("ssoForce.hint")}</div></div>
          <Switch checked={values.ssoForce} label={label("ssoForce")} onChange={(v) => patch({ ssoForce: v })} />
        </div>
      )}
      {on && <div className="border-t border-border px-[18px] py-3"><Button variant="primary" onClick={test}>{t("test")}</Button></div>}
      <KeepMounted show={!!editing}>{editing && <EditFieldsModal title={t("title")} fields={fields.filter((f): f is Exclude<FieldSpec, { kind: "tog" | "logo" }> => f.kind !== "tog" && f.kind !== "logo")} onClose={() => setEditing(false)} />}</KeepMounted>
    </section>
  );
}

export function IntegrationsSection() {
  return <><ApiKeys /><Webhooks /><Sso /></>;
}
