"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { isBillingUnavailable, loadInvoices, openBillingPortal, type Invoice } from "@/services/billing";
import { localized, planPrice } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { useCurrentPlan, usePlans } from "@/store/plans";
import { useDateFormat } from "@/lib/preferences";

const card = "overflow-hidden rounded-xl border border-border bg-surface shadow-card";

export function BillingSection() {
  const t = useTranslations("Settings.billing");
  const tPlans = useTranslations("Plans");
  const format = useFormatter();
  const toast = useToast();
  const locale = useLocale();
  const numericDate = useDateFormat();
  const { subscription } = usePlans();
  const current = useCurrentPlan();
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let live = true;
    loadInvoices().then(
      (list) => live && setInvoices(list),
      (e: unknown) => {
        if (!live) return;
        setInvoices([]);
        setUnavailable(isBillingUnavailable(e));
      },
    );
    return () => {
      live = false;
    };
  }, []);
  const portal = async () => {
    try {
      await openBillingPortal();
    } catch (e) {
      toast(isBillingUnavailable(e) ? t("unavailable") : e instanceof Error ? e.message : t("portalFailed"), "bad");
    }
  };
  const used = subscription.seatsUsed;
  const cap = current.employeeCap;
  const money = (n: number) => format.number(n, { style: "currency", currency: "EUR" });
  const price = planPrice(current, subscription.billing);

  return (
    <>
      <section className={card}>
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-[18px] py-3.5">
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-[14.5px] font-semibold">{t("title")}</h2>
            {subscription.trialEndsOn && <p className="mt-0.5 text-[12.5px] text-text-3">{tPlans("trialEnds", { date: format.dateTime(new Date(subscription.trialEndsOn), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) })}</p>}
            {subscription.renewsOn && <p className="mt-0.5 text-[12.5px] text-text-3">{t("renews", { date: format.dateTime(new Date(subscription.renewsOn), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }), cycle: t(subscription.billing) })}</p>}
          </div>
          <Link href="/settings/plans" className="inline-flex h-9 items-center rounded-[9px] bg-accent px-3.5 text-[13px] font-medium text-white no-underline hover:no-underline">{t("comparePlans")}</Link>
        </div>
        <div className="flex flex-col gap-1.5 px-[18px] py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-[13px]">
            <span><b className="text-[15px]">{localized(current.name, locale)}</b> · {price === null ? t("customPrice") : t("price", { price: money(price) })}</span>
            <span className="font-medium">{cap === null ? t("usageUnlimited", { used }) : t("usage", { used, cap })}</span>
          </div>
          {cap !== null && (
            <div className="h-2 overflow-hidden rounded bg-neutral-bg" role="progressbar" aria-valuenow={used} aria-valuemax={cap}><div className={cn("h-full", used / cap > 0.9 ? "bg-warn-dot" : "bg-accent")} style={{ width: `${Math.min(100, Math.round((used / cap) * 100))}%` }} /></div>
          )}
        </div>
      </section>

      <section className={card}>
        <div className="flex items-center gap-3 px-[18px] py-3.5">
          <div className="min-w-0 flex-1"><h2 className="m-0 text-[14.5px] font-semibold">{t("payment")}</h2><p className="mt-0.5 text-[12.5px] text-text-3">{unavailable ? t("unavailable") : t("portalHint")}</p></div>
          <Button size="sm" onClick={portal} disabled={unavailable}>{t("managePayment")}</Button>
        </div>
      </section>

      <section className={card}>
        <div className="border-b border-border px-[18px] py-3.5"><h2 className="m-0 text-[14.5px] font-semibold">{t("invoices")}</h2></div>
        <div className="overflow-x-auto"><div className="min-w-[520px]">
          {(invoices ?? []).map((inv) => (
            <div key={inv.id} className="grid grid-cols-[130px_1fr_100px_90px_90px] items-center gap-2.5 border-t border-border px-[18px] py-[11px] text-[13px] first:border-t-0">
              <span className="font-mono text-[12.5px]">{inv.number ?? inv.id}</span>
              <span className="text-text-2">{numericDate(inv.date)}</span>
              <span className="font-mono">{format.number(inv.amountDue / 100, { style: "currency", currency: inv.currency })}</span>
              <span><span className={cn("rounded-md px-2 py-0.5 text-[12px] font-medium", inv.status === "paid" ? "bg-ok-bg text-ok" : "bg-warn-bg text-warn")}>{inv.status === "paid" ? t("paid") : inv.status}</span></span>
              {inv.pdf || inv.url ? <a href={inv.pdf ?? inv.url ?? "#"} target="_blank" rel="noreferrer" className="text-right text-[12.5px] text-accent">{t("download")}</a> : <span />}
            </div>
          ))}
          {invoices !== null && invoices.length === 0 && <div className="px-[18px] py-8 text-center text-[13px] text-text-3">{unavailable ? t("unavailable") : t("noInvoices")}</div>}
        </div></div>
      </section>

    </>
  );
}
