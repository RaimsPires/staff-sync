"use client";

import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import { AuthToolbar } from "@/features/auth/auth-toolbar";
import { cn } from "@/lib/utils";
import { TOTAL_STEPS } from "./constants";
import { OnboardingProvider, useOnboarding } from "./store";
import { AccountStep } from "./steps/account-step";
import { BranchStep } from "./steps/branch-step";
import { CompanyStep } from "./steps/company-step";
import { DoneStep } from "./steps/done-step";
import { HoursStep } from "./steps/hours-step";
import { PlanStep } from "./steps/plan-step";
import { SiteStep } from "./steps/site-step";
import { TeamStep } from "./steps/team-step";
import { VerifyStep } from "./steps/verify-step";
import { useStepErrors } from "./use-step-errors";

const STEP_IDS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const CONTENT_WIDTH: Record<number, string> = { 5: "max-w-[960px]", 8: "max-w-[960px]", 7: "max-w-[760px]", 9: "max-w-[720px]" };

export function OnboardingScreen({ startStep }: { startStep: number }) {
  return (
    <OnboardingProvider startStep={startStep}>
      <Wizard />
    </OnboardingProvider>
  );
}

function Wizard() {
  const t = useTranslations("Onboarding");
  const step = useOnboarding((s) => s.step);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const inWizard = step <= TOTAL_STEPS;

  return (
    <div className="flex min-h-screen bg-bg text-[14px] leading-[1.45] text-text">
      <StepRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <WizardHeader />
        <main className="box-border flex flex-1 justify-center px-7 pb-14 pt-9">
          <div key={step} className={cn("flex w-full animate-rise flex-col gap-[22px]", CONTENT_WIDTH[step] ?? "max-w-[580px]")}>
            {inWizard && <StepIntro />}
            <StepBody step={step} />
            {inWizard && <WizardFooter />}
          </div>
        </main>
      </div>
      <span className="sr-only" aria-live="polite">
        {inWizard ? t("progress", { step, label: t(`steps.${step}.label`) }) : t("complete")}
      </span>
    </div>
  );
}

function StepBody({ step }: { step: number }) {
  switch (step) {
    case 1:
      return <AccountStep />;
    case 2:
      return <VerifyStep />;
    case 3:
      return <CompanyStep />;
    case 4:
      return <BranchStep />;
    case 5:
      return <SiteStep />;
    case 6:
      return <HoursStep />;
    case 7:
      return <TeamStep />;
    case 8:
      return <PlanStep />;
    default:
      return <DoneStep />;
  }
}

function StepRail() {
  const t = useTranslations("Onboarding");
  const step = useOnboarding((s) => s.step);
  const maxStep = useOnboarding((s) => s.maxStep);
  const goStep = useOnboarding((s) => s.goStep);

  return (
    <aside className="sticky top-0 hidden h-screen w-[300px] flex-none flex-col border-r border-border bg-surface px-5 py-6 min-[1000px]:flex">
      <div className="mb-8 flex items-center gap-2.5">
        <div className="grid size-[34px] place-items-center overflow-hidden rounded-[9px] border border-border bg-white">
          <Image src="/staffsync-logo.png" alt="" width={30} height={30} className="object-contain" />
        </div>
        <div className="text-[16px] font-bold tracking-tight">StaffSync</div>
      </div>
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-text-3">{t("rail.title")}</div>

      <ol className="m-0 flex flex-1 list-none flex-col p-0">
        {STEP_IDS.map((n) => {
          const done = n < step || step === 9;
          const current = n === step;
          const locked = n > maxStep || step === 9 || (step >= 3 && n <= 2);
          return (
            <li key={n}>
              <button
                onClick={() => !locked && n !== step && goStep(n)}
                disabled={locked}
                aria-current={current ? "step" : undefined}
                className={cn("flex w-full items-start gap-3 border-0 bg-transparent p-0 text-left text-inherit", locked ? "cursor-default" : "cursor-pointer")}
              >
                <div className="flex flex-col items-center self-stretch">
                  <span
                    className={cn(
                      "box-border grid size-[26px] flex-none place-items-center rounded-full font-mono text-[12px] font-semibold",
                      done && "bg-accent text-white",
                      !done && current && "border-2 border-solid border-accent bg-surface text-accent",
                      !done && !current && "border border-solid border-border-strong bg-surface-2 text-text-3",
                    )}
                  >
                    {done ? <Check size={13} strokeWidth={3} /> : n}
                  </span>
                  {n < TOTAL_STEPS && <span className={cn("my-[3px] min-h-3.5 w-0.5 flex-1 rounded-sm", done ? "bg-accent" : "bg-border")} />}
                </div>
                <div className="pb-4 pt-[3px]">
                  <div className={cn("text-[13.5px]", current ? "font-semibold" : "font-medium", current || done ? "text-text" : "text-text-3")}>
                    {t(`steps.${n}.label`)}
                  </div>
                  <div className="text-[12px] text-text-3">{t(`steps.${n}.sub`)}</div>
                </div>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="border-t border-border pt-4 text-[12.5px] text-text-3">
        {t("rail.help")} <a href="#">{t("rail.book")}</a>
      </div>
    </aside>
  );
}

function WizardHeader() {
  const t = useTranslations("Onboarding");
  const toast = useToast();
  const step = useOnboarding((s) => s.step);
  const email = useOnboarding((s) => s.form.email);
  const pct = step === 9 ? 100 : Math.round(((step - 1) / TOTAL_STEPS) * 100);

  return (
    <header className="flex h-[60px] flex-none items-center gap-3.5 border-b border-border bg-surface px-7">
      <Image src="/staffsync-logo.png" alt="" width={28} height={28} className="object-contain min-[1000px]:hidden" />
      <div className="flex max-w-[340px] flex-1 flex-col gap-1.5">
        <div className="text-[12.5px] text-text-2">
          {step === 9 ? t("complete") : t("progress", { step, label: t(`steps.${step}.label`) })}
        </div>
        <div className="h-1 overflow-hidden rounded bg-neutral-bg" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex-1" />
      {step >= 3 && step <= TOTAL_STEPS && (
        <button
          onClick={() => toast(t("savedLater", { email: email || t("you") }))}
          className="flex h-[34px] items-center gap-[7px] rounded-[9px] border border-solid border-border bg-transparent px-3 text-[13px] font-medium text-text-2 hover:bg-hover"
        >
          <Save size={14} /> <span className="hidden sm:inline">{t("saveLater")}</span>
        </button>
      )}
      <AuthToolbar />
    </header>
  );
}

function StepIntro() {
  const t = useTranslations("Onboarding");
  const step = useOnboarding((s) => s.step);
  const { count } = useStepErrors(step);

  return (
    <>
      <div>
        <div className="mb-1.5 font-mono text-[12px] font-medium text-accent">{t("eyebrow", { step })}</div>
        <h1 className="m-0 text-[26px] font-semibold tracking-tight">{t(`steps.${step}.title`)}</h1>
        <p className="mb-0 mt-1.5 text-[14px] text-text-2 text-pretty">{t(`steps.${step}.description`)}</p>
      </div>
      {count > 0 && (
        <div role="alert" className="flex items-center gap-2.5 rounded-[10px] bg-bad-bg px-3.5 py-[11px] text-[13px] font-medium text-bad">
          {t("summary", { count })}
        </div>
      )}
    </>
  );
}

function WizardFooter() {
  const t = useTranslations("Onboarding");
  const step = useOnboarding((s) => s.step);
  const form = useOnboarding((s) => s.form);
  const goStep = useOnboarding((s) => s.goStep);
  const next = useOnboarding((s) => s.next);
  const skipTeam = useOnboarding((s) => s.skipTeam);

  const invited = form.mode === "manual" ? form.people.filter((p) => p.name.trim() && p.contact.trim()).length : form.csvCount;
  const planName = form.plan ? t(`done.plans.${form.plan}`) : "";
  const label =
    step === 1
      ? t("nav.createAccount")
      : step === 2
        ? t("nav.verify")
        : step === 7
          ? invited
            ? t("nav.sendInvites", { count: invited })
            : t("nav.continue")
          : step === 8
            ? form.plan === "trial" || !form.plan
              ? t("nav.startTrial")
              : t("nav.startTrialOn", { plan: planName })
            : t("nav.continue");

  return (
    <div className="flex items-center gap-2.5 pt-1">
      {step > 1 && step !== 3 && (
        <button
          onClick={() => goStep(step - 1)}
          className="flex h-[42px] items-center gap-1.5 rounded-[10px] border border-solid border-border-strong bg-surface px-4 text-[14px] font-medium text-text hover:bg-hover"
        >
          <ArrowLeft size={16} /> {t("nav.back")}
        </button>
      )}
      <div className="flex-1" />
      {step === 7 && (
        <button onClick={skipTeam} className="h-[42px] rounded-[10px] border-0 bg-transparent px-3.5 text-[14px] font-medium text-text-2 hover:text-text">
          {t("nav.skip")}
        </button>
      )}
      <button
        onClick={() => next()}
        className="flex h-[42px] items-center gap-2 rounded-[10px] border-0 bg-accent px-5 text-[14px] font-medium text-white hover:bg-accent-hover"
      >
        {label} <ArrowRight size={16} />
      </button>
    </div>
  );
}
