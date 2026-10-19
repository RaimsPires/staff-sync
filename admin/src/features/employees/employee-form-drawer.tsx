"use client";

import { Printer, RefreshCw, TriangleAlert } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/overlay";
import { Switch } from "@/components/ui/switch";
import { SelectField, TextField } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import { JOB_TITLES, PLAN_LIMIT } from "@/data/employees";
import { BRANCHES, SITES } from "@/data/org";
import { cn } from "@/lib/utils";
import { useEmployees } from "@/store/employees";
import type { AccessRole, Contract, Employee, EmployeeDraft, JobTitle, LeavePolicy } from "@/types/employee";

const ACCESS: AccessRole[] = ["employee", "teamLead", "siteManager", "branchManager", "admin"];
const CONTRACTS: Contract[] = ["cdi", "cdd", "interim", "intern", "part"];
const LEAVE_TYPES = ["annual", "rtt", "sick", "family"] as const;
const POLICIES: Record<LeavePolicy, Record<(typeof LEAVE_TYPES)[number], number>> = {
  std: { annual: 25, rtt: 10, sick: 5, family: 4 },
  part: { annual: 20, rtt: 0, sick: 5, family: 4 },
  fixed: { annual: 2.5, rtt: 0, sick: 3, family: 2 },
};
const NEEDS_SCOPE: AccessRole[] = ["teamLead", "siteManager", "branchManager"];
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

interface Form {
  first: string;
  last: string;
  idMode: "auto" | "manual";
  id: string;
  phone: string;
  email: string;
  branchId: string;
  title: JobTitle | "";
  access: AccessRole;
  scope: string;
  startDate: string;
  contract: Contract;
  siteIds: string[];
  smartphone: boolean;
  selfie: Employee["selfie"];
  pin: string;
  policy: LeavePolicy;
  balances: Record<(typeof LEAVE_TYPES)[number], number>;
  sms: boolean;
  mail: boolean;
}

const newPin = () => String(1000 + Math.floor(Math.random() * 9000));

function initialForm(emp: Employee | null): Form {
  const [first = "", ...rest] = emp ? emp.name.split(" ") : [];
  return {
    first, last: rest.join(" "), idMode: emp ? "manual" : "auto", id: emp?.id ?? "", phone: emp && emp.phone !== "—" ? emp.phone : "", email: emp?.email ?? "",
    branchId: emp?.branchId ?? "", title: emp?.title ?? "", access: emp?.access ?? "employee", scope: "", startDate: emp?.startDate ?? "", contract: emp?.contract ?? "cdi",
    siteIds: emp ? [...emp.siteIds] : [], smartphone: emp ? emp.app !== "none" : true, selfie: emp?.selfie ?? "inherit", pin: emp?.pin ?? newPin(),
    policy: "std", balances: { ...POLICIES.std }, sms: true, mail: false,
  };
}

export function EmployeeFormDrawer({ open, employee, onClose }: { open: boolean; employee: Employee | null; onClose: () => void }) {
  // Remount per employee so a previous draft never leaks into the next one.
  return open ? <FormBody key={employee?.id ?? "new"} employee={employee} onClose={onClose} /> : null;
}

function FormBody({ employee, onClose }: { employee: Employee | null; onClose: () => void }) {
  const t = useTranslations("Employees.form");
  const tTitles = useTranslations("Employees.titles");
  const toast = useToast();
  const employees = useEmployees((s) => s.employees);
  const upsert = useEmployees((s) => s.upsert);
  const [f, setF] = useState<Form>(() => initialForm(employee));
  const [tried, setTried] = useState(false);

  const isAdd = !employee;
  const count = employees.length;
  const atLimit = isAdd && count >= PLAN_LIMIT;
  const left = PLAN_LIMIT - count;
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setF((x) => ({ ...x, [key]: value }));
  const taken = employees.filter((e) => e.id !== employee?.id).map((e) => e.id);
  const autoId = `E-${1061 + count}`;
  const finalId = f.idMode === "auto" ? (employee?.id ?? autoId) : f.id.trim();

  const errors = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!f.first.trim()) e.first = "firstRequired";
    if (!f.last.trim()) e.last = "lastRequired";
    if (f.idMode === "manual") {
      if (!f.id.trim()) e.id = "idRequired";
      else if (taken.includes(f.id.trim())) e.id = "idTaken";
    }
    const digits = f.phone.replace(/\D/g, "").length;
    if (f.smartphone && !f.phone.trim()) e.phone = "phoneRequired";
    else if (f.phone.trim() && digits < 10) e.phone = "phoneInvalid";
    if (f.email && !EMAIL_RE.test(f.email)) e.email = "emailInvalid";
    else if (f.mail && f.smartphone && !f.email) e.email = "emailForInvite";
    if (!f.branchId) e.branchId = "branchRequired";
    if (!f.title) e.title = "titleRequired";
    if (NEEDS_SCOPE.includes(f.access) && !f.scope) e.scope = "scopeRequired";
    if (!f.startDate) e.startDate = "startRequired";
    if (f.siteIds.length === 0) e.siteIds = "sitesRequired";
    return e;
  };
  const errs = tried ? errors() : {};
  const err = (k: string) => (errs[k] ? t(`errors.${errs[k]}`) : undefined);
  const errCount = Object.keys(errs).length;

  const save = (another: boolean) => {
    setTried(true);
    if (Object.keys(errors()).length > 0 || atLimit || f.title === "") return;
    const draft: EmployeeDraft = {
      id: finalId, name: `${f.first.trim()} ${f.last.trim()}`, branchId: f.branchId, siteIds: f.siteIds, title: f.title, phone: f.phone.trim(), email: f.email || undefined,
      smartphone: f.smartphone, invite: f.smartphone && (f.sms || f.mail), access: f.access, contract: f.contract, startDate: f.startDate, selfie: f.selfie, pin: f.pin,
    };
    upsert(draft, employee?.id);
    toast(isAdd ? t("added", { name: draft.name }) + (draft.invite ? ` · ${t("inviteSent")}` : "") : t("updated", { name: draft.name }));
    if (another) {
      setF(initialForm(null));
      setTried(false);
    } else onClose();
  };

  const toggleSite = (id: string) => set("siteIds", f.siteIds.includes(id) ? f.siteIds.filter((s) => s !== id) : [...f.siteIds, id]);
  const makeDefault = (id: string) => set("siteIds", [id, ...f.siteIds.filter((s) => s !== id)]);

  const scopeOptions = f.access === "branchManager" ? ["branch", "multi"] : ["assigned", "branch"];
  const heading = "m-0 mb-3 text-[13px] font-semibold uppercase tracking-wider text-text-3";
  const section = "flex flex-col gap-3.5 border-b border-border py-5 first:pt-0";

  return (
    <Drawer
      open
      onClose={onClose}
      className="max-w-[620px]"
      title={
        <div>
          <div>{isAdd ? t("addTitle") : t("editTitle", { name: `${f.first} ${f.last}`.trim() })}</div>
          <div className="text-[12.5px] font-normal text-text-3">{isAdd ? t("addSubtitle") : t("editSubtitle")}</div>
        </div>
      }
      footer={
        <>
          <Button onClick={onClose}>{t("cancel")}</Button>
          {isAdd && (
            <Button onClick={() => save(true)} disabled={atLimit}>
              {t("saveAnother")}
            </Button>
          )}
          <Button variant="primary" onClick={() => save(false)} disabled={atLimit}>
            {isAdd ? t("save") : t("saveChanges")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col">
        {isAdd && (atLimit || left <= 2) && (
          <div role="alert" className={cn("mb-5 flex items-start gap-2.5 rounded-[10px] px-3.5 py-3 text-[13px]", atLimit ? "bg-bad-bg text-bad" : "bg-warn-bg text-warn")}>
            <TriangleAlert size={16} className="mt-0.5 flex-none" />
            {atLimit ? t("planFull", { limit: PLAN_LIMIT }) : t("planNear", { count: left, used: count, limit: PLAN_LIMIT })}
          </div>
        )}
        {tried && errCount > 0 && (
          <div role="alert" className="mb-5 rounded-[10px] bg-bad-bg px-3.5 py-2.5 text-[13px] font-medium text-bad">
            {t("summary", { count: errCount })}
          </div>
        )}

        <section className={section}>
          <h3 className={heading}>{t("personal")}</h3>
          <div className="grid grid-cols-2 gap-3.5">
            <TextField label={`${t("first")} *`} value={f.first} onChange={(e) => set("first", e.target.value)} error={err("first")} />
            <TextField label={`${t("last")} *`} value={f.last} onChange={(e) => set("last", e.target.value)} error={err("last")} />
            <TextField label={f.smartphone ? `${t("phone")} *` : t("phone")} type="tel" placeholder="06 12 34 56 78" value={f.phone} onChange={(e) => set("phone", e.target.value)} error={err("phone")} />
            <TextField label={t("email")} type="email" placeholder="name@company.com" value={f.email} onChange={(e) => set("email", e.target.value)} error={err("email")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium">{t("employeeId")}</span>
            <div className="flex gap-2">
              <div role="group" aria-label={t("employeeId")} className="flex flex-none gap-0.5 rounded-[9px] border border-border p-[3px]">
                {(["auto", "manual"] as const).map((m) => (
                  <button key={m} type="button" aria-pressed={f.idMode === m} onClick={() => set("idMode", m)} className={cn("h-8 rounded-md border-0 px-3 text-[12.5px] font-medium", f.idMode === m ? "bg-accent text-white" : "bg-transparent text-text-2")}>
                    {t(`idMode.${m}`)}
                  </button>
                ))}
              </div>
              <input
                aria-label={t("employeeId")}
                value={f.idMode === "auto" ? (employee?.id ?? autoId) : f.id}
                disabled={f.idMode === "auto"}
                onChange={(e) => set("id", e.target.value)}
                aria-invalid={!!err("id")}
                className={cn("h-10 min-w-0 flex-1 rounded-[9px] border border-solid px-3 font-mono text-[14px] text-text outline-none focus:border-accent disabled:bg-surface-2", err("id") ? "border-bad-dot" : "border-border-strong")}
              />
            </div>
            {err("id") && <span className="text-[12.5px] text-bad">{err("id")}</span>}
          </div>
        </section>

        <section className={section}>
          <h3 className={heading}>{t("employment")}</h3>
          <div className="grid grid-cols-2 gap-3.5">
            <SelectField label={`${t("branch")} *`} value={f.branchId} onChange={(e) => set("branchId", e.target.value)} error={err("branchId")}>
              <option value="">{t("select")}</option>
              {BRANCHES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </SelectField>
            <SelectField label={`${t("jobTitle")} *`} value={f.title} onChange={(e) => set("title", e.target.value as JobTitle)} error={err("title")}>
              <option value="">{t("select")}</option>
              {JOB_TITLES.map((j) => (
                <option key={j} value={j}>
                  {tTitles(j)}
                </option>
              ))}
            </SelectField>
            <SelectField label={t("access")} value={f.access} onChange={(e) => { set("access", e.target.value as AccessRole); set("scope", ""); }}>
              {ACCESS.map((a) => (
                <option key={a} value={a}>
                  {t(`accessRoles.${a}`)}
                </option>
              ))}
            </SelectField>
            {NEEDS_SCOPE.includes(f.access) && (
              <SelectField label={`${t("scope")} *`} value={f.scope} onChange={(e) => set("scope", e.target.value)} error={err("scope")}>
                <option value="">{t("select")}</option>
                {scopeOptions.map((s) => (
                  <option key={s} value={s}>
                    {t(`scopes.${s}`)}
                  </option>
                ))}
              </SelectField>
            )}
            <TextField label={`${t("startDate")} *`} type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} error={err("startDate")} />
            <SelectField label={t("contract")} value={f.contract} onChange={(e) => set("contract", e.target.value as Contract)}>
              {CONTRACTS.map((c) => (
                <option key={c} value={c}>
                  {t(`contracts.${c}`)}
                </option>
              ))}
            </SelectField>
          </div>
          <p className="m-0 text-[12.5px] text-text-3">{t(`accessHint.${f.access}`)}</p>
        </section>

        <section className={section}>
          <h3 className={heading}>{t("sites")}</h3>
          <div className="flex flex-col gap-2">
            {SITES.map((s) => {
              const on = f.siteIds.includes(s.id);
              const isDefault = f.siteIds[0] === s.id;
              return (
                <div key={s.id} className={cn("flex items-center gap-3 rounded-[10px] border border-solid px-3 py-2.5", on ? "border-accent bg-accent-soft" : "border-border bg-surface")}>
                  <input type="checkbox" checked={on} onChange={() => toggleSite(s.id)} aria-label={s.name} className="m-0 size-4 accent-accent" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium">{s.name}</div>
                    <div className="text-[12px] text-text-3">{BRANCHES.find((b) => b.id === s.branchId)?.name}</div>
                  </div>
                  {on && (
                    <button type="button" onClick={() => makeDefault(s.id)} className={cn("h-7 rounded-md border border-solid px-2.5 text-[12px] font-medium", isDefault ? "border-accent bg-accent text-white" : "border-border-strong bg-surface text-text-2")}>
                      {t(isDefault ? "defaultSite" : "makeDefault")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {err("siteIds") ? <span className="text-[12.5px] text-bad">{err("siteIds")}</span> : <span className="text-[12.5px] text-text-3">{f.siteIds.length ? t("sitesSummary", { count: f.siteIds.length, site: SITES.find((s) => s.id === f.siteIds[0])?.name ?? "" }) : t("noSites")}</span>}
        </section>

        <section className={section}>
          <h3 className={heading}>{t("attendance")}</h3>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[13.5px] font-medium">{t("hasSmartphone")}</div>
              <div className="text-[12.5px] text-text-3">{t(f.smartphone ? "smartphoneOn" : "smartphoneOff")}</div>
            </div>
            <Switch checked={f.smartphone} onChange={(v) => set("smartphone", v)} label={t("hasSmartphone")} />
          </div>
          {!f.smartphone && (
            <div className="flex items-center gap-4 rounded-xl border border-border bg-surface-2 p-4">
              <div className="rounded-lg bg-white p-2">
                <QRCodeSVG value={`staffsync://badge/${finalId}?pin=${f.pin}`} size={96} level="M" />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold">{t("badge")}</div>
                <div className="mb-2 text-[12.5px] text-text-3">{t("badgeHint")}</div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-border bg-surface px-2.5 py-1 font-mono text-[18px] font-semibold tracking-[0.2em]">{f.pin}</span>
                  <button type="button" onClick={() => set("pin", newPin())} title={t("newPin")} aria-label={t("newPin")} className="grid size-8 place-items-center rounded-lg border border-solid border-border-strong bg-surface text-text-2">
                    <RefreshCw size={14} />
                  </button>
                  <button type="button" onClick={() => toast(t("badgePrinted"))} className="flex h-8 items-center gap-1.5 rounded-lg border border-solid border-border-strong bg-surface px-2.5 text-[12.5px] font-medium text-text">
                    <Printer size={14} /> {t("print")}
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium">{t("selfie")}</span>
            <div role="group" aria-label={t("selfie")} className="flex gap-0.5 self-start rounded-[9px] border border-border p-[3px]">
              {(["inherit", "on", "off"] as const).map((v) => (
                <button key={v} type="button" aria-pressed={f.selfie === v} onClick={() => set("selfie", v)} className={cn("h-8 rounded-md border-0 px-3 text-[12.5px] font-medium", f.selfie === v ? "bg-accent text-white" : "bg-transparent text-text-2")}>
                  {t(`selfieModes.${v}`)}
                </button>
              ))}
            </div>
            <span className="text-[12.5px] text-text-3">{t(`selfieHint.${f.selfie}`)}</span>
          </div>
        </section>

        <section className={section}>
          <h3 className={heading}>{t("leave")}</h3>
          <SelectField label={t("policy")} value={f.policy} onChange={(e) => { const p = e.target.value as LeavePolicy; set("policy", p); set("balances", { ...POLICIES[p] }); }}>
            {(Object.keys(POLICIES) as LeavePolicy[]).map((p) => (
              <option key={p} value={p}>
                {t(`policies.${p}`)}
              </option>
            ))}
          </SelectField>
          <div className="grid grid-cols-4 gap-3">
            {LEAVE_TYPES.map((k) => (
              <TextField key={k} label={t(`balances.${k}`)} type="number" min={0} step={0.5} value={f.balances[k]} onChange={(e) => set("balances", { ...f.balances, [k]: Number(e.target.value) })} />
            ))}
          </div>
        </section>

        {f.smartphone && (
          <section className="flex flex-col gap-3 py-5 pb-0">
            <h3 className={heading}>{t("invitation")}</h3>
            {([["sms", f.phone.trim() ? t("to", { value: f.phone }) : t("needsPhone"), false], ["mail", f.email ? t("to", { value: f.email }) : t("needsEmail"), f.mail && !f.email]] as const).map(([k, hint, bad]) => (
              <div key={k} className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[13.5px] font-medium">{t(`invite.${k}`)}</div>
                  <div className={cn("text-[12.5px]", bad ? "text-bad" : "text-text-3")}>{hint}</div>
                </div>
                <Switch checked={f[k]} onChange={(v) => set(k, v)} label={t(`invite.${k}`)} />
              </div>
            ))}
          </section>
        )}
      </div>
    </Drawer>
  );
}
