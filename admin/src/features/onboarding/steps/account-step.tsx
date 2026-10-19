"use client";

import { Check, Dot } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { controlClass, FieldShell, TextField } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import { MicrosoftMark } from "@/features/auth/provider-marks";
import { passwordScore } from "@/lib/password";
import { cn } from "@/lib/utils";
import { DIAL_CODES } from "../constants";
import { FormCard } from "../form-card";
import { useOnboarding } from "../store";
import { useStepErrors } from "../use-step-errors";

const BAR_TONE = ["bg-bad-dot", "bg-bad-dot", "bg-warn-dot", "bg-ok-dot", "bg-ok-dot"] as const;
const TEXT_TONE = ["", "text-bad", "text-bad", "text-warn", "text-ok"] as const;

export function AccountStep() {
  const t = useTranslations("Onboarding.account");
  const toast = useToast();
  const form = useOnboarding((s) => s.form);
  const set = useOnboarding((s) => s.set);
  const sso = useOnboarding((s) => s.sso);
  const { error } = useStepErrors(1);
  const [showPw, setShowPw] = useState(false);

  const score = passwordScore(form.password);
  const rules = [
    { key: "length", ok: form.password.length >= 8 },
    { key: "case", ok: /[a-z]/.test(form.password) && /[A-Z]/.test(form.password) },
    { key: "number", ok: /\d/.test(form.password) },
    { key: "symbol", ok: /[^A-Za-z0-9]/.test(form.password) },
  ] as const;

  const signUpWith = () => {
    sso();
    toast(t("ssoSignedIn"));
  };

  return (
    <FormCard>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5">
        <Button size="lg" onClick={signUpWith} className="gap-2.5 rounded-[10px] text-[14px]">
          <FcGoogle size={18} /> {t("google")}
        </Button>
        <Button size="lg" onClick={signUpWith} className="gap-2.5 rounded-[10px] text-[14px]">
          <MicrosoftMark /> {t("microsoft")}
        </Button>
      </div>

      <div className="flex items-center gap-3 text-[12px] text-text-3">
        <span className="h-px flex-1 bg-border" />
        {t("orEmail")}
        <span className="h-px flex-1 bg-border" />
      </div>

      <TextField label={t("fullName")} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Claire Vasseur" autoComplete="name" error={error("name")} />
      <TextField label={t("workEmail")} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="claire@batiplus.fr" autoComplete="email" error={error("email")} />

      <FieldShell label={t("password")} error={error("password")}>
        {({ id, invalid, describedBy }) => (
          <>
            <div className="relative flex">
              <input
                id={id}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                type={showPw ? "text" : "password"}
                placeholder={t("passwordPlaceholder")}
                autoComplete="new-password"
                aria-invalid={invalid}
                aria-describedby={describedBy}
                className={cn(controlClass(invalid), "flex-1 pr-16")}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-1.5 top-1.5 h-7 rounded-md border-0 bg-surface-2 px-[9px] text-[12px] font-medium text-text-2"
              >
                {showPw ? t("hide") : t("show")}
              </button>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="grid flex-1 grid-cols-4 gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <span key={i} className={cn("h-1 rounded", score >= i ? BAR_TONE[score] : "bg-neutral-bg")} />
                ))}
              </div>
              <span className={cn("min-w-[52px] text-right text-[12px] font-medium", TEXT_TONE[score])}>
                {form.password ? t(`strength.${score}`) : ""}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[12px]">
              {rules.map(({ key, ok }) => (
                <span key={key} className={cn("flex items-center gap-[5px]", ok ? "text-ok" : "text-text-3")}>
                  {ok ? <Check size={12} strokeWidth={3} /> : <Dot size={12} strokeWidth={6} />}
                  {t(`rules.${key}`)}
                </span>
              ))}
            </div>
          </>
        )}
      </FieldShell>

      <FieldShell label={t("phone")} hint={t("phoneHint")} error={error("phone")}>
        {({ id, invalid, describedBy }) => (
          <div className="flex gap-2">
            <select
              aria-label={t("dialCode")}
              value={form.dial}
              onChange={(e) => set("dial", e.target.value)}
              className={cn(controlClass(), "w-auto px-2")}
            >
              {DIAL_CODES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <input
              id={id}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              type="tel"
              placeholder="6 12 34 56 78"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={cn(controlClass(invalid), "flex-1")}
            />
          </div>
        )}
      </FieldShell>

      <div className="flex flex-col gap-1.5">
        <label className="flex cursor-pointer items-start gap-2.5 text-[13.5px] text-text-2">
          <input type="checkbox" checked={form.terms} onChange={(e) => set("terms", e.target.checked)} className="mt-0.5 size-4 accent-accent" />
          <span>
            {t("agree")} <a href="#">{t("termsLink")}</a> {t("and")} <a href="#">{t("privacyLink")}</a>
            {t("agreeTail")}
          </span>
        </label>
        {error("terms") && <span className="pl-[26px] text-[12.5px] text-bad">{error("terms")}</span>}
      </div>

      <p className="m-0 text-center text-[13px] text-text-3">
        {t("haveAccount")} <Link href="/sign-in">{t("signIn")}</Link>
      </p>
    </FormCard>
  );
}
