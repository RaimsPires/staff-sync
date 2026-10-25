"use client";

import { useHeadcounts } from "./use-headcounts";
import { MoreHorizontal, Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SitesMap, type SitePin } from "@/components/map/sites-map";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Popover } from "@/components/ui/popover";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/misc";
import { useUsers } from "@/store/users";
import { cn } from "@/lib/utils";
import { useAccess } from "@/store/use-access";
import { siteRate, useSites } from "@/store/sites";
import type { ManagedSite } from "@/types/site";
import { SiteQrDialog } from "./site-qr-dialog";

type ViewMode = "map" | "list";
const select = "h-[34px] rounded-[9px] border border-solid border-border-strong bg-surface px-2.5 text-[13px] text-text";
const TONE = { ok: "var(--ok-dot)", warn: "var(--warn-dot)", bad: "var(--bad-dot)", neutral: "var(--neutral-dot)" } as const;

const tone = (s: ManagedSite): SitePin["tone"] => (!s.active ? "neutral" : s.expected && s.present / s.expected < 0.85 ? "warn" : "ok");

export function SitesBrowser({ initialSelected }: { initialSelected?: string }) {
  useHeadcounts();
  const managerUsers = useUsers((s) => s.users).filter((u) => u.status === "active");
  const t = useTranslations("Sites");
  const router = useRouter();
  const toast = useToast();
  const { role, scope, siteIds, perms } = useAccess();
  const allSites = useSites((s) => s.sites);
  const branches = useSites((s) => s.branches);
  const patchSite = useSites((s) => s.patchSite);

  const [view, setView] = useState<ViewMode>("map");
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("all");
  const [manager, setManager] = useState("all");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [selected, setSelected] = useState<string | null>(initialSelected ?? null);
  const [qrSite, setQrSite] = useState<ManagedSite | null>(null);
  const [deactivating, setDeactivating] = useState<ManagedSite | null>(null);

  const canManage = perms.admin || perms.org;
  const scoped = useMemo(() => allSites.filter((s) => (role === "admin" && scope.kind === "company") || siteIds.includes(s.id)), [allSites, role, scope, siteIds]);
  const q = query.trim().toLowerCase();
  const list = scoped.filter((s) => (branch === "all" || s.branchId === branch) && (manager === "all" || s.managers.includes(manager)) && (status === "all" || (status === "active") === s.active) && (!q || s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)));
  const current = list.find((s) => s.id === selected) ?? null;
  const filtered = branch !== "all" || manager !== "all" || status !== "all" || !!q;

  const pins: SitePin[] = list.map((s) => ({ id: s.id, position: s.position, tone: tone(s), count: s.active ? `${s.present}/${s.expected}` : "—", label: s.name.split(" ")[0] }));
  const fenceLabel = (s: ManagedSite) => (s.geofence.kind === "circle" ? t("fence.circle", { radius: s.geofence.radius }) : t("fence.polygon", { area: s.geofence.hectares }));
  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? "";
  const today = (s: ManagedSite) => (s.active ? `${s.present}/${s.expected}` : "—");

  const actions = (s: ManagedSite, close: () => void) => {
    const item = "flex h-9 w-full items-center rounded-lg border-0 bg-transparent px-2.5 text-left text-[13px] text-text hover:bg-hover";
    return (
      <>
        <Link href={`/sites/${s.id}`} className={cn(item, "no-underline hover:no-underline")}>{t("actions.view")}</Link>
        {canManage && <Link href={`/sites/${s.id}/edit`} className={cn(item, "no-underline hover:no-underline")}>{t("actions.edit")}</Link>}
        <button onClick={() => { close(); setQrSite(s); }} className={item}>{t("actions.qr")}</button>
        {canManage && (s.active
          ? <button onClick={() => { close(); setDeactivating(s); }} className={cn(item, "text-bad")}>{t("actions.deactivate")}</button>
          : <button onClick={() => { close(); patchSite(s.id, { active: true }); toast(t("toasts.reactivated", { name: s.name })); }} className={cn(item, "text-ok")}>{t("actions.reactivate")}</button>)}
      </>
    );
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label={t("view")} className="flex overflow-hidden rounded-[9px] border border-border-strong">
          {(["map", "list"] as const).map((k) => <button key={k} aria-pressed={view === k} onClick={() => setView(k)} className={cn("h-[34px] border-0 px-3.5 text-[13px] font-medium", view === k ? "bg-accent text-white" : "bg-surface text-text-2")}>{t(`views.${k}`)}</button>)}
        </div>
        <label className="flex h-[34px] w-[230px] items-center gap-2 rounded-[9px] border border-solid border-border px-2.5 text-text-3">
          <Search size={15} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} aria-label={t("search")} className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-text outline-0" />
        </label>
        <select value={branch} onChange={(e) => setBranch(e.target.value)} aria-label={t("filters.branch")} className={select}>
          <option value="all">{t("filters.allBranches")}</option>
          {branches.filter((b) => !b.archived).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={manager} onChange={(e) => setManager(e.target.value)} aria-label={t("filters.manager")} className={select}>
          <option value="all">{t("filters.allManagers")}</option>
          {managerUsers.map((m) => <option key={m.id}>{m.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label={t("filters.status")} className={select}>
          <option value="all">{t("filters.anyStatus")}</option>
          <option value="active">{t("status.active")}</option>
          <option value="inactive">{t("status.inactive")}</option>
        </select>
        {filtered && <button onClick={() => { setQuery(""); setBranch("all"); setManager("all"); setStatus("all"); }} className="h-[34px] border-0 bg-transparent px-2.5 text-[13px] text-accent">{t("filters.clear")}</button>}
        <div className="flex-1" />
        {canManage && <Button variant="primary" onClick={() => router.push("/sites/new")}><Plus size={15} /> {t("add")}</Button>}
      </div>

      {list.length === 0 ? (
        <EmptyState title={t("empty.title")} hint={t("empty.hint")} />
      ) : view === "map" ? (
        <div className="flex flex-wrap items-stretch gap-4">
          <section className="relative z-0 min-h-[520px] min-w-0 flex-[2_1_520px] overflow-hidden rounded-xl border border-border bg-map-bg shadow-card">
            <div className="absolute inset-0"><SitesMap pins={pins} selectedId={selected} onSelect={setSelected} /></div>
            {current && (
              <div className="absolute bottom-3 left-3 z-[500] w-[300px] max-w-[calc(100%-24px)] animate-rise rounded-xl border border-border bg-surface p-3.5 shadow-pop">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1"><div className="font-semibold">{current.name}</div><div className="text-[12px] text-text-3">{branchName(current.branchId)} · {current.address}</div></div>
                  <Chip tone={current.active ? "ok" : "neutral"} dot={false}>{t(current.active ? "status.active" : "status.inactive")}</Chip>
                </div>
                <dl className="m-0 my-2.5 grid grid-cols-2 gap-2 text-[12.5px]">
                  <div><dt className="text-text-3">{t("columns.fence")}</dt><dd className="m-0 font-medium">{fenceLabel(current)}</dd></div>
                  <div><dt className="text-text-3">{t("columns.today")}</dt><dd className="m-0 font-mono font-medium">{today(current)}</dd></div>
                  <div className="col-span-2"><dt className="text-text-3">{t("columns.manager")}</dt><dd className="m-0 font-medium">{current.managers.join(", ") || "—"}</dd></div>
                </dl>
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" onClick={() => router.push(`/sites/${current.id}`)}>{t("actions.view")}</Button>
                  {canManage && <Button size="sm" onClick={() => router.push(`/sites/${current.id}/edit`)}>{t("actions.edit")}</Button>}
                  <Button size="sm" onClick={() => setQrSite(current)}>{t("actions.qr")}</Button>
                </div>
              </div>
            )}
          </section>
          <aside className="flex max-h-[560px] min-w-[260px] flex-[1_1_280px] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-card">
            <div className="border-b border-border px-3.5 py-2.5 text-[12.5px] text-text-3">{t("count", { count: list.length })}</div>
            <ul className="m-0 flex-1 list-none overflow-auto p-0">
              {list.map((s) => (
                <li key={s.id}>
                  <button onClick={() => setSelected(s.id)} aria-pressed={selected === s.id} className={cn("flex w-full items-center gap-2.5 border-0 border-b border-border px-3.5 py-3 text-left", selected === s.id ? "bg-accent-soft" : "bg-transparent hover:bg-hover")}>
                    <span className="size-2.5 flex-none rounded-full" style={{ background: TONE[tone(s)] }} />
                    <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-text">{s.name}</span><span className="block truncate text-[12px] text-text-3">{branchName(s.branchId)} · {fenceLabel(s)}</span></span>
                    <span className="font-mono text-[12.5px] text-text-2">{today(s)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
          <table className="w-full min-w-[1080px] border-collapse text-[13.5px]">
            <thead>
              <tr className="bg-surface-2 text-left text-[12px] text-text-3">
                {(["name", "branch", "address", "fence", "manager", "employees", "today", "selfie", "qr", "status"] as const).map((c) => <th key={c} className="h-[38px] whitespace-nowrap border-b border-border px-3 font-medium first:pl-4">{t(`columns.${c}`)}</th>)}
                <th className="w-12 border-b border-border" />
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className={cn("border-b border-border last:border-b-0 hover:bg-hover", !s.active && "opacity-65")}>
                  <td className="py-2.5 pl-4 pr-3"><Link href={`/sites/${s.id}`} className="font-medium text-text no-underline hover:no-underline"><span className="mr-2 inline-block size-2 rounded-full" style={{ background: TONE[tone(s)] }} />{s.name}</Link></td>
                  <td className="px-3 py-2.5">{branchName(s.branchId)}</td>
                  <td className="max-w-[220px] truncate px-3 py-2.5 text-text-2">{s.address}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{fenceLabel(s)}</td>
                  <td className="px-3 py-2.5">{s.managers.join(", ") || "—"}</td>
                  <td className="px-3 py-2.5 font-mono">{s.employees}</td>
                  <td className="px-3 py-2.5"><span className="font-mono">{today(s)}</span> <span className="text-text-3">· {siteRate(s)}%</span></td>
                  <td className="px-3 py-2.5"><Chip tone={s.requireSelfie ? "ok" : "neutral"} dot={false}>{t(s.requireSelfie ? "on" : "off")}</Chip></td>
                  <td className="px-3 py-2.5"><Chip tone={s.requireQr ? "ok" : "neutral"} dot={false}>{t(s.requireQr ? "on" : "off")}</Chip></td>
                  <td className="px-3 py-2.5"><Chip tone={s.active ? "ok" : "neutral"} dot={false}>{t(s.active ? "status.active" : "status.inactive")}</Chip></td>
                  <td className="px-2 py-2.5">
                    <Popover align="right" panelClassName="w-[190px] p-1.5" trigger={({ toggle }) => <button onClick={toggle} aria-label={t("actions.menu", { name: s.name })} className="grid size-8 place-items-center rounded-lg border-0 bg-transparent text-text-2 hover:bg-hover"><MoreHorizontal size={17} /></button>}>
                      {(close) => actions(s, close)}
                    </Popover>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SiteQrDialog site={qrSite} onClose={() => setQrSite(null)} />
      <ConfirmDialog
        open={deactivating !== null}
        danger
        title={t("deactivate.title", { name: deactivating?.name ?? "" })}
        message={deactivating?.employees ? t("deactivate.withEmployees", { count: deactivating.employees }) : t("deactivate.noEmployees")}
        cancelLabel={t("deactivate.cancel")}
        okLabel={t("deactivate.confirm")}
        onCancel={() => setDeactivating(null)}
        onOk={() => { if (deactivating) { patchSite(deactivating.id, { active: false }); toast(t("toasts.deactivated", { name: deactivating.name })); } setDeactivating(null); }}
      />
    </div>
  );
}
