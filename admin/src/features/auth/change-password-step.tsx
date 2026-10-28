"use client";

import { KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { chooseNewPassword } from "@/services/auth";
import { cn } from "@/lib/utils";

const MIN_LENGTH = 10;

/** Shown right after signing in with a temporary password: the person must choose their own before anything else. */
export function ChangePasswordStep() {
  const t = useTranslations("Auth.changePassword");
  const router = useRouter();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    if (password.length < MIN_LENGTH) return setError(t("tooShort", { n: MIN_LENGTH }));
    if (password !== confirm) return setError(t("mismatch"));
    setLoading(true);
    try {
      const result = await chooseNewPassword(password);
      if (result === "same") return setError(t("same"));
      toast(t("saved"));
      router.push("/workspaces");
    } catch {
      toast(t("failed"), "bad");
    } finally {
      setLoading(false);
    }
  };

  const field = (value: string, set: (v: string) => void, label: string, autoFocus = false) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium">{label}</span>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => { set(e.target.value); setError(""); }}
        autoComplete="new-password"
        autoFocus={autoFocus}
        aria-invalid={!!error}
        className={cn("h-11 w-full rounded-[9px] border border-solid bg-surface px-3 text-[15px] text-text outline-none focus:border-accent", error ? "border-bad-dot" : "border-border-strong")}
      />
    </label>
  );

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent"><KeyRound size={22} /></div>
      <div>
        <h1 className="m-0 text-[26px] font-semibold tracking-tight">{t("title")}</h1>
        <p className="mb-0 mt-1.5 text-text-2">{t("subtitle", { n: MIN_LENGTH })}</p>
      </div>
      {field(password, setPassword, t("newPassword"), true)}
      {field(confirm, setConfirm, t("confirm"))}
      <label className="flex cursor-pointer items-center gap-[9px] self-start text-[13.5px] text-text-2">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="m-0 size-4 accent-accent" />
        {t("show")}
      </label>
      {error && <span role="alert" className="-mt-2 text-[12.5px] text-bad">{error}</span>}
      <button type="submit" disabled={loading} className="flex h-11 items-center justify-center gap-2.5 rounded-[10px] border-0 bg-accent text-[14.5px] font-semibold text-white hover:brightness-105 disabled:opacity-70">
        {loading && <span className="box-border size-4 animate-spin-fast rounded-full border-2 border-solid border-white/35 border-t-white" />}
        {t("save")}
      </button>
    </form>
  );
}
