"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { activeAdmins, useUsers } from "@/store/users";
import type { DashboardUser } from "@/types/users";
import { InviteDialog, type InviteTarget } from "./invite-dialog";
import { RolesGrid } from "./roles-grid";
import { UsersTable } from "./users-table";

export function UsersScreen({ initialTab = "users" }: { initialTab?: "users" | "roles" }) {
  const router = useRouter();
  const t = useTranslations("Users");
  const toast = useToast();
  const { users, roles, setStatus } = useUsers();
  const [tab, setTab] = useState<"users" | "roles">(initialTab);
  const [roleFilter, setRoleFilter] = useState("all");
  const [invite, setInvite] = useState<InviteTarget>(null);
  const [revoking, setRevoking] = useState<DashboardUser | null>(null);

  const admins = activeAdmins(users, roles).length;
  const sub = tab === "users"
    ? t("summary.users", { active: users.filter((u) => u.status === "active").length, invited: users.filter((u) => u.status === "invited").length, admins })
    : t("summary.roles", { count: roles.length, custom: roles.filter((r) => !r.builtIn).length });

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="m-0 text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <div className="mt-1 text-[13.5px] text-text-2">{sub}</div>
        </div>
        <Button variant="primary" onClick={() => (tab === "users" ? setInvite({ mode: "new" }) : router.push("/users/roles/new"))}>{tab === "users" ? t("invite.open") : t("roles.create")}</Button>
      </div>

      <Tabs value={tab} onChange={setTab} items={[{ id: "users", label: `${t("tabs.users")} · ${users.length}` }, { id: "roles", label: `${t("tabs.roles")} · ${roles.length}` }]} />

      {tab === "users" ? (
        <UsersTable roleFilter={roleFilter} onRoleFilter={setRoleFilter} onChangeRole={(u) => setInvite({ mode: "edit", user: u })} onRevoke={setRevoking} />
      ) : (
        <RolesGrid onOpen={(mode, role) => router.push(mode === "duplicate" ? `/users/roles/${role.id}?mode=duplicate` : `/users/roles/${role.id}`)} onShowUsers={(id) => { setRoleFilter(id); setTab("users"); }} />
      )}

      <InviteDialog target={invite} onClose={() => setInvite(null)} />
      <ConfirmDialog
        open={revoking !== null}
        title={t("revoke.title", { name: revoking?.name ?? "" })}
        message={t("revoke.message")}
        cancelLabel={t("revoke.cancel")}
        okLabel={t("revoke.confirm")}
        danger
        onCancel={() => setRevoking(null)}
        onOk={() => { if (revoking) { setStatus(revoking.id, "revoked"); toast(t("toasts.revoked", { name: revoking.name })); } setRevoking(null); }}
      />
    </div>
  );
}
