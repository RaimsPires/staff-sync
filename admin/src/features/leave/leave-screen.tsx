"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import { LeaveBalances } from "./leave-balances";
import { LeaveCalendar } from "./leave-calendar";
import { LeaveDrawer } from "./leave-drawer";
import { LeaveInbox } from "./leave-inbox";

export type LeaveView = "requests" | "calendar" | "balances";
export type LeaveTab = "pending" | "approved" | "rejected" | "cancelled" | "all";

export function LeaveScreen({ initialView = "requests", initialTab = "pending" }: { initialView?: LeaveView; initialTab?: LeaveTab }) {
  const t = useTranslations("Leave");
  const [view, setView] = useState<LeaveView>(initialView);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="m-0 text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-[13.5px] text-text-2">{t("subtitle")}</p>
      </div>
      <Tabs
        value={view}
        onChange={setView}
        items={[
          { id: "requests", label: t("views.requests") },
          { id: "calendar", label: t("views.calendar") },
          { id: "balances", label: t("views.balances") },
        ]}
      />
      {view === "requests" && <LeaveInbox initialTab={initialTab} onOpen={setOpenId} />}
      {view === "calendar" && <LeaveCalendar onOpen={setOpenId} />}
      {view === "balances" && <LeaveBalances />}
      <LeaveDrawer requestId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
