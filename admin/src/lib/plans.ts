import type { BillingCycle, Locale, Localized, Plan } from "@/types/plans";

export const localized = (text: Localized, locale: string): string => text[locale as Locale] ?? text.en;

/** Euro per employee per month for a billing cycle, or null for custom pricing. */
export const planPrice = (plan: Plan, billing: BillingCycle): number | null => (plan.price ? plan.price[billing] : null);

/** True when the plan cannot hold the employees already counted. */
export const tooSmall = (plan: Plan, seatsUsed: number): boolean => plan.employeeCap !== null && plan.employeeCap < seatsUsed;

/** Whether `to` is a step up or down from `from`, by employee capacity. */
export function direction(from: Plan, to: Plan): "up" | "down" {
  const cap = (p: Plan) => p.employeeCap ?? Number.POSITIVE_INFINITY;
  return cap(to) >= cap(from) ? "up" : "down";
}
