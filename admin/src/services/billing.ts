import { ApiError, api } from "@/lib/api";
import { usePlans } from "@/store/plans";
import type { BillingCycle, PlanId } from "@/types/plans";

/** Server plan keys behind the plan cards on screen. */
const SERVER_PLAN: Record<PlanId, string> = { starter: "starter", business: "growth", enterprise: "scale" };
const UI_PLAN: Record<string, PlanId> = { trial: "starter", starter: "starter", growth: "business", scale: "enterprise" };

interface ApiBilling {
  plan: string;
  seat_limit: number;
  seats_used: number;
  trial_ends_at: string | null;
  current_period_end: string | null;
  has_billing_account: boolean;
}

export interface Invoice {
  id: string;
  number: string | null;
  status: string;
  /** Minor units (cents). */
  amountDue: number;
  currency: string;
  /** ISO date. */
  date: string;
  pdf: string | null;
  url: string | null;
}

const isoDay = (v: string | null) => (v ? v.slice(0, 10) : null);

/** The company's subscription and seat limits, from the server (needs the billing permission). */
export async function loadBilling(): Promise<{ hasBillingAccount: boolean }> {
  const [b, plans] = await Promise.all([api.get<ApiBilling>("/billing"), api.get<{ key: string; seat_limit: number }[]>("/billing/plans").catch(() => [])]);
  const limits = new Map(plans.map((p) => [p.key, p.seat_limit]));
  usePlans.setState((s) => ({
    plans: s.plans.map((p) => (limits.has(SERVER_PLAN[p.id]) ? { ...p, employeeCap: limits.get(SERVER_PLAN[p.id]) ?? p.employeeCap } : p)),
    subscription: { ...s.subscription, planId: UI_PLAN[b.plan] ?? "starter", renewsOn: isoDay(b.current_period_end), trialEndsOn: b.plan === "trial" ? isoDay(b.trial_ends_at) : null, seatsUsed: b.seats_used },
  }));
  return { hasBillingAccount: b.has_billing_account };
}

/** Billing runs through Stripe; a server without it answers 503. */
export const isBillingUnavailable = (e: unknown): boolean => e instanceof ApiError && (e.code === "BILLING_NOT_CONFIGURED" || e.code === "PRICE_NOT_CONFIGURED");

/** Start a checkout for a plan and send the browser to it. */
export async function startCheckout(planId: PlanId, billing: BillingCycle): Promise<void> {
  const seats = Math.max(usePlans.getState().subscription.seatsUsed, 1);
  const { url } = await api.post<{ url: string }>("/billing/checkout", { plan: SERVER_PLAN[planId], interval: billing === "yearly" ? "year" : "month", seats });
  window.location.assign(url);
}

/** Open the payment provider's customer portal (card, invoices, cancellation). */
export async function openBillingPortal(): Promise<void> {
  const { url } = await api.post<{ url: string }>("/billing/portal");
  window.location.assign(url);
}

export async function loadInvoices(): Promise<Invoice[]> {
  const rows = await api.get<{ id: string; number: string | null; status: string; amount_due: number; currency: string; created: number; pdf: string | null; url: string | null }[]>("/billing/invoices");
  return rows.map((r) => ({ id: r.id, number: r.number, status: r.status, amountDue: r.amount_due, currency: r.currency.toUpperCase(), date: new Date(r.created * 1000).toISOString().slice(0, 10), pdf: r.pdf, url: r.url }));
}

/** A ZIP of the company's data. The server builds it now and also e-mails the link; it is limited to once an hour. */
export async function requestExport(): Promise<string> {
  return (await api.post<{ download_url: string }>("/company/export")).download_url;
}

/** Schedule the company's deletion; the name must match exactly. */
export async function scheduleDeletion(confirmName: string): Promise<void> {
  await api.post("/company/delete", { confirm_name: confirmName });
}
