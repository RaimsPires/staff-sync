"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Avatar } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { useAccess } from "@/store/use-access";
import { useScopeText } from "@/features/users/model";
import { NotificationsTab } from "./notifications-tab";
import { PersonalTab, useProfileIdentity } from "./personal-tab";
import { SecurityTab } from "./security-tab";

export type ProfileTab = "profile" | "security" | "notif";

export function ProfileScreen({ initialTab = "profile" }: { initialTab?: ProfileTab }) {
  const t = useTranslations("Profile");
  const tRoles = useTranslations("Users.defaultRoles");
  const toast = useToast();
  const { role, scope } = useAccess();
  const scopeText = useScopeText();
  const who = useProfileIdentity();
  const [tab, setTab] = useState<ProfileTab>(initialTab);

  return (
    <div className="flex max-w-[900px] flex-col gap-4">
      <div className="flex flex-wrap items-center gap-[18px] rounded-[14px] border border-border bg-surface p-5 shadow-card">
        <Avatar name={who.name} size={72} />
        <div className="min-w-0 flex-[1_1_260px]">
          <h1 className="m-0 text-2xl font-semibold tracking-tight">{who.name}</h1>
          <div className="mt-1.5 flex flex-wrap gap-x-3.5 gap-y-1.5 text-[13.5px] text-text-2"><span>{who.email}</span><span>{tRoles(`${role}.name`)}</span><span>{scopeText.label({ kind: scope.kind, ids: scope.id ? [scope.id] : [] })}</span></div>
        </div>
        <label className="flex h-[34px] cursor-pointer items-center rounded-[9px] border border-solid border-border-strong bg-surface px-[13px] text-[13px] font-medium text-text">
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.length) toast(t("photoUpdated")); }} />
          {t("changePhoto")}
        </label>
      </div>
      <Tabs value={tab} onChange={setTab} items={[{ id: "profile", label: t("tabs.profile") }, { id: "security", label: t("tabs.security") }, { id: "notif", label: t("tabs.notifications") }]} />
      <div className="flex flex-col gap-3.5">
        {tab === "profile" && <PersonalTab />}
        {tab === "security" && <SecurityTab />}
        {tab === "notif" && <NotificationsTab />}
      </div>
    </div>
  );
}
