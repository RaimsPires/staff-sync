"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal, KeepMounted } from "@/components/ui/overlay";
import { controlClass } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import { INVOICES } from "@/data/settings";
import { localized, planPrice } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { useCurrentPlan, usePlans } from "@/store/plans";
import { useDateFormat } from "@/lib/preferences";

const card = "overflow-hidden rounded-xl border border-border bg-surface shadow-card";

function CardModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Settings.billing.card");
  const tc = useTranslations("Settings");
  const toast = useToast();
  const [num, setNum] = useState("");
  const [exp, setExp] = useState("");
  const [tried, setTried] = useState(false);
  const badNum = num.replace(/\s/g, "").length < 13;
  const badExp = !/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp);
  const save = () => { if (badNum || badExp) return setTried(true); toast(t("updated")); onClose(); };
  return (
    <Modal open onClose={onClose} title={t("title")} className="max-w-[460px]" footer={<><Button onClick={onClose}>{tc("cancel")}</Button><Button variant="primary" onClick={save}>{t("save")}</Button></>}>
      <div className="flex flex-col gap-3.5">
        <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">{t("number")}<input value={num} onChange={(e) => setNum(e.target.value)} inputMode="numeric" autoComplete="off" placeholder="4242 4242 4242 4242" aria-invalid={tried && badNum} className={controlClass(tried && badNum)} />{tried && badNum && <span className="text-[12px] font-normal text-bad">{t("numberError")}</span>}</label>
        <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">{t("expiry")}<input value={exp} onChange={(e) => setExp(e.target.value)} placeholder="08/28" autoComplete="off" aria-invalid={tried && badExp} className={cn(controlClass(tried && badExp), "w-[120px]")} />{tried && badExp && <span className="text-[12px] font-normal text-bad">{t("expiryError")}</span>}</label>
      </div>
    </Modal>
  );
}

export function BillingSection() {
  const t = useTranslations("Settings.billing");
  const tPlans = useTranslations("Plans");
  const format = useFormatter();
  const toast = useToast();
  const locale = useLocale();
  const numericDate = useDateFormat();
  const { subscription } = usePlans();
  const current = useCurrentPlan();
  const [card2, setCard] = useState(false);
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
        <div className="flex items-center gap-3 border-b border-border px-[18px] py-3.5"><h2 className="m-0 flex-1 text-[14.5px] font-semibold">{t("payment")}</h2><Button size="sm" onClick={() => setCard(true)}>{t("update")}</Button></div>
        <div className="flex items-center gap-3.5 px-[18px] py-3.5"><div className="grid h-8 w-12 place-items-center rounded-md bg-info-bg text-[11px] font-bold text-info">VISA</div><div><div className="text-[13.5px] font-medium">{t("cardEnding", { last4: "4242" })}</div><div className="text-[12.5px] text-text-3">{t("cardExpiry", { date: "08/2028", name: "Claire Vasseur" })}</div></div></div>
      </section>

      <section className={card}>
        <div className="border-b border-border px-[18px] py-3.5"><h2 className="m-0 text-[14.5px] font-semibold">{t("invoices")}</h2></div>
        <div className="overflow-x-auto"><div className="min-w-[520px]">
          {INVOICES.map((inv) => (
            <div key={inv.id} className="grid grid-cols-[130px_1fr_100px_90px_90px] items-center gap-2.5 border-t border-border px-[18px] py-[11px] text-[13px] first:border-t-0">
              <span className="font-mono text-[12.5px]">{inv.id}</span>
              <span className="text-text-2">{numericDate(inv.date)}</span>
              <span className="font-mono">{money(inv.amount)}</span>
              <span><span className="rounded-md bg-ok-bg px-2 py-0.5 text-[12px] font-medium text-ok">{t("paid")}</span></span>
              <button onClick={() => toast(t("downloading", { id: inv.id }))} className="border-0 bg-transparent p-0 text-right text-[12.5px] text-accent">{t("download")}</button>
            </div>
          ))}
        </div></div>
      </section>

      <KeepMounted show={!!card2}>{card2 && <CardModal onClose={() => setCard(false)} />}</KeepMounted>
    </>
  );
}
