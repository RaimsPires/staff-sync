"use client";

import { useHeadcounts } from "./use-headcounts";
import { Archive, ChevronDown, ChevronRight, Pencil, Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/overlay";
import { SelectField, TextField } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import { ADMIN_POOL, TIMEZONES_EU } from "@/data/sites";
import { cn } from "@/lib/utils";
import { useAccess } from "@/store/use-access";
import { useSites } from "@/store/sites";
import type { ManagedBranch, ManagedSite } from "@/types/site";

const card = "rounded-xl border border-border bg-surface shadow-card";
const HOLIDAYS = ["fr", "alsace", "be", "custom"] as const;
const WORKFLOWS = ["default", "single", "two", "auto"] as const;

const sum = (sites: ManagedSite[], k: "employees" | "expected" | "present") => sites.reduce((a, s) => a + s[k], 0);
const tone = (rate: number) => (rate >= 93 ? "var(--ok-dot)" : rate >= 85 ? "var(--warn-dot)" : "var(--bad-dot)");

export function BranchesScreen() {
  useHeadcounts();
  const t = useTranslations("Sites.branches");
  const toast = useToast();
  const { perms } = useAccess();
  const branches = useSites((s) => s.branches);
  const allSites = useSites((s) => s.sites);
  const restoreBranch = useSites((s) => s.restoreBranch);
  const [selectedId, setSelectedId] = useState<string | null>("lyon");
  const [query, setQuery] = useState("");
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedBranch | "new" | null>(null);
  const [retiring, setRetiring] = useState<string | null>(null);
  const canManage = perms.admin || perms.org;

  const activeSites = (b: ManagedBranch) => allSites.filter((s) => s.branchId === b.id && s.active);
  const active = branches.filter((b) => !b.archived);
  const archived = branches.filter((b) => b.archived);
  const q = query.trim().toLowerCase();
  const matches = (b: ManagedBranch) => !q || b.name.toLowerCase().includes(q) || activeSites(b).some((s) => s.name.toLowerCase().includes(q));
  const list = active.filter(matches);
  const current = branches.find((b) => b.id === selectedId) ?? null;
  const totalEmployees = active.reduce((a, b) => a + sum(activeSites(b), "employees"), 0);
  const totalSites = active.reduce((a, b) => a + activeSites(b).length, 0);

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-[13.5px] text-text-2">{t("summary", { branches: active.length, sites: totalSites, employees: totalEmployees })}</p>
      <div className="flex flex-wrap items-start gap-4">
        <aside className={cn(card, "w-[300px] max-w-full flex-none")}>
          <div className="flex items-center gap-2 border-b border-border p-3">
            <label className="flex h-9 flex-1 items-center gap-2 rounded-[9px] border border-solid border-border px-2.5 text-text-3">
              <Search size={15} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} aria-label={t("search")} className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-text outline-0" />
            </label>
            {canManage && <Button size="sm" variant="primary" onClick={() => setEditing("new")} aria-label={t("add")}><Plus size={15} /></Button>}
          </div>
          <ul className="m-0 list-none p-1.5">
            {list.map((b) => {
              const sites = activeSites(b);
              const on = selectedId === b.id;
              const shown = q ? sites.filter((s) => s.name.toLowerCase().includes(q) || b.name.toLowerCase().includes(q)) : on ? sites : [];
              return (
                <li key={b.id}>
                  <button onClick={() => setSelectedId(b.id)} aria-current={on} className={cn("flex w-full items-center gap-2.5 rounded-[10px] border-0 px-2.5 py-2.5 text-left", on ? "bg-accent-soft" : "bg-transparent hover:bg-hover")}>
                    <span className={cn("grid size-8 flex-none place-items-center rounded-lg text-[11px] font-bold", on ? "bg-accent text-white" : "bg-neutral-bg text-neutral")}>{b.code}</span>
                    <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-semibold text-text">{b.name}</span><span className="block text-[12px] text-text-3">{t("counts", { sites: sites.length, employees: sum(sites, "employees") })}</span></span>
                    <span className="size-2 flex-none rounded-full" style={{ background: tone(b.rate) }} />
                  </button>
                  {shown.map((s) => <div key={s.id} className="ml-[50px] flex justify-between py-1 pr-3 text-[12.5px] text-text-2"><span>{s.name}</span><span className="font-mono text-text-3">{s.employees}</span></div>)}
                </li>
              );
            })}
            {list.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-text-3">{t("none")}</li>}
          </ul>
          {archived.length > 0 && (
            <div className="border-t border-border p-1.5">
              <button onClick={() => setArchivedOpen((v) => !v)} aria-expanded={archivedOpen} className="flex h-9 w-full items-center gap-1.5 rounded-lg border-0 bg-transparent px-2.5 text-[12.5px] font-medium text-text-2">
                {archivedOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />} {t("archived", { count: archived.length })}
              </button>
              {archivedOpen && archived.map((b) => (
                <button key={b.id} onClick={() => setSelectedId(b.id)} className={cn("flex w-full items-center gap-2.5 rounded-lg border-0 px-2.5 py-2 text-left", selectedId === b.id ? "bg-accent-soft" : "bg-transparent hover:bg-hover")}>
                  <Archive size={14} className="text-text-3" /><span className="text-[13px] text-text-2">{b.name}</span><span className="ml-auto text-[12px] text-text-3">{b.code}</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        {current ? (
          <BranchDetail branch={current} canManage={canManage} onEdit={() => setEditing(current)} onRetire={() => setRetiring(current.id)} onRestore={() => { restoreBranch(current.id); toast(t("restored", { name: current.name })); }} />
        ) : (
          <div className={cn(card, "grid min-h-60 flex-[1_1_480px] place-items-center text-[13px] text-text-3")}>{t("selectOne")}</div>
        )}
      </div>

      <BranchFormDialog target={editing} onClose={() => setEditing(null)} onSaved={(id) => setSelectedId(id)} />
      <RetireDialog branchId={retiring} onClose={() => setRetiring(null)} onDone={(next) => setSelectedId(next)} />
    </div>
  );
}

function BranchDetail({ branch, canManage, onEdit, onRetire, onRestore }: { branch: ManagedBranch; canManage: boolean; onEdit: () => void; onRetire: () => void; onRestore: () => void }) {
  const t = useTranslations("Sites.branches");
  const allSites = useSites((s) => s.sites);
  const sites = allSites.filter((s) => s.branchId === branch.id && s.active);
  const max = Math.max(1, ...sites.map((s) => s.employees));
  const stats = [
    { k: "rate", v: branch.archived ? "—" : `${branch.rate}%`, c: branch.rate >= 93 ? "text-ok" : branch.rate >= 85 ? "text-warn" : "text-text-3", hint: t("stats.thisMonth") },
    { k: "present", v: `${sum(sites, "present")} / ${sum(sites, "expected")}`, c: "text-text", hint: t("stats.checkedIn") },
    { k: "sites", v: sites.length, c: "text-text", hint: t("stats.activeSites") },
    { k: "employees", v: sum(sites, "employees"), c: "text-text", hint: t("stats.roster") },
  ];
  return (
    <section className="flex min-w-0 flex-[1_1_480px] flex-col gap-4">
      <div className={cn(card, "flex flex-wrap items-center gap-3 px-5 py-4")}>
        <div className="min-w-0 flex-[1_1_260px]">
          <div className="flex items-center gap-2.5"><h2 className="m-0 text-[20px] font-semibold tracking-tight">{branch.name}</h2><span className="rounded-md bg-neutral-bg px-2 py-0.5 font-mono text-[12px] text-neutral">{branch.code}</span>{branch.archived && <span className="rounded-md bg-warn-bg px-2 py-0.5 text-[12px] font-medium text-warn">{t("archivedTag")}</span>}</div>
          <div className="mt-1 text-[13px] text-text-2">{branch.address}</div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 text-[12.5px] text-text-3"><span>{branch.timezone}</span><span>{t(`holidays.${branch.holidays}.name`)}</span><span>{t(`workflows.${branch.workflow}.name`)}</span></div>
        </div>
        {canManage && (
          <div className="flex gap-2">
            {branch.archived && <Button onClick={onRestore}>{t("restore")}</Button>}
            {!branch.archived && <Button onClick={onEdit}><Pencil size={14} /> {t("edit")}</Button>}
            <Button variant={branch.archived ? "danger" : "secondary"} onClick={onRetire}>{branch.archived ? t("deleteForever") : t("archiveOrDelete")}</Button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        {stats.map((s) => <div key={s.k} className={cn(card, "px-4 py-3.5")}><div className="text-[12.5px] text-text-3">{t(`stats.${s.k}`)}</div><div className={cn("mt-0.5 text-[24px] font-semibold tracking-tight", s.c)}>{s.v}</div><div className="text-[12px] text-text-3">{s.hint}</div></div>)}
      </div>
      <div className="flex flex-wrap gap-4">
        <div className={cn(card, "min-w-[260px] flex-[1_1_260px] px-[18px] py-4")}>
          <h3 className="mb-2.5 mt-0 text-[14.5px] font-semibold">{t("admins")}</h3>
          {branch.admins.length === 0 && <div className="py-3 text-[13px] text-text-3">{t("noAdmins")}</div>}
          {branch.admins.map((n, i) => <div key={n} className={cn("flex items-center gap-2.5 py-2", i > 0 && "border-t border-border")}><Avatar name={n} size={30} /><span className="text-[13.5px] font-medium">{n}</span></div>)}
        </div>
        <div className={cn(card, "min-w-[260px] flex-[1_1_260px] px-[18px] py-4")}>
          <h3 className="mb-2.5 mt-0 text-[14.5px] font-semibold">{t("headcount")}</h3>
          {sites.length === 0 && <div className="py-3 text-[13px] text-text-3">{t("noSites")}</div>}
          <div className="flex flex-col gap-2.5">
            {sites.map((s) => <div key={s.id}><div className="mb-1 flex justify-between text-[12.5px]"><span>{s.name}</span><span className="font-mono text-text-2">{s.employees}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-neutral-bg"><div className="h-full bg-accent" style={{ width: `${(s.employees / max) * 100}%` }} /></div></div>)}
          </div>
        </div>
      </div>
      <div className={cn(card, "overflow-hidden")}>
        <h3 className="m-0 border-b border-border px-[18px] py-3 text-[14.5px] font-semibold">{t("sitesTitle")}</h3>
        {sites.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-3 border-b border-border px-[18px] py-3 last:border-b-0">
            <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium">{s.name}</div><div className="text-[12px] text-text-3">{s.address}</div></div>
            <span className="font-mono text-[12.5px] text-text-2">{t("presentOf", { present: s.present, expected: s.expected })}</span>
            <span className="text-[12.5px] text-text-3">{t("employeesCount", { count: s.employees })}</span>
            <span className="flex gap-3 text-[12.5px]"><Link href={`/live?site=${s.id}`}>{t("links.live")}</Link><Link href="/employees">{t("links.employees")}</Link><Link href={`/sites/${s.id}`}>{t("links.site")}</Link></span>
          </div>
        ))}
      </div>
    </section>
  );
}

function BranchFormDialog({ target, onClose, onSaved }: { target: ManagedBranch | "new" | null; onClose: () => void; onSaved: (id: string) => void }) {
  // Remount per target so the draft always starts from the branch being edited.
  return target ? <BranchForm key={target === "new" ? "new" : target.id} target={target} onClose={onClose} onSaved={onSaved} /> : null;
}

function BranchForm({ target, onClose, onSaved }: { target: ManagedBranch | "new"; onClose: () => void; onSaved: (id: string) => void }) {
  const t = useTranslations("Sites.branches.form");
  const tb = useTranslations("Sites.branches");
  const toast = useToast();
  const branches = useSites((s) => s.branches);
  const saveBranch = useSites((s) => s.saveBranch);
  const isNew = target === "new";
  const [d, setD] = useState<ManagedBranch>(() => (target === "new" ? { id: "", name: "", code: "", address: "", timezone: "Europe/Paris", admins: [], holidays: "fr", workflow: "default", rate: 0, archived: false } : { ...target, admins: [...target.admins] }));
  const [tried, setTried] = useState(false);
  const others = branches.filter((b) => b.id !== d.id);
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!d.name.trim()) e.name = "nameRequired"; else if (others.some((b) => b.name.toLowerCase() === d.name.trim().toLowerCase())) e.name = "nameExists";
    if (!d.code.trim()) e.code = "codeRequired"; else if (d.code.trim().length < 2) e.code = "codeShort"; else if (others.some((b) => b.code === d.code.trim())) e.code = "codeExists";
    if (!d.address.trim()) e.address = "addressRequired";
    return e;
  }, [d, others]);
  const err = (k: string) => (tried && errors[k] ? t(`errors.${errors[k]}`) : undefined);

  const save = async () => {
    setTried(true);
    if (Object.keys(errors).length > 0) return;
    const id = isNew ? `b-${d.code.trim().toLowerCase()}` : d.id;
    try {
      const savedId = await saveBranch({ ...d, id, name: d.name.trim(), code: d.code.trim(), address: d.address.trim() });
      toast(isNew ? t("created", { name: d.name.trim() }) : t("updated"));
      onSaved(savedId);
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("failed"), "info");
    }
  };
  return (
    <Modal open onClose={onClose} title={isNew ? t("addTitle") : t("editTitle")} className="max-w-[560px]" footer={<><Button onClick={onClose}>{tb("cancel")}</Button><Button variant="primary" onClick={save}>{isNew ? t("create") : t("save")}</Button></>}>
      <div className="flex flex-col gap-3.5">
        {tried && Object.keys(errors).length > 0 && <div role="alert" className="rounded-[10px] bg-bad-bg px-3 py-2 text-[13px] font-medium text-bad">{t("summary", { count: Object.keys(errors).length })}</div>}
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <TextField label={t("name")} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} error={err("name")} />
          <TextField label={t("code")} value={d.code} maxLength={4} onChange={(e) => setD({ ...d, code: e.target.value.toUpperCase().replace(/[^A-Z]/g, "") })} className="font-mono" error={err("code")} />
        </div>
        <TextField label={t("address")} value={d.address} onChange={(e) => setD({ ...d, address: e.target.value })} error={err("address")} />
        <SelectField label={t("timezone")} value={d.timezone} onChange={(e) => setD({ ...d, timezone: e.target.value })}>{TIMEZONES_EU.map((z) => <option key={z}>{z}</option>)}</SelectField>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">{t("admins")}</span>
          <div className="flex flex-wrap gap-1.5">
            {ADMIN_POOL.map((n) => { const on = d.admins.includes(n); return <button key={n} type="button" aria-pressed={on} onClick={() => setD({ ...d, admins: on ? d.admins.filter((x) => x !== n) : [...d.admins, n] })} className={cn("h-8 rounded-full border border-solid px-3 text-[12.5px] font-medium", on ? "border-accent bg-accent text-white" : "border-border-strong bg-surface text-text-2")}>{n}</button>; })}
          </div>
        </div>
        <SelectField label={t("holidays")} value={d.holidays} onChange={(e) => setD({ ...d, holidays: e.target.value as ManagedBranch["holidays"] })} hint={tb(`holidays.${d.holidays}.count`)}>{HOLIDAYS.map((h) => <option key={h} value={h}>{tb(`holidays.${h}.name`)}</option>)}</SelectField>
        <SelectField label={t("workflow")} value={d.workflow} onChange={(e) => setD({ ...d, workflow: e.target.value as ManagedBranch["workflow"] })} hint={tb(`workflows.${d.workflow}.hint`)}>{WORKFLOWS.map((w) => <option key={w} value={w}>{tb(`workflows.${w}.name`)}</option>)}</SelectField>
      </div>
    </Modal>
  );
}

function RetireDialog({ branchId, onClose, onDone }: { branchId: string | null; onClose: () => void; onDone: (nextId: string | null) => void }) {
  return branchId ? <Retire key={branchId} branchId={branchId} onClose={onClose} onDone={onDone} /> : null;
}

function Retire({ branchId, onClose, onDone }: { branchId: string; onClose: () => void; onDone: (nextId: string | null) => void }) {
  const t = useTranslations("Sites.branches.retire");
  const toast = useToast();
  const branches = useSites((s) => s.branches);
  const sites = useSites((s) => s.sites);
  const retireBranch = useSites((s) => s.retireBranch);
  const branch = branches.find((b) => b.id === branchId);
  const [action, setAction] = useState<"archive" | "delete">(branch?.archived ? "delete" : "archive");
  const [step, setStep] = useState(1);
  const [target, setTarget] = useState("");
  const [typed, setTyped] = useState("");
  if (!branch) return null;

  const attached = sites.filter((s) => s.branchId === branch.id && s.active);
  const employees = attached.reduce((a, s) => a + s.employees, 0);
  const needMove = (attached.length > 0 || employees > 0) && !branch.archived;
  const others = branches.filter((b) => !b.archived && b.id !== branch.id);
  const final = !needMove || step === 2;
  const del = action === "delete";
  const ready = (!del || typed === branch.code) && (!needMove || !!target);

  const go = () => {
    if (!final) return setStep(2);
    if (!ready) return;
    retireBranch(branch.id, action, needMove ? target : undefined);
    const next = branches.find((b) => !b.archived && b.id !== branch.id)?.id ?? null;
    toast(`${t(del ? "deleted" : "archivedDone", { name: branch.name })}${needMove ? ` · ${t("moved", { count: attached.length, to: others.find((b) => b.id === target)?.name ?? "" })}` : ""}`);
    onDone(next);
    onClose();
  };
  const choices = branch.archived ? (["delete"] as const) : (["archive", "delete"] as const);

  return (
    <Modal open onClose={onClose} title={t(branch.archived ? "titleDelete" : "title", { name: branch.name })} className="max-w-[520px]"
      footer={<><Button onClick={() => (step === 2 ? setStep(1) : onClose())}>{step === 2 ? t("back") : t("cancel")}</Button><Button variant={final && del ? "danger" : "primary"} onClick={go} disabled={final && !ready}>{!final ? t("continue") : del ? t("confirmDelete") : t("confirmArchive")}</Button></>}>
      <div className="flex flex-col gap-3.5">
        {step === 1 && (
          <>
            {needMove ? <p className="m-0 rounded-[10px] bg-warn-bg px-3 py-2.5 text-[13px] text-warn">{t("attached", { sites: attached.length, employees })}</p> : <p className="m-0 text-[13px] text-text-2">{t("empty")}</p>}
            <div role="radiogroup" aria-label={t("choose")} className="flex flex-col gap-2">
              {choices.map((k) => (
                <button key={k} role="radio" aria-checked={action === k} onClick={() => setAction(k)} className={cn("rounded-[10px] border border-solid px-3.5 py-3 text-left", action === k ? (k === "delete" ? "border-bad-dot bg-bad-bg" : "border-accent bg-accent-soft") : "border-border bg-surface")}>
                  <div className="text-[13.5px] font-semibold text-text">{t(`choices.${k}.title`)}</div><div className="text-[12.5px] text-text-2">{t(`choices.${k}.hint`)}</div>
                </button>
              ))}
            </div>
          </>
        )}
        {step === 2 && needMove && (
          <SelectField label={t("moveTo")} value={target} onChange={(e) => setTarget(e.target.value)} hint={t("moveHint", { sites: attached.length })}>
            <option value="">{t("selectBranch")}</option>
            {others.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </SelectField>
        )}
        {final && del && <TextField label={t("typeCode", { code: branch.code })} value={typed} onChange={(e) => setTyped(e.target.value)} className="font-mono" placeholder={branch.code} />}
      </div>
    </Modal>
  );
}
