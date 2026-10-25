"use client";

import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { useToast } from "@/components/ui/toast";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";
import { FormCard } from "../form-card";
import { useOnboarding } from "../store";
import { useStepErrors } from "../use-step-errors";

export function VerifyStep() {
  const t = useTranslations("Onboarding.verify");
  const toast = useToast();
  const email = useOnboarding((s) => s.form.email);
  const code = useOnboarding((s) => s.code);
  const setCode = useOnboarding((s) => s.setCode);
  const resendAt = useOnboarding((s) => s.resendAt);
  const resend = useOnboarding((s) => s.resend);
  const goStep = useOnboarding((s) => s.goStep);
  const { error } = useStepErrors(2);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const now = useNow(true);

  const left = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const shownEmail = email || t("yourEmail");

  const update = (i: number, value: string) => {
    const next = [...code];
    next[i] = value;
    setCode(next);
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    e.preventDefault();
    setCode(Array.from({ length: 6 }, (_, i) => digits[i] ?? ""));
  };

  return (
    <FormCard className="items-center gap-[18px] px-6 py-7 text-center">
      <div className="grid size-[52px] place-items-center rounded-[14px] bg-accent-soft text-accent">
        <Mail size={24} />
      </div>
      <p className="m-0 text-[14px] text-text-2">
        {t("sentTo")} <strong className="text-text">{shownEmail}</strong>
      </p>

      <div onPaste={onPaste} className="flex gap-2">
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={digit}
            onChange={(e) => {
              const d = e.target.value.replace(/\D/g, "").slice(-1);
              update(i, d);
              if (d && i < 5) inputs.current[i + 1]?.focus();
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !code[i] && i > 0) inputs.current[i - 1]?.focus();
            }}
            inputMode="numeric"
            maxLength={1}
            aria-label={t("digit", { n: i + 1 })}
            className={cn(
              "h-14 w-12 rounded-[10px] border border-solid bg-surface text-center font-mono text-[22px] font-semibold text-text outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)]",
              error("code") ? "border-bad-dot" : digit ? "border-accent" : "border-border-strong",
            )}
          />
        ))}
      </div>
      {error("code") && <span className="text-[12.5px] text-bad">{error("code")}</span>}

      <div className="text-[13px] text-text-3">
        {left > 0 ? (
          <span>
            {t("resendIn")} <span className="font-mono text-text-2">0:{String(left).padStart(2, "0")}</span>
          </span>
        ) : (
          <>
            <span>
              {t("didntGet")}{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  void resend().then((ok) => toast(ok ? t("newCode", { email: shownEmail }) : t("resendFailed"), ok ? "ok" : "bad"));
                }}
              >
                {t("resend")}
              </a>
            </span>
            <span>
              {" · "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goStep(1);
                }}
              >
                {t("changeEmail")}
              </a>
            </span>
          </>
        )}
      </div>

      <p className="m-0 rounded-lg bg-surface-2 px-3 py-2 text-[12px] text-text-3">{t("hint")}</p>
    </FormCard>
  );
}
