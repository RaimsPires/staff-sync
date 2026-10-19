"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { controlClass } from "@/components/ui/text-field";
import type { ScopeKind } from "@/types/auth";
import { cn } from "@/lib/utils";
import { activeAdmins, useUsers } from "@/store/users";
import type { DashboardUser } from "@/types/users";
import { useRoleText, useScopeOptions } from "./model";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export type InviteTarget = { mode: "new" } | { mode: "edit"; user: DashboardUser } | null;

interface Draft { email: string; roleId: string; kind: ScopeKind; ids: string[]; message: string; tried: boolean }

const initial = (target: NonNullable<InviteTarget>): Draft =>
  target.mode === "edit"
    ? { email: "", roleId: target.user.roleId, kind: target.user.scope.kind, ids: [...target.user.scope.ids], message: "", tried: false }
    : { email: "", roleId: "site", kind: "site", ids: [], message: "", tried: false };

/** Invite a new dashboard user, or change an existing user's role and scope. */
export function InviteDialog({ target, onClose }: { target: InviteTarget; onClose: () => void }) {
  // Remount per target so the draft always starts fresh.
  return target ? <InviteForm key={target.mode === "edit" ? target.user.id : "new"} target={target} onClose={onClose} /> : null;
}

function InviteForm({ target, onClose }: { target: NonNullable<InviteTarget>; onClose: () => void }) {
  const t = useTranslations("Users.invite");
  const tScope = useTranslations("Users.scopeKinds");
  const toast = useToast();
  const roleText = useRoleText();
  const scopeOptions = useScopeOptions();
  const { users, roles, invite, assign } = useUsers();
  const [d, setD] = useState<Draft>(() => initial(target));
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));

  const isNew = target.mode === "new";
  const role = roles.find((r) => r.id === d.roleId);
  // A role fixes its scope kind unless it allows any.
  const needKind: ScopeKind = !role ? "company" : role.scope === "any" ? d.kind : role.scope;
  const options = needKind === "branch" ? scopeOptions.branches : needKind === "site" ? scopeOptions.sites : [];

  const email = d.email.trim();
  const taken = isNew && users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  const emailError = !d.tried || !isNew ? "" : !email ? t("errors.emailRequired") : !EMAIL.test(email) ? t("errors.emailInvalid") : taken ? t("errors.taken") : "";
  const scopeError = d.tried && needKind !== "company" && d.ids.length === 0 ? t(needKind === "branch" ? "errors.pickBranch" : "errors.pickSite") : "";

  const pickRole = (id: string) => {
    const r = roles.find((x) => x.id === id);
    set({ roleId: id, kind: r ? (r.scope === "any" ? (d.kind === "company" ? "branch" : d.kind) : r.scope) : d.kind, ids: [] });
  };

  const submit = () => {
    const bad = (isNew && (!email || !EMAIL.test(email) || taken)) || (needKind !== "company" && d.ids.length === 0);
    if (bad || !role) return set({ tried: true });
    const scope = { kind: needKind, ids: needKind === "company" ? [] : d.ids };
    if (isNew) {
      invite(email, role.id, scope);
      toast(t("toasts.sent", { email }));
    } else if (target.mode === "edit") {
      if (target.user.roleId === "admin" && role.id !== "admin" && activeAdmins(users).length <= 1) return toast(t("toasts.keepAdmin"), "bad");
      assign(target.user.id, role.id, scope);
      toast(t("toasts.changed", { name: target.user.name, role: roleText.name(role) }));
    }
    onClose();
  };

  const kinds: ScopeKind[] = role?.scope === "any" ? ["company", "branch", "site"] : [];

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? t("titleNew") : t("titleEdit")}
      className="max-w-[520px]"
      footer={<><Button onClick={onClose}>{t("cancel")}</Button><Button variant="primary" onClick={submit}>{isNew ? t("send") : t("save")}</Button></>}
    >
      <div className="flex flex-col gap-3.5">
        {isNew ? (
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">
            {t("email")}
            <input type="email" value={d.email} onChange={(e) => set({ email: e.target.value })} placeholder={t("emailPlaceholder")} aria-invalid={!!emailError} autoFocus className={controlClass(!!emailError)} />
            {emailError && <span className="text-[12px] font-normal text-bad">{emailError}</span>}
          </label>
        ) : target.mode === "edit" && (
          <div className="text-[13.5px]"><b className="font-semibold">{target.user.name}</b> <span className="text-text-3">· {target.user.email}</span></div>
        )}

        <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
          <legend className="mb-1.5 p-0 text-[12.5px] font-medium text-text-2">{t("role")}</legend>
          {roles.map((r) => {
            const on = d.roleId === r.id;
            return (
              <label key={r.id} className={cn("flex cursor-pointer items-start gap-2.5 rounded-[10px] border-[1.5px] border-solid px-3 py-[9px]", on ? "border-accent bg-accent-soft" : "border-border bg-surface")}>
                <input type="radio" name="invite-role" checked={on} onChange={() => pickRole(r.id)} className="mt-0.5 size-4 accent-accent" />
                <span><span className="text-[13.5px] font-medium">{roleText.name(r)}</span><span className="block text-[12px] font-normal text-text-3">{roleText.desc(r)}</span></span>
              </label>
            );
          })}
        </fieldset>

        <div className="flex flex-col gap-2 text-[12.5px] font-medium text-text-2">
          {t("scope")}
          {needKind === "company" && kinds.length === 0 ? (
            <div className="rounded-[10px] border border-border bg-surface-2 px-3 py-2.5 font-normal">{t("fixedCompany")}</div>
          ) : (
            <>
              {kinds.length > 0 && (
                <div role="group" aria-label={t("scope")} className="flex self-start overflow-hidden rounded-[9px] border border-border-strong">
                  {kinds.map((k) => <button key={k} type="button" aria-pressed={d.kind === k} onClick={() => set({ kind: k, ids: [] })} className={cn("h-8 border-0 px-[13px] text-[12.5px]", d.kind === k ? "bg-accent text-white" : "bg-surface text-text-2")}>{tScope(k)}</button>)}
                </div>
              )}
              {options.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {options.map((o) => {
                    const on = d.ids.includes(o.id);
                    return <button key={o.id} type="button" aria-pressed={on} onClick={() => set({ ids: on ? d.ids.filter((x) => x !== o.id) : [...d.ids, o.id] })} className={cn("h-[30px] rounded-full border border-solid px-[11px] text-[12.5px] font-medium", on ? "border-accent bg-accent text-white" : "border-border-strong bg-surface text-text-2")}>{o.name}</button>;
                  })}
                </div>
              )}
            </>
          )}
          {scopeError && <span className="text-[12px] font-normal text-bad">{scopeError}</span>}
        </div>

        {isNew && (
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">
            <span>{t("message")} <span className="font-normal text-text-3">{t("optional")}</span></span>
            <textarea rows={3} value={d.message} onChange={(e) => set({ message: e.target.value })} placeholder={t("messagePlaceholder")} className="resize-y rounded-[9px] border border-solid border-border-strong bg-surface px-2.5 py-[9px] text-[13px] font-normal text-text outline-none focus:border-accent" />
          </label>
        )}
      </div>
    </Modal>
  );
}
