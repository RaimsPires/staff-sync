"use client";

import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { isPasswordAcceptable, passwordScore } from "@/lib/password";
import { resetPassword } from "@/services/auth";
import { cn } from "@/lib/utils";

const field = (bad: boolean) =>
  cn("h-10 w-full rounded-[9px] border border-solid bg-surface px-3 text-[14px] text-text outline-none focus:border-accent", bad ? "border-bad-dot" : "border-border-strong");

/** The page the "reset your password" email links to: `/reset-password?token=…`. */
export function ResetPasswordForm() {
  const t = useTranslations("Auth.reset");
  const router = useRouter();
  const toast = useToast();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [tried, setTried] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invalid, setInvalid] = useState(!token);

  const score = passwordScore(password);
  const passwordError = tried && !isPasswordAcceptable(password) ? t("weak") : "";
  const confirmError = tried && password !== confirm ? t("mismatch") : "";

  const submit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    if (!isPasswordAcceptable(password) || password !== confirm) return setTried(true);
    setLoading(true);
    try {
      if ((await resetPassword(token, password)) === "invalid") return setInvalid(true);
      toast(t("done"));
      router.push("/sign-in");
    } catch {
      toast(t("failed"), "bad");
    } finally {
      setLoading(false);
    }
  };

  if (invalid) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-8 py-9 text-center shadow-card">
        <h1 className="m-0 text-[22px] font-semibold tracking-tight">{t("invalidTitle")}</h1>
        <p className="m-0 max-w-[380px] text-text-2">{t("invalidBody")}</p>
        <button onClick={() => router.push("/sign-in")} className="mt-2 h-10 rounded-[10px] border-0 bg-accent px-4 text-[13.5px] font-medium text-white">{t("backToSignIn")}</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-7 shadow-card">
      <div className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent"><KeyRound size={22} /></div>
      <div>
        <h1 className="m-0 text-[22px] font-semibold tracking-tight">{t("title")}</h1>
        <p className="mb-0 mt-1 text-[13.5px] text-text-2">{t("subtitle")}</p>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium">{t("password")}</span>
        <div className="relative flex">
          <input value={password} onChange={(e) => setPassword(e.target.value)} type={show ? "text" : "password"} autoComplete="new-password" disabled={loading} aria-invalid={!!passwordError} className={cn(field(!!passwordError), "min-w-0 flex-1 pr-11")} />
          <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? t("hide") : t("show")} className="absolute right-[5px] top-[5px] grid size-[30px] place-items-center rounded-[7px] border-0 bg-transparent text-text-3">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
        </div>
        <div className="grid grid-cols-4 gap-1">{[1, 2, 3, 4].map((i) => <span key={i} className={cn("h-1 rounded", score >= i ? (score >= 3 ? "bg-ok-dot" : score === 2 ? "bg-warn-dot" : "bg-bad-dot") : "bg-neutral-bg")} />)}</div>
        {passwordError && <span className="text-[12.5px] text-bad">{passwordError}</span>}
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium">{t("confirm")}</span>
        <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type={show ? "text" : "password"} autoComplete="new-password" disabled={loading} aria-invalid={!!confirmError} className={field(!!confirmError)} />
        {confirmError && <span className="text-[12.5px] text-bad">{confirmError}</span>}
      </label>
      <button type="submit" disabled={loading} className="mt-1 flex h-11 items-center justify-center gap-2.5 rounded-[10px] border-0 bg-accent text-[14.5px] font-semibold text-white disabled:opacity-80">
        {loading && <span className="box-border size-4 animate-spin-fast rounded-full border-2 border-solid border-white/35 border-t-white" />}
        {t("submit")}
      </button>
    </form>
  );
}
