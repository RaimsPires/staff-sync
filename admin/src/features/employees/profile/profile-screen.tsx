"use client";

import { ArrowLeft, Mail, MessageSquare, MoreHorizontal, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useState } from "react";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Popover } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useOrg } from "@/lib/org";
import { cn } from "@/lib/utils";
import { useAccess } from "@/store/use-access";
import { useEmployees } from "@/store/employees";
import { inviteEmployee, issueBadge, loadMonth, loadPersonSchedules, removeSchedule, saveSchedule } from "@/services/employee-profile";
import { Modal } from "@/components/ui/overlay";
import { useLoaded } from "./use-employee-data";
import { EmployeeFormDrawer } from "../employee-form-drawer";
import { statusTone } from "../model";
import { ActivityTab, DeviceTab, DocsTab, LeaveTab, ScheduleTab } from "./manage-tabs";
import { AttendanceTab, OverviewTab } from "./overview-tabs";

const TABS = ["overview", "attendance", "schedule", "leave", "device", "docs", "activity"] as const;
type Tab = (typeof TABS)[number];

export function EmployeeProfileScreen({ id }: { id: string }) {
  const employee = useEmployees((s) => s.employees.find((e) => e.id === id));
  const { siteIds } = useAccess();
  if (!employee) notFound();
  // Employees outside the current scope are not reachable, even by URL.
  if (!employee.siteIds.some((s) => siteIds.includes(s))) return <OutOfScope />;
  return <Profile key={employee.id} id={employee.id} />;
}

function OutOfScope() {
  const t = useTranslations("Employees.profile");
  return <EmptyState title={t("outOfScope.title")} hint={t("outOfScope.hint")} action={<Link href="/employees">{t("back")}</Link>} />;
}

function Profile({ id }: { id: string }) {
  const org = useOrg();
  const t = useTranslations("Employees.profile");
  const te = useTranslations("Employees");
  const tTitles = useTranslations("Employees.titles");
  const toast = useToast();
  const { perms } = useAccess();
  const emp = useEmployees((s) => s.employees.find((e) => e.id === id))!;
  const setStatus = useEmployees((s) => s.setStatus);

  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const month = useLoaded(() => loadMonth(emp.id), [], `${emp.id}:month`);
  const personal = useLoaded(() => loadPersonSchedules(emp.id), [], `${emp.id}:schedules`);
  const records = month.value;
  const [badge, setBadge] = useState<{ pin: string; qrSvg: string } | null>(null);
  const canManage = perms.admin || perms.edit;

  const noPhone = emp.phone === "—";
  const contact = (kind: "call" | "message" | "email") =>
    toast(kind === "email" ? t("toasts.email", { name: emp.name }) : noPhone ? t("toasts.noPhone") : t(kind === "call" ? "toasts.calling" : "toasts.messaging", { name: emp.name }));

  const reactivate = () => {
    setStatus(emp.id, emp.app === "invited" ? "invited" : "active");
    toast(te("reactivated", { name: emp.name }));
  };
  const newBadge = async () => {
    try {
      setBadge(await issueBadge(emp.id));
    } catch (e) {
      toast(e instanceof Error ? e.message : t("toasts.failed"), "bad");
    }
  };
  const resendInvite = async () => {
    try {
      await inviteEmployee(emp.id);
      toast(t("toasts.invited", { name: emp.name }));
    } catch (e) {
      toast(e instanceof Error ? e.message : t("toasts.failed"), "bad");
    }
  };

  return (
    <div className="relative flex flex-col gap-4">
      <Link href="/employees" className="flex h-[30px] items-center gap-1.5 self-start rounded-lg py-0 pl-1.5 pr-2.5 text-[13px] font-medium text-text-2 no-underline hover:bg-hover hover:no-underline">
        <ArrowLeft size={15} /> {te("title")}
      </Link>

      <div className="flex flex-wrap items-center gap-[18px] rounded-[14px] border border-border bg-surface p-5 shadow-card">
        <Avatar name={emp.name} size={76} />
        <div className="min-w-0 flex-[1_1_280px]">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="m-0 text-2xl font-semibold tracking-tight">{emp.name}</h1>
            <Chip tone={statusTone[emp.status]}>{te(`status.${emp.status}`)}</Chip>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3.5 gap-y-1.5 text-[13.5px] text-text-2">
            <span className="font-mono text-[12.5px]">{emp.id}</span>
            <span>{tTitles(emp.title)}</span>
            <span>{org.branches.find((b) => b.id === emp.branchId)?.name}</span>
            <span>{t("role", { role: te(`form.accessRoles.${emp.access}`) })}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => contact("call")}><Phone size={14} /> {t("call")}</Button>
          <Button onClick={() => contact("message")}><MessageSquare size={14} /> {t("message")}</Button>
          <Button onClick={() => contact("email")}><Mail size={14} /> {t("email")}</Button>
          {canManage && <Button variant="primary" onClick={() => setEditing(true)}>{t("edit")}</Button>}
          {canManage && (
            <Popover
              align="right"
              panelClassName="w-[230px] p-1.5"
              trigger={({ toggle }) => (
                <button onClick={toggle} aria-label={t("more")} className="grid size-9 place-items-center rounded-[9px] border border-solid border-border-strong bg-surface text-text-2"><MoreHorizontal size={16} /></button>
              )}
            >
              {(close) => {
                const item = "block h-[34px] w-full rounded-lg border-0 bg-transparent px-2.5 text-left text-[13px] hover:bg-hover";
                return (
                  <>
                    <button onClick={() => { close(); setEditing(true); }} className={cn(item, "text-text")}>{t("menu.edit")}</button>
                    {emp.app === "installed" && <button onClick={() => { close(); setTab("device"); }} className={cn(item, "text-text")}>{t("menu.resetDevice")}</button>}
                    {emp.app === "none" && <button onClick={() => { close(); void newBadge(); }} className={cn(item, "text-text")}>{t("menu.badge")}</button>}
                    {emp.app === "invited" && <button onClick={() => { close(); void resendInvite(); }} className={cn(item, "text-text")}>{t("menu.resendInvite")}</button>}
                    {emp.status === "deactivated"
                      ? <button onClick={() => { close(); reactivate(); }} className={cn(item, "text-ok")}>{t("menu.reactivate")}</button>
                      : <button onClick={() => { close(); setDeactivating(true); }} className={cn(item, "text-bad")}>{t("menu.deactivate")}</button>}
                  </>
                );
              }}
            </Popover>
          )}
        </div>
      </div>

      <div role="tablist" className="flex gap-0.5 overflow-x-auto border-b border-border">
        {TABS.map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("-mb-px h-10 whitespace-nowrap border-0 border-b-2 border-solid bg-transparent px-3.5 text-[13.5px]", tab === k ? "border-b-accent font-semibold text-text" : "border-b-transparent font-medium text-text-2")}>
            {t(`tabs.${k}`)}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab emp={emp} records={records} />}
      {tab === "attendance" && <AttendanceTab emp={emp} records={records} />}
      {tab === "schedule" && (
        <ScheduleTab
          emp={emp}
          schedules={personal.value}
          onSave={async (draft) => { await saveSchedule(emp.id, draft); personal.reload(); }}
          onRemove={async (sch) => { await removeSchedule(sch.uuid); personal.reload(); }}
        />
      )}
      {tab === "leave" && <LeaveTab emp={emp} />}
      {tab === "device" && <DeviceTab emp={emp} onChanged={() => undefined} />}
      {tab === "docs" && <DocsTab emp={emp} />}
      {tab === "activity" && <ActivityTab emp={emp} />}

      <Modal open={badge !== null} onClose={() => setBadge(null)} title={t("badge.title")} className="max-w-[380px]" footer={<Button variant="primary" onClick={() => setBadge(null)}>{t("badge.done")}</Button>}>
        {badge && (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="m-0 text-[13px] text-text-2">{t("badge.hint", { name: emp.name })}</p>
            <div className="size-40 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: badge.qrSvg }} />
            <div className="text-[12px] text-text-3">{t("badge.pin")}</div>
            <div className="font-mono text-[28px] font-semibold tracking-[.3em]">{badge.pin}</div>
          </div>
        )}
      </Modal>
      <EmployeeFormDrawer open={editing} employee={emp} onClose={() => setEditing(false)} />
      <ConfirmDialog
        open={deactivating}
        danger
        title={te("deactivate.title", { name: emp.name })}
        message={te("deactivate.message")}
        cancelLabel={te("deactivate.cancel")}
        okLabel={te("deactivate.confirm")}
        onCancel={() => setDeactivating(false)}
        onOk={() => { setStatus(emp.id, "deactivated"); toast(te("deactivated", { name: emp.name })); setDeactivating(false); }}
      />
    </div>
  );
}
