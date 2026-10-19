"use client";

import { ChevronRight, Plus, Search, TriangleAlert, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useSession } from "@/store/session";
import type { Role } from "@/types/auth";
import { SIGNED_IN_USER } from "./workspace-user";
import type { LastAccess, Workspace } from "@/types/workspace";
import { markSignedIn } from "@/lib/auth-cookie";

const ROLE_STYLE: Record<Role, string> = {
  admin: "bg-accent-soft text-accent",
  branch: "bg-violet-bg text-violet",
  site: "bg-ok-bg text-ok",
};

export function WorkspacesScreen({ workspaces }: { workspaces: Workspace[] }) {
  const t = useTranslations("Workspaces");
  const format = useFormatter();
  const router = useRouter();
  const setRole = useSession((s) => s.setRole);
  const [query, setQuery] = useState("");
  const [entering, setEntering] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const q = query.trim().toLowerCase();
  const list = workspaces.filter((w) => !q || w.name.toLowerCase().includes(q) || t(`roles.${w.role}`).toLowerCase().includes(q));

  const formatLast = (a: LastAccess) =>
    a.kind === "today"
      ? t("last.today", { time: a.time })
      : a.kind === "yesterday"
        ? t("last.yesterday", { time: a.time })
        : format.dateTime(new Date(a.iso), { day: "numeric", month: "short" });

  const open = (w: Workspace) => {
    if (w.suspended || entering) return;
    setEntering(w.id);
    timer.current = setTimeout(() => {
      markSignedIn();
      setRole(w.role);
      router.push("/dashboard");
    }, 800);
  };

  return (
    <main className="flex flex-1 justify-center px-6 pb-16 pt-10">
        <div className="flex w-full max-w-[880px] flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="m-0 text-[26px] font-semibold tracking-tight">{t("title")}</h1>
              <p className="mb-0 mt-1.5 text-text-2">{t("subtitle", { count: workspaces.length })}</p>
            </div>
            <button
              onClick={() => router.push("/onboarding")}
              className="flex h-[38px] items-center gap-[7px] rounded-[10px] border border-solid border-border-strong bg-surface px-3.5 text-[13.5px] font-medium text-text hover:bg-hover"
            >
              <Plus size={15} strokeWidth={2.2} /> {t("create")}
            </button>
          </div>

          <div className="flex h-[42px] items-center gap-2.5 rounded-[10px] border border-solid border-border-strong bg-surface px-3.5 text-text-3 focus-within:border-accent">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search")}
              aria-label={t("search")}
              className="min-w-0 flex-1 border-0 bg-transparent text-[14px] text-text outline-0"
            />
            {query && (
              <button onClick={() => setQuery("")} title={t("clear")} aria-label={t("clear")} className="grid size-6 place-items-center rounded-md border-0 bg-neutral-bg text-text-2">
                <X size={12} strokeWidth={2.4} />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            {list.map((w) => {
              const busy = entering === w.id;
              const disabled = !!w.suspended || (!!entering && !busy);
              return (
                <div key={w.id} className="contents">
                  <button
                    onClick={() => open(w)}
                    disabled={disabled}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-[14px] border border-solid bg-surface px-[18px] py-4 text-left text-text shadow-card enabled:hover:border-border-strong enabled:hover:bg-surface-2",
                      busy ? "border-accent" : "border-border",
                      w.suspended ? "opacity-60" : entering && !busy && "opacity-50",
                    )}
                  >
                    <div className="grid size-12 flex-none place-items-center rounded-xl text-[18px] font-bold text-white" style={{ background: w.logo }}>
                      {w.mono}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[15px] font-semibold">{w.name}</span>
                        {w.isLastUsed && <span className="rounded-full bg-ok-bg px-[7px] py-0.5 text-[11px] font-semibold text-ok">{t("lastUsed")}</span>}
                        {w.suspended && <span className="rounded-full bg-warn-bg px-[7px] py-0.5 text-[11px] font-semibold text-warn">{t("trialEnded")}</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-text-2">
                        <span className={cn("inline-flex h-[22px] items-center rounded-full px-2 text-[12px] font-semibold", ROLE_STYLE[w.role])}>{t(`roles.${w.role}`)}</span>
                        <span>{w.scopeName ? t(`scope.${w.role}`, { name: w.scopeName }) : t("scope.company")}</span>
                        <span className="text-text-3">·</span>
                        <span className="text-text-3">{t("meta", { employees: w.employees, sites: w.sites })}</span>
                      </div>
                    </div>
                    <div className="flex min-w-[120px] flex-none flex-col items-end gap-1">
                      <span className="text-[12px] text-text-3">{t("lastAccessed")}</span>
                      <span className="text-[13px] font-medium">{formatLast(w.lastAccess)}</span>
                    </div>
                    <div className="grid size-8 flex-none place-items-center rounded-[9px] text-text-3">
                      {busy && <span className="box-border size-4 animate-spin-fast rounded-full border-2 border-solid border-border-strong border-t-accent" />}
                      {!busy && !w.suspended && <ChevronRight size={16} />}
                    </div>
                  </button>
                  {w.suspended && (
                    <div className="-mt-1 mb-1 ml-[18px] flex items-center gap-2 text-[12.5px] text-warn">
                      <TriangleAlert size={14} />
                      {t("trialEndedDescription")}{" "}
                      <a href="/settings/plans" className="font-medium">
                        {t("choosePlan")}
                      </a>
                    </div>
                  )}
                </div>
              );
            })}

            {list.length === 0 && (
              <div className="rounded-[14px] border border-dashed border-border-strong bg-surface px-5 py-12 text-center">
                <div className="text-[15px] font-semibold">{t("emptyTitle", { query })}</div>
                <div className="mb-3.5 mt-1 text-[13px] text-text-3">{t("emptyDescription")}</div>
                <button onClick={() => setQuery("")} className="h-[34px] rounded-[9px] border border-solid border-border-strong bg-surface px-3.5 text-[13px] font-medium text-text">
                  {t("clearSearch")}
                </button>
              </div>
            )}

            <button
              onClick={() => router.push("/onboarding")}
              className="flex w-full items-center gap-4 rounded-[14px] border-[1.5px] border-dashed border-border-strong bg-transparent px-[18px] py-4 text-left text-text-2 hover:border-accent hover:bg-accent-soft hover:text-accent"
            >
              <div className="grid size-12 flex-none place-items-center rounded-xl border-[1.5px] border-dashed border-current">
                <Plus size={18} strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-[14.5px] font-semibold">{t("create")}</div>
                <div className="text-[12.5px] text-text-3">{t("createDescription")}</div>
              </div>
            </button>
          </div>

          <p className="m-0 text-center text-[12.5px] text-text-3">{t("missing", { email: SIGNED_IN_USER.email })}</p>
        </div>
    </main>
  );
}
