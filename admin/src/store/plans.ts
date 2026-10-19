import { create } from "zustand";
import { SEED_FEATURES, SEED_PLANS, SEED_SUBSCRIPTION, TRIAL_DAYS } from "@/data/plans";
import type { BillingCycle, Plan, PlanFeature, PlanId, Subscription } from "@/types/plans";

/**
 * The plan catalogue and the company's subscription, held in memory.
 * Everything a plan shows (names, prices, limits, features) lives here so a backend can later
 * own it: replace the seeds with a fetch and call `load`, and send `changePlan` to the API.
 */
interface PlansState {
  plans: Plan[];
  features: PlanFeature[];
  subscription: Subscription;
  /** Free trial length in days. */
  trialDays: number;
  load: (data: { plans: Plan[]; features: PlanFeature[]; subscription: Subscription; trialDays: number }) => void;
  /** Starts the free trial on the plan chosen while signing up. */
  startTrial: (planId: PlanId, billing: BillingCycle) => void;
  changePlan: (planId: PlanId, billing: BillingCycle) => void;
  setBilling: (billing: BillingCycle) => void;
}

export const usePlans = create<PlansState>((set) => ({
  plans: SEED_PLANS,
  features: SEED_FEATURES,
  subscription: SEED_SUBSCRIPTION,
  trialDays: TRIAL_DAYS,
  load: (data) => set(data),
  startTrial: (planId, billing) => set((s) => {
    const ends = new Date(Date.UTC(2026, 9, 19 + s.trialDays));
    return { subscription: { ...s.subscription, planId, billing, renewsOn: null, trialEndsOn: ends.toISOString().slice(0, 10) } };
  }),
  changePlan: (planId, billing) => set((s) => ({ subscription: { ...s.subscription, planId, billing } })),
  setBilling: (billing) => set((s) => ({ subscription: { ...s.subscription, billing } })),
}));

export const useCurrentPlan = (): Plan => {
  const plans = usePlans((s) => s.plans);
  const id = usePlans((s) => s.subscription.planId);
  return plans.find((p) => p.id === id) ?? plans[0];
};
