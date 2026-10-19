export type PlanId = "starter" | "business" | "enterprise";
export type BillingCycle = "monthly" | "yearly";
export type Locale = "en" | "fr";

/** Text that the backend returns in every supported language. */
export type Localized = Record<Locale, string>;

export type FeatureGroup = "usage" | "tracking" | "management" | "security" | "support";

/** One row of the comparison table. `number` features are limits (null = unlimited); `bool` features are included or not. */
export interface PlanFeature {
  id: string;
  group: FeatureGroup;
  kind: "bool" | "number";
  label: Localized;
  /** Shown after a number, e.g. "months". */
  unit?: Localized;
}

export type FeatureValue = boolean | number | null;

export interface Plan {
  id: PlanId;
  name: Localized;
  tagline: Localized;
  /** Euro per employee per month, or null when the price is agreed with sales. */
  price: { monthly: number; yearly: number } | null;
  /** Employees included; null means no limit. */
  employeeCap: number | null;
  /** Feature ids shown as bullet points on the plan card. */
  highlights: string[];
  /** Value of every catalogue feature on this plan. */
  values: Record<string, FeatureValue>;
  recommended: boolean;
  /** Inactive plans cannot be chosen but still describe existing subscriptions. */
  active: boolean;
}

/** What the company pays for today. */
export interface Subscription {
  planId: PlanId;
  billing: BillingCycle;
  /** ISO date of the next invoice, null on a trial. */
  renewsOn: string | null;
  /** ISO date the free trial ends, null once the company pays. */
  trialEndsOn: string | null;
  /** Employees counted against the plan cap. */
  seatsUsed: number;
}
