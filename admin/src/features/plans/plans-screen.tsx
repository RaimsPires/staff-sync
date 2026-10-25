"use client";

import { ArrowLeft, Check, Minus } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { direction, localized, planPrice, tooSmall } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { isBillingUnavailable, startCheckout } from "@/services/billing";
import { usePlans, useCurrentPlan } from "@/store/plans";
import type { BillingCycle, FeatureGroup, FeatureValue, Plan, PlanFeature } from "@/types/plans";

const GROUPS: FeatureGroup[] = ["usage", "tracking", "management", "security", "support"];
const card = "rounded-xl border border-border bg-surface shadow-card";

export function PlansScreen() {
  const t = useTranslations("Plans");
  const locale = useLocale();
  const format = useFormatter();
  const toast = useToast();
  const choose = async (p: Plan) => {
    try {
      await startCheckout(p.id, billing);
    } catch (e) {
      toast(isBillingUnavailable(e) ? t("billingUnavailable") : e instanceof Error ? e.message : t("checkoutFailed"), "bad");
    }
  };
  const { plans, features, subscription } = usePlans();
  const current = useCurrentPlan();
  const [billing, setBilling] = useState<BillingCycle>(subscription.billing);
  const [target, setTarget] = useState<Plan | null>(null);

  const visible = plans.filter((p) => p.active || p.id === current.id);
  const name = (p: Plan) => localized(p.name, locale);
  const money = (n: number) => format.number(n, { style: "currency", currency: "EUR", minimumFractionDigits: Number.isInteger(n) ? 0 : 2 });
  const capacity = (p: Plan) => (p.employeeCap === null ? t("unlimitedEmployees") : t("upTo", { count: p.employeeCap }));
  const cell = (f: PlanFeature, v: FeatureValue) => {
    if (f.kind === "bool") return v ? <Check size={16} strokeWidth={2.4} className="mx-auto text-ok-dot" aria-label={t("included")} /> : <Minus size={16} className="mx-auto text-text-3" aria-label={t("notIncluded")} />;
    if (v === null) return <span className="text-[13px] font-medium">{t("unlimited")}</span>;
    return <span className="text-[13px] font-medium">{format.number(Number(v))}{f.unit ? ` ${localized(f.unit, locale)}` : ""}</span>;
  };
  const featureLabel = (id: string) => { const f = features.find((x) => x.id === id); return f ? localized(f.label, locale) : id; };

  const action = (p: Plan) => {
    if (p.id === current.id && billing === subscription.billing) return { label: t("yourPlan"), disabled: true, onClick: () => {} };
    if (p.id === current.id) return { label: t("switchBilling", { cycle: t(`cycles.${billing}`) }), disabled: false, onClick: () => setTarget(p) };
    if (p.price === null) return { label: t("contactSales"), disabled: false, onClick: () => toast(t("salesToast")) };
    if (tooSmall(p, subscription.seatsUsed)) return { label: t("tooMany"), disabled: true, onClick: () => {} };
    return { label: t(direction(current, p) === "up" ? "upgrade" : "downgrade"), disabled: false, onClick: () => setTarget(p) };
  };

  const pct = current.employeeCap ? Math.round((subscription.seatsUsed / current.employeeCap) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <Link href="/settings?section=billing" className="flex h-[30px] items-center gap-1.5 self-start rounded-lg py-0 pl-1.5 pr-2.5 text-[13px] font-medium text-text-2 no-underline hover:bg-hover hover:no-underline">
        <ArrowLeft size={15} /> {t("back")}
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="m-0 text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-[13.5px] text-text-2">{t("subtitle")}</p>
        </div>
        <div role="group" aria-label={t("billingPeriod")} className="flex gap-[3px] rounded-[11px] border border-border bg-surface p-[3px]">
          {(["monthly", "yearly"] as const).map((b) => (
            <button key={b} aria-pressed={billing === b} onClick={() => setBilling(b)}
              className={cn("flex h-8 items-center gap-2 rounded-lg border-0 px-4 text-[13px] font-medium", billing === b ? "bg-surface-2 text-text shadow-[0_1px_2px_rgb(0_0_0/0.1)]" : "bg-transparent text-text-2")}>
              {t(b)}{b === "yearly" && <span className="rounded-full bg-ok-bg px-1.5 py-0.5 text-[11px] font-semibold text-ok">{t("save")}</span>}
            </button>
          ))}
        </div>
      </div>

      <section className={cn(card, "flex flex-wrap items-center gap-x-6 gap-y-2 px-[18px] py-3.5")}>
        <div>
          <div className="text-[12px] text-text-3">{t("currentPlan")}</div>
          <div className="text-[15px] font-semibold">{name(current)} · {t(subscription.billing)}</div>
        </div>
        <div className="min-w-[220px] flex-1">
          <div className="mb-1 flex justify-between text-[12.5px]"><span className="font-medium">{current.employeeCap === null ? t("usageUnlimited", { used: subscription.seatsUsed }) : t("usage", { used: subscription.seatsUsed, cap: current.employeeCap })}</span></div>
          {current.employeeCap !== null && (
            <div className="h-2 overflow-hidden rounded bg-neutral-bg" role="progressbar" aria-valuenow={subscription.seatsUsed} aria-valuemax={current.employeeCap}>
              <div className={cn("h-full", pct > 90 ? "bg-warn-dot" : "bg-accent")} style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
          )}
        </div>
        {subscription.trialEndsOn && <div className="rounded-full bg-info-bg px-2.5 py-1 text-[12.5px] font-medium text-info">{t("trialEnds", { date: format.dateTime(new Date(subscription.trialEndsOn), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) })}</div>}
        {subscription.renewsOn && <div className="text-[12.5px] text-text-2">{t("renews", { date: format.dateTime(new Date(subscription.renewsOn), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) })}</div>}
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
        {visible.map((p) => {
          const price = planPrice(p, billing);
          const cur = p.id === current.id;
          const a = action(p);
          return (
            <div key={p.id} className={cn("relative flex flex-col gap-3 rounded-[14px] bg-surface px-[18px] py-5 shadow-card", cur ? "border-2 border-solid border-accent" : "border border-solid border-border")}>
              {(cur || p.recommended) && (
                <span className={cn("absolute -top-2.5 left-[18px] rounded-full px-2 py-[3px] text-[11px] font-semibold", cur ? "bg-accent text-white" : "bg-ok-bg text-ok")}>{cur ? t("current") : t("recommended")}</span>
              )}
              <div className="text-[15px] font-semibold">{name(p)}</div>
              <div className="min-h-[34px] text-[12.5px] text-text-2">{localized(p.tagline, locale)}</div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[28px] font-semibold tracking-tight">{price === null ? t("custom") : money(price)}</span>
                  {price !== null && price > 0 && <span className="text-[12.5px] text-text-3">{t("perEmployee")}</span>}
                </div>
                <div className="min-h-[18px] text-[12.5px] text-text-3">
                  {price === null ? t("volumePricing") : t(billing === "yearly" ? "billedYearly" : "billedMonthly")}
                </div>
              </div>
              <div className="rounded-lg bg-surface-2 px-2.5 py-1.5 text-[12.5px] font-medium text-text-2">{capacity(p)}</div>
              <ul className="m-0 flex list-none flex-col gap-[7px] p-0">
                {p.highlights.filter((id) => id !== "employees").map((id) => (
                  <li key={id} className="flex gap-2 text-[12.5px] text-text-2"><Check size={14} strokeWidth={2.4} className="mt-px flex-none text-ok-dot" />{featureLabel(id)}</li>
                ))}
              </ul>
              <Button className="mt-auto" variant={cur || a.disabled ? "secondary" : "primary"} disabled={a.disabled} onClick={a.onClick}>{a.label}</Button>
            </div>
          );
        })}
      </div>

      <section className={cn(card, "overflow-hidden")}>
        <div className="border-b border-border px-[18px] py-3.5"><h2 className="m-0 text-[14.5px] font-semibold">{t("compare")}</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="w-[34%] px-[18px] py-3 text-[12px] font-semibold uppercase tracking-wide text-text-3">{t("feature")}</th>
                {visible.map((p) => (
                  <th key={p.id} scope="col" className={cn("px-3 py-3 text-center text-[13.5px] font-semibold", p.id === current.id && "bg-accent-soft text-accent")}>{name(p)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GROUPS.map((g) => (
                <GroupRows key={g} group={g} features={features.filter((f) => f.group === g)} plans={visible} currentId={current.id} cell={cell} locale={locale} title={t(`groups.${g}`)} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        open={target !== null}
        title={target ? (target.id === current.id ? t("confirm.billingTitle", { cycle: t(`cycles.${billing}`) }) : t(direction(current, target) === "up" ? "confirm.upgradeTitle" : "confirm.downgradeTitle", { plan: name(target) })) : ""}
        message={target ? (planPrice(target, billing) === null ? "" : t("confirm.message", { price: money(planPrice(target, billing) ?? 0), cycle: t(`cycles.${billing}`) })) : ""}
        cancelLabel={t("confirm.cancel")}
        okLabel={t("confirm.ok")}
        onCancel={() => setTarget(null)}
        onOk={() => { const chosen = target; setTarget(null); if (chosen) void choose(chosen); }}
      />
    </div>
  );
}

function GroupRows({ group, features, plans, currentId, cell, locale, title }: {
  group: FeatureGroup; features: PlanFeature[]; plans: Plan[]; currentId: string; cell: (f: PlanFeature, v: FeatureValue) => React.ReactNode; locale: string; title: string;
}) {
  if (features.length === 0) return null;
  return (
    <>
      <tr key={group} className="bg-surface-2"><th scope="colgroup" colSpan={plans.length + 1} className="px-[18px] py-2 text-left text-[11.5px] font-semibold uppercase tracking-[.05em] text-text-3">{title}</th></tr>
      {features.map((f) => (
        <tr key={f.id} className="border-t border-border">
          <th scope="row" className="px-[18px] py-2.5 text-left text-[13px] font-normal text-text">{localized(f.label, locale)}</th>
          {plans.map((p) => <td key={p.id} className={cn("px-3 py-2.5 text-center", p.id === currentId && "bg-accent-soft/40")}>{cell(f, f.id in p.values ? p.values[f.id] : false)}</td>)}
        </tr>
      ))}
    </>
  );
}
