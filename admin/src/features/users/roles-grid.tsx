"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { ALL_PERMISSIONS } from "@/lib/access-catalog";
import { cn } from "@/lib/utils";
import { usersOfRole, useUsers } from "@/store/users";
import type { AccessRole } from "@/types/users";
import { roleTone, useRoleText } from "./model";

const btn = "h-[30px] rounded-lg border border-solid border-border-strong bg-surface px-3 text-[12.5px] text-text";

interface Props {
  onOpen: (mode: "view" | "edit" | "duplicate", role: AccessRole) => void;
  onShowUsers: (roleId: string) => void;
}

export function RolesGrid({ onOpen, onShowUsers }: Props) {
  const t = useTranslations("Users.roles");
  const tScope = useTranslations("Users.scopes");
  const toast = useToast();
  const roleText = useRoleText();
  const { roles, users, deleteRole } = useUsers();
  const [asking, setAsking] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-3">
      {roles.map((r) => {
        const n = usersOfRole(users, r.id);
        const ask = asking === r.id;
        return (
          <article key={r.id} className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface px-[18px] py-4 shadow-card">
            <div className="flex items-center gap-2">
              <span className={cn("rounded-full px-2.5 py-[3px] text-[12.5px] font-semibold", roleTone(roles, r.id))}>{roleText.name(r)}</span>
              <span className="text-[11.5px] text-text-3">{r.builtIn ? t("default") : t("custom")}</span>
              <div className="flex-1" />
              <span className="text-[12.5px] text-text-2">{t("userCount", { count: n })}</span>
            </div>
            <p className="m-0 min-h-9 text-[13px] leading-[1.45] text-text-2">{roleText.desc(r)}</p>
            <div className="text-[12px] text-text-3">{t("summary", { count: r.perms.length, total: ALL_PERMISSIONS.length, scope: tScope(`${r.scopeKey}.name`) })}</div>
            {ask && n > 0 && (
              <div className="rounded-lg bg-warn-bg px-2.5 py-2 text-[12.5px] text-warn">
                {t("blocked", { count: n })}
                <div className="mt-1.5"><button onClick={() => { setAsking(null); onShowUsers(r.id); }} className="border-0 bg-transparent p-0 text-[12.5px] text-accent underline">{t("showUsers")}</button></div>
              </div>
            )}
            {ask && n === 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-bad-bg px-2.5 py-2 text-[12.5px] text-bad">
                {t("confirmDelete", { name: roleText.name(r) })}
                <div className="flex-1" />
                <button onClick={() => { deleteRole(r.id); setAsking(null); toast(t("deleted", { name: roleText.name(r) })); }} className="h-[26px] rounded-[7px] border-0 bg-bad-dot px-2.5 text-[12.5px] text-white">{t("delete")}</button>
                <button onClick={() => setAsking(null)} className="h-[26px] border-0 bg-transparent px-2 text-[12.5px] text-bad">{t("cancel")}</button>
              </div>
            )}
            <div className="mt-0.5 flex gap-1.5">
              <button onClick={() => onOpen(r.builtIn ? "view" : "edit", r)} className={btn}>{r.builtIn ? t("view") : t("edit")}</button>
              <button onClick={() => onOpen("duplicate", r)} className={btn}>{t("duplicate")}</button>
              {!r.builtIn && <button onClick={() => setAsking(ask ? null : r.id)} className={cn(btn, "text-bad")}>{t("delete")}</button>}
            </div>
          </article>
        );
      })}
    </div>
  );
}
