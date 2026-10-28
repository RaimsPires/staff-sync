"use client";

import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { verifyMfa } from "@/services/auth";
import { cn } from "@/lib/utils";

/** Second step of sign-in for people with two-factor turned on. */
export function MfaStep({ onBack, onChange }: { onBack: () => void; onChange: () => void }) {
  const t = useTranslations("Auth.mfa");
  const router = useRouter();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [trust, setTrust] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    if (code.trim().length < 6) return setError(t("short"));
    setLoading(true);
    try {
      const result = await verifyMfa(code.trim(), trust);
      if (result === "change") return onChange();
      if (result === "ok") return router.push("/workspaces");
      setError(result === "wrong" ? t("wrong") : t("expired"));
      if (result === "expired") setTimeout(onBack, 1500);
    } catch {
      toast(t("failed"), "bad");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent"><ShieldCheck size={22} /></div>
      <div>
        <h1 className="m-0 text-[26px] font-semibold tracking-tight">{t("title")}</h1>
        <p className="mb-0 mt-1.5 text-text-2">{t("subtitle")}</p>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium">{t("code")}</span>
        <input value={code} onChange={(e) => { setCode(e.target.value.replace(/\s/g, "")); setError(""); }} inputMode="text" autoComplete="one-time-code" autoFocus maxLength={12} placeholder="000000" aria-invalid={!!error}
          className={cn("h-11 w-full rounded-[9px] border border-solid bg-surface px-3 font-mono text-[18px] tracking-[.25em] text-text outline-none focus:border-accent", error ? "border-bad-dot" : "border-border-strong")} />
        {error && <span className="text-[12.5px] text-bad">{error}</span>}
      </label>
      <label className="flex cursor-pointer items-center gap-[9px] self-start text-[13.5px] text-text-2">
        <input type="checkbox" checked={trust} onChange={(e) => setTrust(e.target.checked)} className="m-0 size-4 accent-accent" />
        {t("trust")}
      </label>
      <button type="submit" disabled={loading} className="flex h-11 items-center justify-center gap-2.5 rounded-[10px] border-0 bg-accent text-[14.5px] font-semibold text-white hover:brightness-105 disabled:opacity-70">
        {loading && <span className="box-border size-4 animate-spin-fast rounded-full border-2 border-solid border-white/35 border-t-white" />}
        {t("verify")}
      </button>
      <button type="button" onClick={onBack} className="self-center border-0 bg-transparent text-[13px] text-text-2 underline">{t("back")}</button>
    </form>
  );
}
