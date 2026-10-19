"use client";

import { ChevronsLeft, ChevronsRight, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV } from "@/lib/nav";
import { canAccess } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useData } from "@/store/data";
import { pendingIn, useLeave } from "@/store/leave";
import { useSession } from "@/store/session";
import { localized } from "@/lib/plans";
import { usePresence } from "@/lib/use-presence";
import { useCurrentPlan, usePlans } from "@/store/plans";
import { useAccess } from "@/store/use-access";


/** Fixed left navigation. Below 1024px it becomes a slide-in drawer. */
export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("Shell");
  const locale = useLocale();
  const nav = useTranslations("Nav.pages");
  const pathname = usePathname();
  const router = useRouter();
  const { hydrated, perms, siteIds } = useAccess();
  const storedCollapsed = useSession((s) => s.sidebarCollapsed);
  const toggle = useSession((s) => s.toggleSidebar);
  const today = useData((s) => s.today);
  const leaveRequests = useLeave((s) => s.requests);
  const collapsed = hydrated && storedCollapsed;
  const backdrop = usePresence(open, 200);

  const counts = {
    alerts: today.filter((r) => siteIds.includes(r.site) && ((r.flag && !r.cleared && !r.fraud) || r.status === "missing")).length,
    leave: pendingIn(leaveRequests, siteIds).length,
  };
  const plan = useCurrentPlan();
  const used = usePlans((s) => s.subscription.seatsUsed);
  const usage = plan.employeeCap ? `${used}/${plan.employeeCap}` : String(used);
  const planName = t("planName", { plan: localized(plan.name, locale) });
  const pct = plan.employeeCap ? Math.round((used / plan.employeeCap) * 100) : 0;
  const planColor = pct >= 90 ? "var(--bad-dot)" : pct >= 80 ? "var(--warn-dot)" : "var(--accent)";
  // Labels stay visible on the tablet drawer even when the desktop rail is collapsed.
  const hideOnRail = collapsed ? "lg:hidden" : "";

  return (
    <>
      {backdrop.mounted && <div data-state={backdrop.state} className="ss-fade fixed inset-0 z-[59] bg-overlay lg:hidden" onClick={onClose} aria-hidden />}
      <aside
        aria-label={t("navigation")}
        className={cn(
          "fixed inset-y-0 left-0 z-[60] box-border flex h-screen w-[280px] flex-col border-r border-border bg-sidebar px-3 pb-3 pt-3.5 transition-[width,transform] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
          "lg:sticky lg:top-0 lg:z-[6] lg:translate-x-0 lg:self-start lg:shadow-none",
          collapsed ? "lg:w-[68px]" : "lg:w-[248px]",
          open ? "translate-x-0 shadow-pop" : "-translate-x-[104%]",
        )}
      >
        <div className={cn("flex items-center gap-2.5 px-1 pb-4 pt-0.5", collapsed && "lg:justify-center")}>
          <div className="grid size-[34px] flex-none place-items-center overflow-hidden rounded-[9px] border border-border bg-white">
            <Image src="/staffsync-logo.png" alt="" width={30} height={30} className="object-contain" />
          </div>
          <div className={cn("flex-1 text-[16px] font-bold tracking-tight", hideOnRail)}>StaffSync</div>
          <button onClick={onClose} title={t("close")} aria-label={t("close")} className="grid size-8 place-items-center rounded-lg border border-solid border-border bg-transparent text-text-2 lg:hidden">
            <X size={15} />
          </button>
        </div>

        <nav className="-mx-1 flex flex-1 flex-col gap-3.5 overflow-y-auto overflow-x-hidden px-1" aria-label={t("navigation")}>
          {NAV.map(({ group, items }, gi) => {
            const visible = items.filter((i) => canAccess(perms, i.page));
            if (visible.length === 0) return null;
            return (
              <div key={group} className="flex flex-col gap-0.5">
                <div className={cn("whitespace-nowrap px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-3", hideOnRail)}>{t(`groups.${group}`)}</div>
                {collapsed && gi > 0 && <div className="mx-2 mb-2.5 hidden h-px bg-border lg:block" />}
                {visible.map(({ page, icon: Icon, badge }) => {
                  const href = `/${page}`;
                  const active = pathname === href || pathname.startsWith(`${href}/`);
                  const n = badge ? counts[badge] : 0;
                  const badgeColor = badge === "alerts" ? "var(--bad-dot)" : "var(--accent)";
                  return (
                    <Link
                      key={page}
                      href={href}
                      onClick={onClose}
                      title={nav(page)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-left text-[13.5px] no-underline hover:bg-hover hover:text-text hover:no-underline",
                        collapsed && "lg:justify-center",
                        active ? "bg-accent-soft font-semibold text-accent" : "font-medium text-text-2",
                      )}
                    >
                      <Icon size={18} strokeWidth={1.8} className="flex-none" />
                      <span className={cn("flex-1 whitespace-nowrap", hideOnRail)}>{nav(page)}</span>
                      {n > 0 && (
                        <span className={cn("box-border h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold text-white", collapsed ? "grid lg:hidden" : "grid")} style={{ background: badgeColor }}>
                          {n}
                        </span>
                      )}
                      {n > 0 && collapsed && (
                        <span className="absolute right-[9px] top-[5px] hidden h-4 min-w-4 box-border place-items-center rounded-full border-2 border-solid border-sidebar px-1 text-[9.5px] font-bold text-white lg:grid" style={{ background: badgeColor }}>
                          {n}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {perms.admin && (
          <>
            <div className={cn("mt-3 flex flex-col gap-2 rounded-[10px] border border-border bg-surface-2 p-3", hideOnRail)}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="whitespace-nowrap text-[12.5px] font-semibold">{planName}</span>
                <a href="/settings/plans" onClick={(e) => { e.preventDefault(); router.push("/settings/plans"); }} className="text-[12px] font-medium">{t("upgrade")}</a>
              </div>
              <div className="h-1.5 overflow-hidden rounded-md bg-neutral-bg"><div className="h-full rounded-md" style={{ width: `${pct}%`, background: planColor }} /></div>
              <div className="whitespace-nowrap text-[12px] text-text-2"><span className="font-mono text-[12px] font-semibold text-text">{usage}</span> {t("employees")}</div>
            </div>
            {collapsed && (
              <button onClick={() => router.push("/settings/plans")} title={`${planName} · ${usage} ${t("employees")}`} className="mt-2.5 hidden flex-col items-center gap-[5px] rounded-[10px] border border-solid border-border bg-surface-2 py-2 text-text lg:flex">
                <span className="font-mono text-[11px] font-semibold">{pct}%</span>
                <span className="block h-1 w-7 overflow-hidden rounded bg-neutral-bg"><span className="block h-full" style={{ width: `${pct}%`, background: planColor }} /></span>
              </button>
            )}
          </>
        )}

        <button
          onClick={toggle}
          title={t(collapsed ? "expand" : "collapse")}
          className={cn("mt-2 hidden h-[34px] items-center gap-2.5 rounded-lg border-0 bg-transparent px-2.5 text-[13px] font-medium text-text-3 hover:bg-hover hover:text-text lg:flex", collapsed && "justify-center")}
        >
          {collapsed ? <ChevronsRight size={18} strokeWidth={1.8} /> : <ChevronsLeft size={18} strokeWidth={1.8} />}
          {!collapsed && <span className="whitespace-nowrap">{t("collapse")}</span>}
        </button>
      </aside>
    </>
  );
}
