"use client";

import { createContext, useContext, useState } from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import { INITIAL_FORM, TOTAL_STEPS } from "./constants";
import type { OnboardingForm } from "./types";
import { errorCount, validateStep } from "./validation";

const RESEND_MS = 30_000;
const EMPTY_CODE = ["", "", "", "", "", ""];

interface OnboardingState {
  step: number;
  maxStep: number;
  /** Steps where the user already pressed Continue, so errors are shown. */
  tried: Record<number, boolean>;
  form: OnboardingForm;
  code: string[];
  resendAt: number;
  checks: boolean[];
  set: <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => void;
  setCode: (code: string[]) => void;
  goStep: (n: number) => void;
  /** Validates the current step and advances. Returns false when fields are invalid. */
  next: () => boolean;
  /** Signs up through SSO: the email is already verified, so the wizard jumps to step 3. */
  sso: () => void;
  resend: () => void;
  skipTeam: () => void;
  toggleCheck: (i: number, value?: boolean) => void;
}

const createOnboardingStore = (startStep: number) =>
  createStore<OnboardingState>((set, get) => ({
    step: startStep,
    maxStep: 1,
    tried: {},
    form: INITIAL_FORM,
    code: EMPTY_CODE,
    resendAt: 0,
    checks: [false, false, false],
    set: (key, value) => set((s) => ({ form: { ...s.form, [key]: value } })),
    setCode: (code) => set({ code }),
    goStep: (n) =>
      set((s) => ({
        step: n,
        maxStep: Math.max(s.maxStep, n),
        resendAt: n === 2 && s.resendAt < Date.now() ? Date.now() + RESEND_MS : s.resendAt,
      })),
    next: () => {
      const { step, form, code, goStep } = get();
      if (errorCount(validateStep(step, form, code)) > 0) {
        set((s) => ({ tried: { ...s.tried, [step]: true } }));
        return false;
      }
      goStep(step + 1);
      return true;
    },
    sso: () =>
      set((s) => ({
        form: { ...s.form, name: s.form.name || "Claire Vasseur", email: "claire@batiplus.fr" },
        step: 3,
        maxStep: 3,
      })),
    resend: () => set({ resendAt: Date.now() + RESEND_MS, code: EMPTY_CODE }),
    skipTeam: () => {
      set((s) => ({ form: { ...s.form, people: [{ name: "", contact: "", role: "employee" }] } }));
      get().goStep(TOTAL_STEPS);
    },
    toggleCheck: (i, value) =>
      set((s) => ({ checks: s.checks.map((c, j) => (j === i ? (value ?? !c) : c)) })),
  }));

const Ctx = createContext<StoreApi<OnboardingState> | null>(null);

export function OnboardingProvider({ startStep, children }: { startStep: number; children: React.ReactNode }) {
  const [store] = useState(() => createOnboardingStore(startStep));
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useOnboarding<T>(selector: (s: OnboardingState) => T): T {
  const store = useContext(Ctx);
  if (!store) throw new Error("useOnboarding must be used inside <OnboardingProvider>");
  return useStore(store, selector);
}
