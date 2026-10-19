"use client";

import { CircleAlert, Eye, EyeOff, Lock, UserX, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { authenticate } from "@/services/auth";
import { useOnline } from "@/lib/use-online";
import { cn } from "@/lib/utils";
import { MicrosoftMark } from "./provider-marks";
import { LOCK_MS, MAX_ATTEMPTS, useLockout } from "./use-lockout";
import { markSignedIn } from "@/lib/auth-cookie";

export type PreviewState = "default" | "loading" | "wrong" | "locked" | "deactivated" | "offline";
type Outcome = "wrong" | "deactivated" | "locked" | null;

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PREVIEW_EMAIL = "claire@batiplus.fr";

const inputClass = (bad: boolean) =>
  cn(
    "h-[42px] w-full rounded-[9px] border border-solid bg-surface px-3 text-[14px] text-text outline-none focus:border-accent disabled:bg-surface-2",
    bad ? "border-bad-dot" : "border-border-strong",
  );

export function SignInForm({ previewState = "default" }: { previewState?: PreviewState }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const toast = useToast();
  const online = useOnline() && previewState !== "offline";
  const lockout = useLockout(
    previewState === "locked"
      ? { attempts: MAX_ATTEMPTS, lockedFor: LOCK_MS - 92_000 }
      : previewState === "wrong"
        ? { attempts: 3 }
        : undefined,
  );

  const [email, setEmail] = useState(
    previewState === "deactivated" ? "former.lucas@batiplus.fr" : previewState === "default" || previewState === "offline" ? "" : PREVIEW_EMAIL,
  );
  const [password, setPassword] = useState(previewState === "loading" ? "staffsync" : "");
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(previewState === "loading");
  const [tried, setTried] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(
    previewState === "wrong" || previewState === "deactivated" || previewState === "locked" ? previewState : null,
  );
  const redirectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const locked = lockout.locked;
  const blocked = loading || locked || !online;
  const showWrong = outcome === "wrong";
  const showLocked = locked;
  const showDeactivated = outcome === "deactivated";

  const emailError = !tried ? "" : !email.trim() ? t("errors.emailRequired") : !EMAIL_RE.test(email.trim()) ? t("errors.emailInvalid") : "";
  const passwordError = tried && !password ? t("errors.passwordRequired") : "";

  const mm = String(Math.floor(lockout.remaining / 60_000)).padStart(2, "0");
  const ss = String(Math.floor(lockout.remaining / 1000) % 60).padStart(2, "0");

  const submit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (blocked) return;
    const address = email.trim();
    if (!address || !EMAIL_RE.test(address) || !password) {
      setTried(true);
      setOutcome(null);
      return;
    }
    setTried(false);
    setLoading(true);
    setOutcome(null);
    const result = await authenticate(address, password);
    setLoading(false);
    if (result === "ok") {
      lockout.reset();
      toast(t("toasts.signedIn"));
      markSignedIn();
      redirectTimer.current = setTimeout(() => router.push("/workspaces"), 900);
      return;
    }
    setPassword("");
    if (result === "deactivated") {
      setOutcome("deactivated");
      return;
    }
    setOutcome(lockout.fail() ? "locked" : "wrong");
  };

  const sso = (provider: string) => {
    if (blocked) return;
    setLoading(true);
    setOutcome(null);
    setTimeout(() => {
      setLoading(false);
      toast(t("toasts.redirecting", { provider }), "info");
    }, 900);
  };

  const forgot = (e: React.MouseEvent) => {
    e.preventDefault();
    toast(t("toasts.resetSent", { email: email || t("toasts.yourEmail") }));
  };

  const buttonLabel = loading ? t("signingIn") : locked ? t("locked.button") : !online ? t("offline.button") : t("signIn");

  return (
    <div className="flex flex-col gap-5">
      {!online && (
        <div role="status" className="flex animate-rise items-start gap-2.5 rounded-[10px] bg-warn-bg px-3.5 py-3 text-warn">
          <WifiOff size={18} className="mt-px flex-none" />
          <div className="flex-1">
            <div className="text-[13.5px] font-semibold">{t("offline.title")}</div>
            <div className="text-[12.5px]">{t("offline.description")}</div>
          </div>
          <button
            onClick={() => toast(navigator.onLine ? t("offline.back") : t("offline.still"), navigator.onLine ? "ok" : "info")}
            className="h-7 whitespace-nowrap rounded-[7px] border border-solid border-current bg-transparent px-2.5 text-[12px] font-semibold text-inherit"
          >
            {t("offline.retry")}
          </button>
        </div>
      )}

      <div>
        <h1 className="m-0 text-[26px] font-semibold tracking-tight">{t("title")}</h1>
        <p className="mb-0 mt-1.5 text-text-2">{t("subtitle")}</p>
      </div>

      {showWrong && !showLocked && (
        <div role="alert" className="flex animate-rise gap-2.5 rounded-[10px] bg-bad-bg px-3.5 py-3 text-bad">
          <CircleAlert size={18} className="mt-px flex-none" />
          <div>
            <div className="text-[13.5px] font-semibold">{t("wrong.title")}</div>
            <div className="text-[12.5px]">
              {lockout.attemptsLeft <= 2 ? t("wrong.attempts", { count: lockout.attemptsLeft }) : t("wrong.retry")}
            </div>
          </div>
        </div>
      )}

      {showLocked && (
        <div role="alert" className="flex animate-rise gap-3 rounded-[10px] bg-bad-bg p-3.5 text-bad">
          <div className="grid size-9 flex-none place-items-center rounded-[9px] bg-bad-dot text-white">
            <Lock size={17} />
          </div>
          <div className="flex-1">
            <div className="text-[13.5px] font-semibold">{t("locked.title")}</div>
            <div className="text-[12.5px]">{t("locked.description")}</div>
            <div className="mt-2.5 flex items-center gap-2.5">
              <span className="font-mono text-[20px] font-semibold tracking-wide">
                {mm}:{ss}
              </span>
              <div className="h-1 flex-1 overflow-hidden rounded bg-bad-dot/20">
                <div className="h-full bg-bad-dot" style={{ width: `${(lockout.remaining / LOCK_MS) * 100}%` }} />
              </div>
            </div>
            <div className="mt-2 text-[12.5px]">
              <a href="#" onClick={forgot} className="text-inherit underline">
                {t("locked.reset")}
              </a>
            </div>
          </div>
        </div>
      )}

      {showDeactivated && (
        <div role="alert" className="flex animate-rise gap-3 rounded-[10px] border border-solid border-border-strong bg-surface-2 p-3.5">
          <div className="grid size-9 flex-none place-items-center rounded-[9px] bg-neutral-bg text-text-2">
            <UserX size={17} />
          </div>
          <div className="flex-1">
            <div className="text-[13.5px] font-semibold">{t("deactivated.title")}</div>
            <div className="text-[12.5px] text-text-2">
              {t("deactivated.description", { email: email || t("deactivated.fallbackEmail") })}
            </div>
            <div className="mt-2 flex gap-3 text-[12.5px]">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toast(t("toasts.adminNotified"));
                }}
              >
                {t("deactivated.contact")}
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setOutcome(null);
                  setEmail("");
                  setPassword("");
                }}
              >
                {t("deactivated.other")}
              </a>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">{t("email")}</span>
          <input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (outcome === "deactivated") setOutcome(null);
            }}
            type="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            disabled={loading || locked}
            aria-invalid={!!emailError || showDeactivated}
            className={inputClass(!!emailError || showDeactivated || showWrong)}
          />
          {emailError && <span className="text-[12.5px] text-bad">{emailError}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="flex items-baseline justify-between">
            <span className="text-[13px] font-medium">{t("password")}</span>
            <a href="#" onClick={forgot} className="text-[12.5px] font-medium">
              {t("forgot")}
            </a>
          </span>
          <div className="relative flex">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={loading || locked}
              aria-invalid={!!passwordError}
              className={cn(inputClass(!!passwordError || showWrong), "min-w-0 flex-1 pr-11")}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? t("hide") : t("show")}
              title={showPw ? t("hide") : t("show")}
              className="absolute right-1.5 top-1.5 grid size-[30px] place-items-center rounded-[7px] border-0 bg-transparent text-text-3 hover:bg-hover hover:text-text"
            >
              {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {passwordError && <span className="text-[12.5px] text-bad">{passwordError}</span>}
        </label>

        <label className="flex cursor-pointer items-center gap-[9px] self-start text-[13.5px] text-text-2">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="m-0 size-4 accent-accent" />
          {t("remember")}
        </label>

        <button
          type="submit"
          disabled={blocked}
          className={cn(
            "flex h-11 items-center justify-center gap-2.5 rounded-[10px] border-0 text-[14.5px] font-semibold hover:brightness-105 disabled:cursor-not-allowed",
            locked || !online ? "bg-neutral-bg text-text-3" : "bg-accent text-white",
          )}
        >
          {loading && <span className="box-border size-4 animate-spin-fast rounded-full border-2 border-solid border-white/35 border-t-white" />}
          {buttonLabel}
        </button>
      </form>

      <div className="flex items-center gap-3 text-[12px] text-text-3">
        <span className="h-px flex-1 bg-border" />
        {t("or")}
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="flex flex-col gap-2.5">
        <Button size="lg" onClick={() => sso("Google")} disabled={blocked} className="gap-2.5 rounded-[10px] text-[14px]">
          <FcGoogle size={18} />
          {t("google")}
        </Button>
        <Button size="lg" onClick={() => sso("Microsoft")} disabled={blocked} className="gap-2.5 rounded-[10px] text-[14px]">
          <MicrosoftMark />
          {t("microsoft")}
        </Button>
      </div>

      <p className="m-0 text-center text-[13.5px] text-text-2">
        {t("noAccount")}{" "}
        <a href="/onboarding" className="font-medium">
          {t("create")}
        </a>
      </p>

      <p className="m-0 rounded-lg bg-surface-2 px-3 py-2 text-center text-[12px] text-text-3">{t("demo")}</p>
    </div>
  );
}
