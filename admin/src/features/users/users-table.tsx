"use client";

import { MoreVertical, Search } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/misc";
import { Popover } from "@/components/ui/popover";
import { useToast } from "@/components/ui/toast";
import { DEMO_TODAY } from "@/data/live";
import { cn } from "@/lib/utils";
import { activeAdmins, useUsers } from "@/store/users";
import type { DashboardUser, UserStatus } from "@/types/users";
import { roleTone, useRoleText, useScopeText } from "./model";

const STATUS_TONE: Record<UserStatus, string> = {
  active: "bg-ok-bg text-ok", invited: "bg-info-bg text-info", revoked: "bg-neutral-bg text-neutral",
};
const GRID = "grid grid-cols-[minmax(220px,1.6fr)_150px_minmax(150px,1fr)_120px_100px_36px] items-center gap-3";
const select = "h-[34px] rounded-[9px] border border-solid border-border-strong bg-surface px-2.5 text-[13px] text-text";

interface Props {
  roleFilter: string;
  onRoleFilter: (id: string) => void;
  onChangeRole: (user: DashboardUser) => void;
  onRevoke: (user: DashboardUser) => void;
}

export function UsersTable({ roleFilter, onRoleFilter, onChangeRole, onRevoke }: Props) {
  const t = useTranslations("Users");
  const tStatus = useTranslations("Users.status");
  const format = useFormatter();
  const toast = useToast();
  const roleText = useRoleText();
  const scopeText = useScopeText();
  const { users, roles, setStatus } = useUsers();
  const [query, setQuery] = useState("");
  const [status, setStatusFilter] = useState<"all" | UserStatus>("all");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => (roleFilter === "all" || u.roleId === roleFilter) && (status === "all" || u.status === status) && (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)));
  }, [users, query, roleFilter, status]);

  const lastActive = (u: DashboardUser) => {
    if (u.me) return t("lastActive.now");
    if (!u.lastActive) return "—";
    const d = new Date(u.lastActive);
    const day = d.getDate();
    if (d.getMonth() === 9 && day === DEMO_TODAY) return t("lastActive.today", { time: format.dateTime(d, { hour: "2-digit", minute: "2-digit", hour12: false }) });
    if (d.getMonth() === 9 && day === DEMO_TODAY - 1) return t("lastActive.yesterday");
    return format.dateTime(d, { month: "short", day: "numeric" });
  };

  const onlyAdmin = activeAdmins(users).length <= 1;

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-[34px] max-w-[300px] flex-[1_1_200px] items-center gap-2 rounded-[9px] border border-solid border-border-strong bg-surface px-[11px] text-text-3">
          <Search size={14} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} aria-label={t("search")} className="w-full border-0 bg-transparent text-[13px] text-text outline-0" />
        </label>
        <select value={roleFilter} onChange={(e) => onRoleFilter(e.target.value)} aria-label={t("filters.role")} className={select}>
          <option value="all">{t("filters.allRoles")}</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{roleText.name(r)}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatusFilter(e.target.value as typeof status)} aria-label={t("filters.status")} className={select}>
          <option value="all">{t("filters.anyStatus")}</option>
          {(["active", "invited", "revoked"] as const).map((k) => <option key={k} value={k}>{tStatus(k)}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
        <div className="min-w-[900px]">
          <div className={cn(GRID, "h-[38px] rounded-t-xl border-b border-border bg-surface-2 px-4 text-[11.5px] font-semibold uppercase tracking-[.04em] text-text-3")}>
            <div>{t("columns.user")}</div><div>{t("columns.role")}</div><div>{t("columns.scope")}</div><div>{t("columns.lastActive")}</div><div>{t("columns.status")}</div><div />
          </div>
          {list.map((u, i) => {
            const role = roles.find((r) => r.id === u.roleId);
            const lastAdmin = u.roleId === "admin" && u.status !== "revoked" && onlyAdmin;
            const actions: { label: string; tone?: string; run: () => void }[] = [];
            if (u.status !== "revoked") actions.push({ label: t("actions.changeRole"), run: () => onChangeRole(u) });
            if (u.status === "invited") actions.push({ label: t("actions.resend"), run: () => toast(t("toasts.resent", { email: u.email })) });
            if (u.status === "revoked") actions.push({ label: t("actions.restore"), tone: "text-ok", run: () => { setStatus(u.id, "active"); toast(t("toasts.restored", { name: u.name })); } });
            else if (u.me) actions.push({ label: t("actions.cantRevokeSelf"), tone: "text-text-3", run: () => {} });
            else actions.push({ label: t("actions.revoke"), tone: "text-bad", run: () => (lastAdmin ? toast(t("toasts.keepAdmin"), "bad") : onRevoke(u)) });
            return (
              <div key={u.id} className={cn(GRID, "border-b border-border px-4 py-[11px] text-[13px] last:border-b-0 hover:bg-hover", u.status === "revoked" && "opacity-60")}>
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar name={u.name} size={34} />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{u.name}{u.me && <span className="font-normal text-text-3"> {t("you")}</span>}</div>
                    <div className="truncate text-[12px] text-text-3">{u.email}</div>
                  </div>
                </div>
                <div><span className={cn("rounded-full px-[9px] py-[3px] text-[12px] font-medium", roleTone(roles, u.roleId))}>{role ? roleText.name(role) : "—"}</span></div>
                <div className="text-text-2" title={scopeText.tip(u.scope)}>{scopeText.label(u.scope)}</div>
                <div className="text-[12.5px] text-text-3">{lastActive(u)}</div>
                <div><span className={cn("rounded-md px-2 py-[3px] text-[12px] font-medium", STATUS_TONE[u.status])}>{tStatus(u.status)}</span></div>
                <Popover
                  align="right"
                  up={i >= list.length - 2 && list.length > 3}
                  panelClassName="w-[200px] p-1.5"
                  trigger={({ open, toggle }) => (
                    <button onClick={toggle} aria-label={t("rowActions", { name: u.name })} aria-expanded={open} className={cn("grid size-[30px] place-items-center rounded-lg border-0 text-text-2", open ? "bg-hover" : "bg-transparent")}><MoreVertical size={16} /></button>
                  )}
                >
                  {(close) => actions.map((a) => (
                    <button key={a.label} onClick={() => { close(); a.run(); }} className={cn("block h-[34px] w-full rounded-lg border-0 bg-transparent px-2.5 text-left text-[13px] hover:bg-hover", a.tone ?? "text-text")}>{a.label}</button>
                  ))}
                </Popover>
              </div>
            );
          })}
          {list.length === 0 && <div className="px-4 py-11 text-center text-[13.5px] text-text-3">{t("noUsers")}</div>}
        </div>
      </div>
    </div>
  );
}
