"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/overlay";
import { controlClass } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import { TIMEZONES } from "@/data/settings";
import { setLocale } from "@/i18n/actions";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { saveDetails } from "@/services/profile";
import { useProfile } from "@/store/profile";
import { useAccess } from "@/store/use-access";
import { useScopeText } from "@/features/users/model";

const card = "overflow-hidden rounded-xl border border-border bg-surface shadow-card";
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function useProfileIdentity() {
  const { me } = useAccess();
  const details = useProfile((s) => s.details);
  return { ...details, name: details.name ?? me.name, email: details.email ?? me.email };
}

function EditDetails({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Profile.edit");
  const tc = useTranslations("Profile");
  const toast = useToast();
  const router = useRouter();
  const locale = useLocale();
  const [, startTransition] = useTransition();
  const setDetails = useProfile((s) => s.setDetails);
  const current = useProfileIdentity();
  const [d, setD] = useState({ name: current.name, email: current.email, phone: current.phone, lang: current.lang, tz: current.tz });
  const [tried, setTried] = useState(false);
  const errors = { name: d.name.trim() ? "" : t("required"), email: EMAIL.test(d.email) ? "" : t("emailInvalid") };
  const set = (p: Partial<typeof d>) => setD((x) => ({ ...x, ...p }));

  const save = async () => {
    if (errors.name || errors.email) return setTried(true);
    try {
      await saveDetails({ name: d.name.trim(), lang: d.lang as "en" | "fr" });
    } catch (e) {
      return toast(e instanceof Error ? e.message : tc("saveFailed"), "bad");
    }
    setDetails({ ...d, name: d.name.trim() });
    toast(tc("saved"));
    onClose();
    if (d.lang !== locale) startTransition(async () => { await setLocale(d.lang as Locale); router.refresh(); });
  };
  const field = (label: string, key: "name" | "email" | "phone") => (
    <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">
      {label}
      <input value={d[key]} onChange={(e) => set({ [key]: e.target.value })} aria-invalid={tried && key in errors && !!errors[key as keyof typeof errors]} className={controlClass(tried && key in errors && !!errors[key as keyof typeof errors])} />
      {tried && key in errors && errors[key as keyof typeof errors] && <span className="text-[12px] font-normal text-bad">{errors[key as keyof typeof errors]}</span>}
    </label>
  );
  return (
    <Modal open onClose={onClose} title={t("title")} className="max-w-[460px]" footer={<><Button onClick={onClose}>{tc("cancel")}</Button><Button variant="primary" onClick={save}>{tc("save")}</Button></>}>
      <div className="flex flex-col gap-3.5">
        {field(t("name"), "name")}{field(t("email"), "email")}{field(t("phone"), "phone")}
        <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">{t("language")}<select value={d.lang} onChange={(e) => set({ lang: e.target.value as "en" | "fr" })} className={controlClass()}><option value="en">English</option><option value="fr">Français</option></select></label>
        <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">{t("timezone")}<select value={d.tz} onChange={(e) => set({ tz: e.target.value })} className={controlClass()}>{TIMEZONES.map((z) => <option key={z.value} value={z.value}>{z.label}</option>)}</select></label>
      </div>
    </Modal>
  );
}

export function PersonalTab() {
  const t = useTranslations("Profile");
  const tRoles = useTranslations("Users.defaultRoles");
  const { role, scope, perms } = useAccess();
  const scopeText = useScopeText();
  const who = useProfileIdentity();
  const [editing, setEditing] = useState(false);
  const canSettings = perms.admin || perms.settings;
  const rows: [string, string][] = [[t("details.name"), who.name], [t("details.email"), who.email], [t("details.phone"), who.phone || "—"], [t("details.language"), who.lang === "fr" ? "Français" : "English"], [t("details.timezone"), TIMEZONES.find((z) => z.value === who.tz)?.label ?? who.tz]];
  const access: [string, string, string][] = [
    [t("access.role"), tRoles(`${role}.name`), "text-text"],
    [t("access.scope"), scopeText.label({ kind: scope.kind, ids: scope.id ? [scope.id] : [] }), "text-text"],
    [t("access.settings"), canSettings ? t("access.allowed") : t("access.noAccess"), canSettings ? "text-ok" : "text-text-3"],
  ];
  return (
    <>
      <section className={card}>
        <div className="flex items-center gap-3 border-b border-border px-[18px] py-3.5"><h2 className="m-0 flex-1 text-[14.5px] font-semibold">{t("details.title")}</h2><Button size="sm" onClick={() => setEditing(true)}>{t("details.edit")}</Button></div>
        {rows.map(([k, v], i) => <div key={k} className={cn("grid grid-cols-[minmax(160px,1fr)_minmax(200px,1.4fr)] gap-x-6 px-[18px] py-[13px]", i > 0 && "border-t border-border")}><div className="text-[13.5px] font-medium">{k}</div><div className="break-words text-[13.5px]">{v}</div></div>)}
      </section>
      <section className={card}>
        <div className="border-b border-border px-[18px] py-3.5"><h2 className="m-0 text-[14.5px] font-semibold">{t("access.title")}</h2></div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 px-[18px] py-4">
          {access.map(([k, v, tone]) => <div key={k}><div className="text-[12px] text-text-3">{k}</div><div className={cn("mt-0.5 text-[14px] font-semibold", tone)}>{v}</div></div>)}
        </div>
        <div className={cn("flex flex-wrap items-center gap-3 px-[18px] py-3 text-[12.5px]", canSettings ? "bg-surface-2 text-text-2" : "bg-warn-bg text-warn")}>
          <span className="min-w-[220px] flex-1">{canSettings ? t("access.settingsNote") : t("access.noSettingsNote")}</span>
          {canSettings && <Link href="/settings" className="inline-flex h-[30px] items-center rounded-lg border border-solid border-border-strong bg-surface px-2.5 text-[12.5px] font-medium text-text no-underline">{t("access.openSettings")}</Link>}
        </div>
      </section>
      {editing && <EditDetails onClose={() => setEditing(false)} />}
    </>
  );
}
