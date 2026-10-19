"use client";

import { Check, ChevronLeft, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useOrg } from "@/lib/org";
import { ALL_PERMISSIONS, CAN_KEYS, CANT_KEYS, MODULES, NAV_RULES, PERM_ACTIONS, ROLE_SCOPES, type ModuleKey } from "@/lib/access-catalog";
import { cn } from "@/lib/utils";
import { useUsers, usersOfRole } from "@/store/users";
import type { AccessRole, RoleDraft, RoleScopeKey } from "@/types/users";
import { useRoleText, useScopeOptions } from "./model";

export type EditorMode = "create" | "edit" | "duplicate" | "view";

const section = "flex flex-col gap-3.5 rounded-xl border border-border bg-surface px-[18px] py-4 shadow-card";
const signature = (d: Pick<RoleDraft, "name" | "desc" | "perms" | "scopeKey" | "scopeIds">) =>
  JSON.stringify([d.name, d.desc, [...d.perms].sort(), d.scopeKey, [...d.scopeIds].sort()]);

function Box({ state, size = 18, onClick, label, disabled }: { state: "on" | "some" | "off"; size?: number; onClick?: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button" role="checkbox" aria-checked={state === "some" ? "mixed" : state === "on"} aria-label={label} disabled={disabled} onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className={cn("grid place-items-center rounded-[5px] border-[1.5px] border-solid p-0 text-white disabled:cursor-default",
        state === "on" ? "border-accent bg-accent" : state === "some" ? "border-accent bg-accent-soft text-accent" : "border-border-strong bg-transparent text-transparent")}
      style={{ width: size, height: size }}
    >
      {state === "some" ? <Minus size={size - 6} strokeWidth={3.4} /> : <Check size={size - 6} strokeWidth={3.4} />}
    </button>
  );
}

interface Props {
  role: AccessRole | null;
  mode: EditorMode;
  onSave: (draft: RoleDraft) => void;
  onCancel: () => void;
  onDuplicate: () => void;
}

export function RoleEditor({ role, mode, onSave, onCancel, onDuplicate }: Props) {
  const org = useOrg();
  const t = useTranslations("Users.editor");
  const tMod = useTranslations("Users.modules");
  const tAct = useTranslations("Users.editor.actions");
  const tScope = useTranslations("Users.scopes");
  const tNav = useTranslations("Users.editor.nav");
  const tCan = useTranslations("Users.editor.can");
  const roleText = useRoleText();
  const scopeOptions = useScopeOptions();
  const { roles, users } = useUsers();
  const locked = mode === "view";

  const [draft, setDraft] = useState<RoleDraft>(() => ({
    id: mode === "edit" && role ? role.id : null,
    name: role ? (mode === "duplicate" ? t("copyName", { name: roleText.name(role) }) : roleText.name(role)) : "",
    desc: role ? roleText.desc(role) : "",
    perms: role ? [...role.perms] : ["att.view"],
    scopeKey: role?.scopeKey ?? "ownBranch",
    scopeIds: role ? [...role.scopeIds] : [],
  }));
  // What "unchanged" means: nothing for a new role, the loaded values for an edit.
  const [base] = useState(() => (mode === "create" || mode === "duplicate" ? "" : signature(draft)));
  const [tried, setTried] = useState(false);
  const [discard, setDiscard] = useState(false);
  const dirty = !locked && signature(draft) !== base;

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const set = (p: Partial<RoleDraft>) => !locked && setDraft((d) => ({ ...d, ...p }));
  const has = (k: string) => draft.perms.includes(k);

  const toggle = (m: ModuleKey, a: string) => {
    if (locked) return;
    setDraft((d) => {
      const key = `${m}.${a}`;
      const mod = MODULES.find((x) => x.key === m)!;
      let perms = [...d.perms];
      if (perms.includes(key)) {
        perms = perms.filter((x) => x !== key);
        if (a === "view") perms = perms.filter((x) => !x.startsWith(`${m}.`));
      } else {
        perms.push(key);
        const actions: readonly string[] = mod.actions;
        if (a !== "view" && actions.includes("view") && !perms.includes(`${m}.view`)) perms.push(`${m}.view`);
      }
      return { ...d, perms };
    });
  };
  const toggleRow = (m: ModuleKey) => {
    const keys = MODULES.find((x) => x.key === m)!.actions.map((a) => `${m}.${a}`);
    const all = keys.every((k) => has(k));
    set({ perms: all ? draft.perms.filter((x) => !keys.includes(x)) : [...new Set([...draft.perms, ...keys])] });
  };

  const errors = useMemo(() => {
    const e: { name?: string; scope?: string; perms?: string } = {};
    const name = draft.name.trim();
    if (!name) e.name = t("errors.nameRequired");
    else if (roles.some((r) => r.id !== draft.id && roleText.name(r).toLowerCase() === name.toLowerCase())) e.name = t("errors.nameTaken");
    if ((draft.scopeKey === "branches" || draft.scopeKey === "sites") && draft.scopeIds.length === 0) e.scope = t(draft.scopeKey === "branches" ? "errors.pickBranch" : "errors.pickSite");
    if (draft.perms.length === 0) e.perms = t("errors.noPerms");
    return e;
  }, [draft, roles, roleText, t]);
  const shown = tried ? errors : {};
  const firstError = shown.name ?? shown.scope ?? shown.perms;

  const save = () => {
    if (Object.keys(errors).length) return setTried(true);
    onSave({ ...draft, name: draft.name.trim(), desc: draft.desc.trim() || t("customDesc") });
  };
  const tryCancel = () => (dirty ? setDiscard(true) : onCancel());

  const isBranches = draft.scopeKey === "branches";
  const showTree = isBranches || draft.scopeKey === "sites";
  const userCount = role && mode === "edit" ? usersOfRole(users, role.id) : 0;
  const total = MODULES.reduce((n, m) => n + m.actions.length, 0);
  const allIds = isBranches ? org.branches.map((b) => b.id) : org.branches.flatMap((b) => b.siteIds);

  const seeScope = (() => {
    switch (draft.scopeKey) {
      case "branches": return draft.scopeIds.length ? t("see.branches", { names: draft.scopeIds.map(scopeOptions.branchName).join(", ") }) : t("see.noBranch");
      case "sites": return draft.scopeIds.length ? t("see.sites", { names: draft.scopeIds.map((id) => org.siteById(id).name).join(", ") }) : t("see.noSite");
      default: return t(`see.${draft.scopeKey}`);
    }
  })();
  const can = CAN_KEYS.filter((k) => has(k));
  const cant = [...CANT_KEYS.filter((k) => !has(k)).map((k) => k as string), ...(draft.perms.some((p) => p.endsWith(".delete")) ? [] : ["delete"])];
  const title = mode === "create" ? t("titles.create") : mode === "duplicate" ? t("titles.duplicate") : mode === "view" ? (role ? roleText.name(role) : "") : t("titles.edit");
  const status = locked ? t("status.readOnly") : dirty ? t("status.unsaved") : mode === "create" || mode === "duplicate" ? t("status.notSaved") : t("status.saved");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={tryCancel} className="flex h-8 items-center gap-1.5 rounded-lg border-0 bg-transparent pl-1.5 pr-2.5 text-[13px] text-text-2 hover:bg-hover"><ChevronLeft size={16} />{t("back")}</button>
        <div className="min-w-[200px] flex-1">
          <h2 className="m-0 text-[20px] font-semibold tracking-tight">{title}</h2>
          <div className={cn("mt-0.5 flex items-center gap-1.5 text-[12.5px]", dirty ? "text-warn" : "text-text-3")}>
            <span className={cn("size-[7px] rounded-full", dirty ? "bg-warn-dot" : "bg-border-strong")} />{status}
          </div>
        </div>
        {locked && <Button variant="primary" onClick={onDuplicate}>{t("duplicateToCustomise")}</Button>}
        <Button onClick={tryCancel}>{locked ? t("close") : t("cancel")}</Button>
        {!locked && <Button variant="primary" onClick={save} className={cn(tried && firstError && "opacity-60")}>{mode === "edit" ? t("saveChanges") : t("createRole")}</Button>}
      </div>

      {locked && <div className="rounded-[10px] bg-info-bg px-3.5 py-[11px] text-[13px] text-info">{t("readOnlyNote")}</div>}
      {firstError && <div role="alert" className="rounded-[10px] bg-bad-bg px-3.5 py-[11px] text-[13px] font-medium text-bad">{firstError}</div>}

      <div className="flex flex-wrap items-start gap-4">
        <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-4">
          <section className={section}>
            <h3 className="m-0 text-[14.5px] font-semibold">{t("details")}</h3>
            <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">
              {t("name")}
              <input value={draft.name} onChange={(e) => set({ name: e.target.value })} disabled={locked} aria-invalid={!!shown.name} className={cn("h-9 rounded-[9px] border border-solid bg-surface px-[11px] text-[13.5px] text-text outline-none focus:border-accent disabled:bg-surface-2", shown.name ? "border-bad-dot" : "border-border-strong")} />
              {shown.name && <span className="text-[12px] font-normal text-bad">{shown.name}</span>}
            </label>
            <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">
              {t("description")}
              <textarea rows={2} value={draft.desc} onChange={(e) => set({ desc: e.target.value })} disabled={locked} placeholder={t("descriptionPlaceholder")} className="resize-y rounded-[9px] border border-solid border-border-strong bg-surface px-[11px] py-[9px] text-[13px] font-normal text-text outline-none focus:border-accent disabled:bg-surface-2" />
            </label>
          </section>

          <section className={cn(section, "gap-3")}>
            <div><h3 className="m-0 text-[14.5px] font-semibold">{t("dataScope")}</h3><p className="mt-0.5 text-[12.5px] text-text-3">{t("dataScopeHint")}</p></div>
            <fieldset disabled={locked} className="m-0 grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-2 border-0 p-0">
              {ROLE_SCOPES.map((k: RoleScopeKey) => {
                const on = draft.scopeKey === k;
                return (
                  <label key={k} className={cn("flex items-start gap-2.5 rounded-[10px] border-[1.5px] border-solid px-3 py-2.5", on ? "border-accent bg-accent-soft" : "border-border bg-surface", locked ? "cursor-default" : "cursor-pointer")}>
                    <input type="radio" name="role-scope" checked={on} onChange={() => set({ scopeKey: k, scopeIds: [] })} className="mt-0.5 size-4 accent-accent" />
                    <span><span className="block text-[13.5px] font-medium">{tScope(`${k}.name`)}</span><span className="block text-[12px] text-text-3">{tScope(`${k}.desc`)}</span></span>
                  </label>
                );
              })}
            </fieldset>
            {showTree && (
              <div className={cn("overflow-hidden rounded-[10px] border border-solid", shown.scope ? "border-bad-dot" : "border-border")}>
                <div className="flex items-center gap-2.5 border-b border-border bg-surface-2 px-3 py-2 text-[12.5px] text-text-2">
                  {t(isBranches ? "treeHintBranches" : "treeHintSites")}
                  <div className="flex-1" />
                  {!locked && <><button onClick={() => set({ scopeIds: allIds })} className="border-0 bg-transparent text-[12.5px] text-accent">{t("selectAll")}</button><button onClick={() => set({ scopeIds: [] })} className="border-0 bg-transparent text-[12.5px] text-accent">{t("clear")}</button></>}
                </div>
                {org.branches.map((b, i) => {
                  const all = isBranches ? draft.scopeIds.includes(b.id) : b.siteIds.every((k) => draft.scopeIds.includes(k));
                  const some = !isBranches && b.siteIds.some((k) => draft.scopeIds.includes(k));
                  const flip = () => set(isBranches
                    ? { scopeIds: all ? draft.scopeIds.filter((x) => x !== b.id) : [...draft.scopeIds, b.id] }
                    : { scopeIds: all ? draft.scopeIds.filter((x) => !b.siteIds.includes(x)) : [...new Set([...draft.scopeIds, ...b.siteIds])] });
                  return (
                    <div key={b.id} className={i ? "border-t border-border" : ""}>
                      <div onClick={flip} className={cn("flex items-center gap-2.5 px-3 py-[9px] hover:bg-hover", locked ? "cursor-default" : "cursor-pointer")}>
                        <Box state={all ? "on" : some ? "some" : "off"} size={17} label={b.name} disabled={locked} onClick={flip} />
                        <span className="text-[13.5px] font-semibold">{b.name}</span>
                        <span className="text-[12px] text-text-3">{t("siteCount", { count: b.siteIds.length })}</span>
                      </div>
                      {b.siteIds.map((k) => {
                        const on = isBranches ? draft.scopeIds.includes(b.id) : draft.scopeIds.includes(k);
                        const flipSite = () => !isBranches && set({ scopeIds: on ? draft.scopeIds.filter((x) => x !== k) : [...draft.scopeIds, k] });
                        return (
                          <div key={k} onClick={flipSite} className={cn("flex items-center gap-2.5 py-[7px] pl-10 pr-3 hover:bg-hover", locked || isBranches ? "cursor-default opacity-65" : "cursor-pointer")}>
                            <Box state={on ? "on" : "off"} size={16} label={org.siteById(k).name} disabled={locked || isBranches} onClick={flipSite} />
                            <span className="text-[13px]">{org.siteById(k).name}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
            {shown.scope && <span className="text-[12px] text-bad">{shown.scope}</span>}
            {draft.scopeKey !== "company" && ["usr.view", "set.view", "bill.view"].some(has) && <div className="rounded-lg bg-warn-bg px-2.5 py-2 text-[12.5px] text-warn">{t("companyWideNote")}</div>}
          </section>

          <section className="overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
            <div className="min-w-[640px]">
              <div className="flex items-center gap-3 border-b border-border px-[18px] py-3.5">
                <div className="flex-1"><h3 className="m-0 text-[14.5px] font-semibold">{t("permissions")}</h3><p className="mt-0.5 text-[12.5px] text-text-3">{t("enabled", { count: draft.perms.length, total })}</p></div>
                {!locked && <><button onClick={() => set({ perms: ALL_PERMISSIONS })} className="border-0 bg-transparent text-[12.5px] text-accent">{t("selectAll")}</button><button onClick={() => set({ perms: [] })} className="border-0 bg-transparent text-[12.5px] text-accent">{t("clear")}</button></>}
              </div>
              <div className="grid h-9 grid-cols-[minmax(180px,1.6fr)_54px_repeat(5,66px)] items-center gap-1 border-b border-border bg-surface-2 px-[18px] text-[11.5px] font-semibold uppercase tracking-[.04em] text-text-3">
                <div>{t("module")}</div><div className="text-center">{t("all")}</div>
                {PERM_ACTIONS.map((a) => <div key={a} className="text-center">{tAct(a)}</div>)}
              </div>
              {MODULES.map((m) => {
                const keys = m.actions.map((a) => `${m.key}.${a}`);
                const n = keys.filter(has).length;
                return (
                  <div key={m.key} className="grid min-h-12 grid-cols-[minmax(180px,1.6fr)_54px_repeat(5,66px)] items-center gap-1 border-b border-border px-[18px] last:border-b-0 hover:bg-hover">
                    <div className="py-1.5"><div className="text-[13.5px] font-medium">{tMod(`${m.key}.name`)}</div><div className="text-[12px] text-text-3">{tMod(`${m.key}.sub`)}</div></div>
                    <div className="grid place-items-center"><Box state={n === keys.length ? "on" : n ? "some" : "off"} label={t("selectModule", { name: tMod(`${m.key}.name`) })} disabled={locked} onClick={() => toggleRow(m.key)} /></div>
                    {PERM_ACTIONS.map((a) => {
                      const applies = (m.actions as readonly string[]).includes(a);
                      return (
                        <div key={a} className="grid place-items-center" title={applies ? (m.key === "exp" ? t("canExport") : `${tAct(a)} · ${tMod(`${m.key}.name`)}`) : undefined}>
                          {applies ? <Box state={has(`${m.key}.${a}`) ? "on" : "off"} label={`${tAct(a)} · ${tMod(`${m.key}.name`)}`} disabled={locked} onClick={() => toggle(m.key, a)} /> : <span aria-hidden className="text-[14px] text-border-strong">–</span>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="sticky top-3 flex w-[330px] max-w-full flex-[0_1_330px] flex-col gap-3 rounded-xl border border-border bg-surface px-[18px] py-4 shadow-card">
          <h3 className="m-0 text-[14.5px] font-semibold">{t("preview")}</h3>
          <div><div className="mb-0.5 text-[12px] text-text-3">{t("canSee")}</div><div className="text-[13.5px] font-medium leading-[1.4]">{seeScope}</div></div>
          <div>
            <div className="mb-1.5 text-[12px] text-text-3">{t("navigation")}</div>
            <div className="rounded-[10px] border border-border bg-surface-2 p-1.5">
              {NAV_RULES.map((n) => {
                const ok = n.allowed(has);
                return <div key={n.key} className={cn("flex h-[30px] items-center gap-[9px] rounded-[7px] px-[9px] text-[13px]", ok ? "text-text" : "text-text-3 line-through")}><span className={cn("size-[7px] rounded-[2px]", ok ? "bg-accent" : "bg-border-strong")} />{tNav(n.key)}</div>;
              })}
            </div>
          </div>
          {can.length > 0 && <div><div className="mb-1.5 text-[12px] text-text-3">{t("theyCan")}</div><ul className="m-0 flex list-none flex-col gap-[5px] p-0">{can.map((k) => <li key={k} className="flex gap-2 text-[12.5px]"><span className="font-bold text-ok">✓</span>{tCan(k)}</li>)}</ul></div>}
          {cant.length > 0 && <div><div className="mb-1.5 text-[12px] text-text-3">{t("theyCant")}</div><ul className="m-0 flex list-none flex-col gap-[5px] p-0">{cant.map((k) => <li key={k} className="flex gap-2 text-[12.5px] text-text-2"><span className="font-bold text-bad">×</span>{k === "delete" ? t("cantDelete") : tCan(`not.${k}`)}</li>)}</ul></div>}
          {userCount > 0 && <div className="border-t border-border pt-2.5 text-[12.5px] text-text-2">{t("usersAffected", { count: userCount })}</div>}
        </aside>
      </div>

      <ConfirmDialog open={discard} title={t("discard.title")} message={t("discard.message")} cancelLabel={t("discard.keep")} okLabel={t("discard.confirm")} danger onCancel={() => setDiscard(false)} onOk={() => { setDiscard(false); onCancel(); }} />
    </div>
  );
}
