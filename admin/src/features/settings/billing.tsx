"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/overlay";
import { controlClass } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import { INVOICES, PLANS, SEATS_USED } from "@/data/settings";
import { cn } from "@/lib/utils";
import { useSettings } from "@/store/settings";
import type { PlanId } from "@/types/settings";

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
  const tPlan = useTranslations("Settings.billing.plans");
  const format = useFormatter();
  const toast = useToast();
  const { plan, setPlan } = useSettings();
  const [changing, setChanging] = useState<PlanId | null>(null);
  const [card2, setCard] = useState(false);
  const current = PLANS.find((p) => p.id === plan)!;
  const left = current.cap - SEATS_USED;
  const target = PLANS.find((p) => p.id === changing);
  const money = (n: number) => format.number(n, { style: "currency", currency: "EUR" });

  return (
    <>
      <section className={card}>
        <div className="border-b border-border px-[18px] py-3.5"><h2 className="m-0 text-[14.5px] font-semibold">{t("title")}</h2><p className="mt-0.5 text-[12.5px] text-text-3">{t("renews", { date: format.dateTime(new Date("2026-11-01"), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) })}</p></div>
        <div className="flex flex-col gap-1.5 px-[18px] py-4">
          <div className="flex justify-between text-[13px]"><span className="font-medium">{t("usage", { used: SEATS_USED, cap: current.cap })}</span><span className="text-warn">{left <= 2 ? t("seatsLeft", { count: left }) : ""}</span></div>
          <div className="h-2 overflow-hidden rounded bg-neutral-bg" role="progressbar" aria-valuenow={SEATS_USED} aria-valuemax={current.cap}><div className={cn("h-full", SEATS_USED / current.cap > 0.9 ? "bg-warn-dot" : "bg-accent")} style={{ width: `${Math.round((SEATS_USED / current.cap) * 100)}%` }} /></div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5 px-[18px] pb-[18px]">
          {PLANS.map((p) => {
            const cur = p.id === plan;
            const small = p.cap < SEATS_USED;
            const up = p.cap > current.cap;
            return (
              <div key={p.id} className={cn("flex flex-col gap-1.5 rounded-xl border-[1.5px] border-solid p-3.5", cur ? "border-accent bg-accent-soft" : "border-border bg-surface")}>
                <div className="flex items-center gap-2"><b className="text-[15px]">{tPlan(`${p.id}.name`)}</b>{cur && <span className="rounded-full bg-accent px-2 py-0.5 text-[11.5px] text-white">{t("current")}</span>}</div>
                <div className="text-[13px] text-text-2">{t("price", { price: money(p.price) })}</div>
                <div className="text-[12.5px] text-text-3">{t("capacity", { count: p.cap })}</div>
                <Button className="mt-1.5" disabled={cur || small} onClick={() => setChanging(p.id)}>{cur ? t("yourPlan") : small ? t("tooMany") : t(up ? "upgrade" : "downgrade")}</Button>
              </div>
            );
          })}
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
              <span className="text-text-2">{format.dateTime(new Date(inv.date), { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</span>
              <span className="font-mono">{money(inv.amount)}</span>
              <span><span className="rounded-md bg-ok-bg px-2 py-0.5 text-[12px] font-medium text-ok">{t("paid")}</span></span>
              <button onClick={() => toast(t("downloading", { id: inv.id }))} className="border-0 bg-transparent p-0 text-right text-[12.5px] text-accent">{t("download")}</button>
            </div>
          ))}
        </div></div>
      </section>

      {card2 && <CardModal onClose={() => setCard(false)} />}
      <ConfirmDialog
        open={changing !== null}
        title={t("changeTitle", { plan: target ? tPlan(`${target.id}.name`) : "", direction: target && target.cap > current.cap ? "up" : "down" })}
        message={t("changeMessage", { price: money(target?.price ?? 0) })}
        cancelLabel={t("cancel")}
        okLabel={t("confirm")}
        onCancel={() => setChanging(null)}
        onOk={() => { if (target) { setPlan(target.id); toast(t("changed", { plan: tPlan(`${target.id}.name`) })); } setChanging(null); }}
      />
    </>
  );
}
