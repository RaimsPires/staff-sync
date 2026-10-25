"use client";

import { Check, Clock, Eye, EyeOff, Lock, MapPin, ShieldCheck, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { useToast } from "@/components/ui/toast";
import { isPasswordAcceptable, passwordScore } from "@/lib/password";
import { cn } from "@/lib/utils";
import { MicrosoftMark } from "./provider-marks";
import { useSession } from "@/store/session";
import { markSignedIn } from "@/lib/auth-cookie";
import { acceptInvitation } from "@/services/auth";

export type InviteState = "valid" | "expired" | "used";

/** The invitation behind a real link; without it the page shows a sample invitation. */
export interface InviteData { token: string; company: string; invitedBy: string; role: string; email: string }

const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

const BAR_TONE = ["bg-bad-dot", "bg-bad-dot", "bg-warn-dot", "bg-ok-dot", "bg-ok-dot"] as const;
const TEXT_TONE = ["", "text-bad", "text-bad", "text-warn", "text-ok"] as const;
const PERMISSIONS = [
  { key: "p1", allowed: true },
  { key: "p2", allowed: true },
  { key: "p3", allowed: true },
  { key: "p4", allowed: false },
] as const;

const field = (bad: boolean) =>
  cn(
    "h-10 w-full rounded-[9px] border border-solid bg-surface px-3 text-[14px] text-text outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)]",
    bad ? "border-bad-dot" : "border-border-strong",
  );

export function InviteScreen({ state, invite }: { state: InviteState; invite?: InviteData }) {
  const t = useTranslations("Invite");
  const router = useRouter();
  const toast = useToast();
  const setRole = useSession((s) => s.setRole);
  const [name, setName] = useState(invite ? "" : "Nadia Koné");
  const who = invite ?? { token: "", company: "Batiplus Group", invitedBy: "Marc Olivier", role: t("roleName"), email: "nadia.kone@batiplus.fr" };
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [tried, setTried] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const score = passwordScore(password);
  const nameError = tried && name.trim().split(/\s+/).length < 2 ? t("errors.name") : "";
  const passwordError = tried && !isPasswordAcceptable(password) ? t("errors.password") : "";

  const join = async () => {
    setLoading(true);
    if (invite) {
      try {
        const result = await acceptInvitation(invite.token, password, name.trim());
        if (result === "ok") return router.push("/workspaces");
        toast(t(result === "expired" ? "toasts.expiredLink" : "toasts.invalidLink"), "bad");
      } catch {
        toast(t("toasts.failed"), "bad");
      }
      setLoading(false);
      return;
    }
    timer.current = setTimeout(() => {
      setLoading(false);
      setRole("site");
      markSignedIn();
      router.push("/dashboard");
    }, 1200);
  };

  const accept = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    if (name.trim().split(/\s+/).length < 2 || !isPasswordAcceptable(password)) {
      setTried(true);
      return;
    }
    join();
  };

  const decline = (e: React.MouseEvent) => {
    e.preventDefault();
    toast(t("toasts.declined"));
    timer.current = setTimeout(() => router.push("/sign-in"), 900);
  };

  if (state !== "valid") {
    const expired = state === "expired";
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-8 py-9 text-center shadow-card">
        <div className="relative mb-1.5">
          <div className="grid size-[60px] place-items-center rounded-[15px] bg-[#0D1B2E] text-[24px] font-bold text-white opacity-50">{initialsOf(who.company).slice(0, 1) || "B"}</div>
          <div
            className={cn(
              "absolute -bottom-2 -right-2 grid size-7 place-items-center rounded-full border-[3px] border-solid border-surface text-white",
              expired ? "bg-warn-dot" : "bg-accent",
            )}
          >
            {expired ? <Clock size={13} strokeWidth={2.6} /> : <Check size={13} strokeWidth={2.6} />}
          </div>
        </div>
        <h1 className="m-0 text-[22px] font-semibold tracking-tight">{t(expired ? "expired.title" : "used.title")}</h1>
        <p className="m-0 max-w-[380px] text-text-2 text-pretty">{t(expired ? "expired.description" : "used.description")}</p>
        <div className="my-1.5 flex flex-wrap justify-center gap-4 rounded-[10px] bg-surface-2 px-3.5 py-2.5 text-[12.5px] text-text-2">
          <span>{who.company}</span>
          <span className="text-text-3">·</span>
          <span>{who.role}</span>
          <span className="text-text-3">·</span>
          <span>{who.email}</span>
        </div>
        <div className="mt-1.5 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => (expired ? router.push("/sign-in") : toast(t("toasts.reported")))}
            className="h-10 rounded-[10px] border border-solid border-border-strong bg-surface px-4 text-[13.5px] font-medium text-text hover:bg-hover"
          >
            {t(expired ? "expired.secondary" : "used.secondary")}
          </button>
          <button
            onClick={() => (expired ? toast(t("toasts.requested")) : router.push("/sign-in"))}
            className="h-10 rounded-[10px] border-0 bg-accent px-4 text-[13.5px] font-medium text-white hover:bg-accent-hover"
          >
            {t(expired ? "expired.primary" : "used.primary")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
      <aside className="box-border flex flex-[1_1_300px] flex-col gap-5 border-r border-border bg-surface-2 p-7">
        <div className="flex items-center gap-3.5">
          <div className="grid size-14 flex-none place-items-center rounded-[14px] bg-[#0D1B2E] text-[22px] font-bold text-white">{initialsOf(who.company).slice(0, 1) || "B"}</div>
          <div>
            <div className="text-[17px] font-semibold">{who.company}</div>
            <div className="text-[12.5px] text-text-3">{t("companyMeta")}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface p-3">
          <div className="grid size-[34px] flex-none place-items-center rounded-full bg-[oklch(0.93_0.045_250)] text-[12.5px] font-semibold text-[oklch(0.42_0.1_250)]">{initialsOf(who.invitedBy)}</div>
          <div className="text-[13.5px] text-pretty">
            <strong>{who.invitedBy}</strong> <span className="text-text-2">{t("invitedYou")}</span>
            <div className="text-[12px] text-text-3">{t("sent")}</div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-text-3">{t("yourRole")}</div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-accent-soft px-[11px] text-[13px] font-semibold text-accent">
              <ShieldCheck size={13} strokeWidth={2} /> {who.role}
            </span>
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-neutral-bg px-[11px] text-[13px] font-medium text-text-2">
              <MapPin size={13} strokeWidth={2} /> {invite ? t("allowedScope") : "Part-Dieu Tower"}
            </span>
          </div>
          <ul className="m-0 mt-1 flex list-none flex-col gap-[7px] p-0">
            {PERMISSIONS.map(({ key, allowed }) => (
              <li key={key} className={cn("flex gap-[9px] text-[13px]", allowed ? "text-text" : "text-text-3")}>
                {allowed ? (
                  <Check size={15} strokeWidth={2.4} className="mt-0.5 flex-none text-ok-dot" />
                ) : (
                  <X size={15} strokeWidth={2.4} className="mt-0.5 flex-none text-text-3" />
                )}
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto text-[12px] text-text-3">{t("expires")}</div>
      </aside>

      <form onSubmit={accept} noValidate className="box-border flex flex-[1_1_340px] flex-col gap-4 p-7">
        <div>
          <h1 className="m-0 text-[22px] font-semibold tracking-tight">{t("title")}</h1>
          <p className="mb-0 mt-1 text-[13.5px] text-text-2">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Google", icon: <FcGoogle size={16} /> },
            { label: "Microsoft", icon: <MicrosoftMark cell={6} /> },
          ].map(({ label, icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => (invite ? toast(t("toasts.ssoUnavailable"), "info") : !loading && join())}
              className="flex h-10 items-center justify-center gap-2 rounded-[10px] border border-solid border-border-strong bg-surface text-[13px] font-medium text-text hover:bg-hover"
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-[12px] text-text-3">
          <span className="h-px flex-1 bg-border" />
          {t("orPassword")}
          <span className="h-px flex-1 bg-border" />
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">{t("email")}</span>
          <div className="flex h-10 items-center gap-2 rounded-[9px] border border-solid border-border bg-surface-2 px-3 text-text-2">
            <span className="flex-1">{who.email}</span>
            <Lock size={14} className="text-text-3" />
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">{t("name")}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={loading} aria-invalid={!!nameError} className={field(!!nameError)} />
          {nameError && <span className="text-[12.5px] text-bad">{nameError}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">{t("password")}</span>
          <div className="relative flex">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder={t("passwordPlaceholder")}
              disabled={loading}
              aria-invalid={!!passwordError}
              className={cn(field(!!passwordError), "min-w-0 flex-1 pr-11")}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              title={showPw ? t("hide") : t("show")}
              aria-label={showPw ? t("hide") : t("show")}
              className="absolute right-[5px] top-[5px] grid size-[30px] place-items-center rounded-[7px] border-0 bg-transparent text-text-3"
            >
              {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="grid flex-1 grid-cols-4 gap-1">
              {[1, 2, 3, 4].map((i) => (
                <span key={i} className={cn("h-1 rounded", score >= i ? BAR_TONE[score] : "bg-neutral-bg")} />
              ))}
            </div>
            <span className={cn("min-w-[52px] text-right text-[12px] font-medium", TEXT_TONE[score])}>
              {password ? t(`strength.${score}`) : ""}
            </span>
          </div>
          {passwordError && <span className="text-[12.5px] text-bad">{passwordError}</span>}
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex h-11 items-center justify-center gap-2.5 rounded-[10px] border-0 bg-accent text-[14.5px] font-semibold text-white hover:bg-accent-hover disabled:opacity-80"
        >
          {loading && <span className="box-border size-4 animate-spin-fast rounded-full border-2 border-solid border-white/35 border-t-white" />}
          {loading ? t("joining") : t("accept")}
        </button>

        <p className="m-0 text-center text-[12px] text-text-3 text-pretty">
          {t("legal")} <a href="#">{t("terms")}</a>
        </p>
        <p className="m-0 text-center text-[12.5px] text-text-2">
          {t("notYou")}{" "}
          <a href="#" onClick={decline}>
            {t("decline")}
          </a>
        </p>
      </form>
    </div>
  );
}
