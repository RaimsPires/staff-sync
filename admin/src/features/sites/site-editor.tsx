"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, LocateFixed, MapPin, Printer, Search, TriangleAlert, ZoomIn, ZoomOut } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { GeofenceEditor } from "@/components/map/geofence-editor";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { EMPLOYEES } from "@/data/employees";
import { MANAGER_POOL, TIMEZONES_EU } from "@/data/sites";
import { distanceMeters, formatArea, formatLength, geofenceMetrics, hexagonAround } from "@/lib/geo";
import { downloadText } from "@/lib/export";
import { useDebounced } from "@/lib/use-debounced";
import { cn } from "@/lib/utils";
import { searchAddress, type GeocodeResult } from "@/services/geocode";
import { useSites } from "@/store/sites";
import type { Geofence, LatLng } from "@/types/domain";
import type { ManagedSite } from "@/types/site";

const DEFAULT_VIEW: LatLng = [46.6, 2.5];
const card = "rounded-xl border border-border bg-surface shadow-card";
const input = "h-10 w-full min-w-0 rounded-[9px] border border-solid bg-surface px-3 text-[14px] text-text outline-none focus:border-accent";
const label = "flex flex-col gap-1.5 text-[13px] font-medium";

interface Form {
  name: string;
  code: string;
  codeTouched: boolean;
  branchId: string;
  timezone: string;
  address: string;
  managers: string[];
  assigned: string[];
  hoursStart: string;
  hoursEnd: string;
  breakMinutes: string;
  requireSelfie: boolean;
  requireQr: boolean;
  registeredDeviceOnly: boolean;
  allowOffline: boolean;
  minAccuracy: string;
  active: boolean;
  shape: "circle" | "polygon";
  center: LatLng | null;
  radius: number;
  points: LatLng[];
  drawing: boolean;
}

function initial(site: ManagedSite | null): Form {
  const poly = site?.geofence.kind === "polygon";
  return {
    name: site?.name ?? "", code: site?.code ?? "", codeTouched: !!site, branchId: site?.branchId ?? "lyon", timezone: site?.timezone ?? "Europe/Paris",
    address: site?.address ?? "", managers: site ? [...site.managers] : [], assigned: [], hoursStart: site?.hours.start ?? "08:00", hoursEnd: site?.hours.end ?? "16:00",
    breakMinutes: String(site?.hours.breakMinutes ?? 30), requireSelfie: site?.requireSelfie ?? true, requireQr: site?.requireQr ?? true,
    registeredDeviceOnly: site?.registeredDeviceOnly ?? false, allowOffline: site?.allowOffline ?? true, minAccuracy: String(site?.minAccuracy ?? 50), active: site?.active ?? true,
    shape: poly ? "polygon" : "circle", center: site && !poly ? site.position : null,
    radius: site?.geofence.kind === "circle" ? site.geofence.radius : 150, points: site?.geofence.kind === "polygon" ? site.geofence.points : [], drawing: false,
  };
}

export function SiteEditor({ siteId }: { siteId: string | null }) {
  const sites = useSites((s) => s.sites);
  const existing = siteId ? (sites.find((s) => s.id === siteId) ?? null) : null;
  // A fresh form per site so edits never leak between sites.
  return <Editor key={existing?.id ?? "new"} site={existing} />;
}

function Editor({ site }: { site: ManagedSite | null }) {
  const t = useTranslations("Sites.editor");
  const tc = useTranslations("Sites");
  const locale = useLocale();
  const router = useRouter();
  const toast = useToast();
  const sites = useSites((s) => s.sites);
  const branches = useSites((s) => s.branches);
  const saveSite = useSites((s) => s.saveSite);

  const [f, setF] = useState<Form>(() => initial(site));
  const [tried, setTried] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [empQuery, setEmpQuery] = useState("");
  const [focus, setFocus] = useState({ key: 0, view: site?.position ?? DEFAULT_VIEW, zoom: site ? 16 : 5 });
  const mapRef = useRef<HTMLDivElement>(null);
  const isNew = !site;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const moveCamera = (view: LatLng, zoom = 17) => setFocus((c) => ({ key: c.key + 1, view, zoom }));

  const geofence: Geofence | null =
    f.shape === "circle" ? (f.center && f.radius >= 30 ? { kind: "circle", radius: f.radius } : null)
    : f.points.length >= 3 && !f.drawing ? { kind: "polygon", points: f.points, hectares: 0 } : null;
  const metrics = geofence ? geofenceMetrics(geofence, f.center ?? f.points[0]) : null;
  const position: LatLng | null = metrics?.center ?? null;

  const overlaps = metrics && position
    ? sites.filter((s) => s.id !== site?.id && s.active && distanceMeters(s.position, position) < (s.geofence.kind === "circle" ? s.geofence.radius : 90) + metrics.radius)
    : [];

  const errors = (): Record<string, string> => {
    const e: Record<string, string> = {};
    const others = sites.filter((s) => s.id !== site?.id);
    if (!f.name.trim()) e.name = "nameRequired";
    else if (others.some((s) => s.name.toLowerCase() === f.name.trim().toLowerCase())) e.name = "nameExists";
    if (!f.code.trim()) e.code = "codeRequired";
    else if (others.some((s) => s.code.toUpperCase() === f.code.trim().toUpperCase())) e.code = "codeExists";
    if (!f.address.trim()) e.address = "addressRequired";
    if (!geofence) e.geo = f.shape === "circle" ? (f.center ? "radiusMin" : "placePin") : "finishShape";
    const acc = Number(f.minAccuracy);
    if (!(acc >= 5 && acc <= 500)) e.accuracy = "accuracyRange";
    if (f.hoursEnd <= f.hoursStart) e.hours = "hoursOrder";
    return e;
  };
  const errs = tried ? errors() : {};
  const err = (k: string) => (errs[k] ? t(`errors.${errs[k]}`) : undefined);
  const errCount = Object.keys(errs).length;

  const debouncedAddress = useDebounced(f.address.trim(), 450);
  const suggestions = useQuery({
    queryKey: ["geocode", locale, debouncedAddress],
    queryFn: ({ signal }) => searchAddress(debouncedAddress, locale, signal),
    enabled: suggestOpen && debouncedAddress.length >= 3,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const pickAddress = (r: GeocodeResult) => {
    setF((x) => ({
      ...x, address: [r.line1, r.line2].filter(Boolean).join(", "),
      center: x.shape === "circle" ? r.position : x.center,
      points: x.shape === "polygon" && x.points.length ? hexagonAround(r.position, Math.max(60, x.radius)) : x.points,
    }));
    setSuggestOpen(false);
    moveCamera(r.position);
  };

  const switchShape = (shape: Form["shape"]) => {
    if (shape === f.shape) return;
    if (shape === "polygon") {
      if (f.center) setF({ ...f, shape, points: hexagonAround(f.center, f.radius), drawing: false });
      else setF({ ...f, shape, points: [], drawing: true });
    } else {
      setF({ ...f, shape, drawing: false, center: metrics?.center ?? f.center, radius: metrics ? Math.max(30, Math.round(metrics.radius / 10) * 10) : f.radius });
    }
  };

  const locate = () => {
    const fallback = () => toast(t("locateUnavailable"), "info");
    if (!navigator.geolocation) return fallback();
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const here: LatLng = [p.coords.latitude, p.coords.longitude];
        setF((x) => (x.shape === "circle" ? { ...x, center: here } : x));
        moveCamera(here);
        toast(t("locateDone"));
      },
      fallback,
      { timeout: 5000 },
    );
  };

  const save = () => {
    setTried(true);
    if (Object.keys(errors()).length > 0 || !geofence || !position || !metrics) return;
    const geo: Geofence = geofence.kind === "polygon" ? { ...geofence, hectares: Math.round((metrics.area / 10_000) * 10) / 10 } : geofence;
    const saved = {
      id: site?.id, name: f.name.trim(), code: f.code.trim().toUpperCase(), branchId: f.branchId, address: f.address.trim(), timezone: f.timezone,
      position, geofence: geo, managers: f.managers, employees: f.assigned.length || site?.employees || 0, expected: site?.expected ?? 0, present: site?.present ?? 0,
      requireSelfie: f.requireSelfie, requireQr: f.requireQr, registeredDeviceOnly: f.registeredDeviceOnly, allowOffline: f.allowOffline, minAccuracy: Number(f.minAccuracy),
      active: f.active, hours: { start: f.hoursStart, end: f.hoursEnd, breakMinutes: Number(f.breakMinutes) || 0 },
    };
    const id = saveSite(saved);
    toast(isNew ? tc("toasts.created", { name: saved.name }) : tc("toasts.updated"));
    router.push(`/sites/${id}`);
  };

  const code = f.code.trim().toUpperCase();
  const qrValue = `staffsync://site/${code || "NEW"}`;
  const downloadQr = () => {
    const svg = mapRef.current?.ownerDocument.getElementById("site-qr");
    if (!svg) return;
    downloadText(`qr-${code || "site"}.svg`, new XMLSerializer().serializeToString(svg), "image/svg+xml");
    toast(t("qrDownloaded"));
  };

  const hint = f.shape === "circle" ? (f.center ? t("hint.circleSet") : t("hint.circleEmpty")) : f.drawing ? (f.points.length < 3 ? t("hint.polyDrawing", { count: f.points.length }) : t("hint.polyClose")) : t("hint.polyEdit");
  const empMatches = EMPLOYEES.filter((e) => e.name.toLowerCase().includes(empQuery.toLowerCase()));
  const toggles = [
    ["requireSelfie", "selfie"], ["requireQr", "qr"], ["registeredDeviceOnly", "device"], ["allowOffline", "offline"],
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => router.push(site ? `/sites/${site.id}` : "/sites")} className="flex h-[30px] items-center gap-1.5 rounded-lg border-0 bg-transparent py-0 pl-1.5 pr-2.5 text-[13px] text-text-2 hover:bg-hover">
          <ArrowLeft size={15} /> {tc("title")}
        </button>
        <h1 className="m-0 text-[20px] font-semibold tracking-tight">{isNew ? t("addTitle") : t("editTitle", { name: f.name })}</h1>
        <div className="flex-1" />
        <Button onClick={() => router.push(site ? `/sites/${site.id}` : "/sites")}>{t("cancel")}</Button>
        <Button variant="primary" onClick={save}>{isNew ? t("create") : t("saveChanges")}</Button>
      </div>

      {tried && errCount > 0 && <div role="alert" className="rounded-[10px] bg-bad-bg px-3.5 py-[11px] text-[13px] font-medium text-bad">{t("summary", { count: errCount })}</div>}
      {overlaps.length > 0 && (
        <div role="alert" className="flex items-start gap-2.5 rounded-[10px] bg-warn-bg px-3.5 py-[11px] text-[13px] text-warn">
          <TriangleAlert size={16} className="mt-0.5 flex-none" />
          <span><strong>{t("overlap.title")}</strong> {t("overlap.body", { names: overlaps.map((s) => s.name).join(", ") })}</span>
        </div>
      )}

      <div className="flex flex-wrap items-start gap-4">
        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4">
          <section className={cn(card, "flex flex-col gap-3.5 p-[18px]")}>
            <h2 className="m-0 text-[14.5px] font-semibold">{t("basics")}</h2>
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <label className={label}>{t("name")}
                <input value={f.name} onChange={(e) => { const v = e.target.value; setF((x) => ({ ...x, name: v, code: x.codeTouched ? x.code : v.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase() })); }} aria-invalid={!!err("name")} className={cn(input, err("name") ? "border-bad-dot" : "border-border-strong")} />
                {err("name") && <span className="text-[12.5px] font-normal text-bad">{err("name")}</span>}
              </label>
              <label className={label}>{t("code")}
                <input value={f.code} onChange={(e) => setF((x) => ({ ...x, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""), codeTouched: true }))} aria-invalid={!!err("code")} className={cn(input, "font-mono", err("code") ? "border-bad-dot" : "border-border-strong")} />
                {err("code") && <span className="text-[12.5px] font-normal text-bad">{err("code")}</span>}
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className={label}>{t("branch")}
                <select value={f.branchId} onChange={(e) => set("branchId", e.target.value)} className={cn(input, "border-border-strong")}>
                  {branches.filter((b) => !b.archived).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
              <label className={label}>{t("timezone")}
                <select value={f.timezone} onChange={(e) => set("timezone", e.target.value)} className={cn(input, "border-border-strong")}>
                  {TIMEZONES_EU.map((z) => <option key={z}>{z}</option>)}
                </select>
              </label>
            </div>
            <div className="relative flex flex-col gap-1.5">
              <label htmlFor="site-address" className="text-[13px] font-medium">{t("address")}</label>
              <div className={cn("flex h-10 items-center gap-2 rounded-[9px] border border-solid bg-surface px-3 text-text-3 focus-within:border-accent", err("address") ? "border-bad-dot" : "border-border-strong")}>
                <Search size={15} />
                <input id="site-address" value={f.address} role="combobox" aria-expanded={suggestOpen} aria-controls="site-address-list" autoComplete="off" onChange={(e) => { set("address", e.target.value); setSuggestOpen(true); }} onFocus={() => f.address.trim().length >= 3 && setSuggestOpen(true)} placeholder={t("addressPlaceholder")} className="min-w-0 flex-1 border-0 bg-transparent text-[14px] text-text outline-0" />
              </div>
              {suggestOpen && debouncedAddress.length >= 3 && (
                <ul id="site-address-list" role="listbox" className="absolute inset-x-0 top-[70px] z-[1000] m-0 list-none overflow-hidden rounded-[10px] border border-border bg-surface p-0 shadow-pop">
                  {suggestions.isFetching && <li className="px-3 py-2.5 text-[13px] text-text-3">{t("searching")}</li>}
                  {!suggestions.isFetching && suggestions.isError && <li className="px-3 py-2.5 text-[13px] text-bad">{t("searchFailed")}</li>}
                  {!suggestions.isFetching && !suggestions.isError && suggestions.data?.length === 0 && <li className="px-3 py-2.5 text-[13px] text-text-3">{t("noResults")}</li>}
                  {!suggestions.isFetching && suggestions.data?.map((r) => (
                    <li key={r.id} role="option" aria-selected={false}>
                      <button type="button" onClick={() => pickAddress(r)} className="flex w-full items-start gap-2.5 border-0 bg-transparent px-3 py-2.5 text-left text-text hover:bg-hover">
                        <MapPin size={15} className="mt-0.5 flex-none text-text-3" />
                        <span><span className="block text-[13.5px] font-medium">{r.line1}</span><span className="block text-[12px] text-text-3">{r.line2}</span></span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {err("address") && <span className="text-[12.5px] text-bad">{err("address")}</span>}
            </div>
          </section>

          <section className={cn(card, "flex flex-col gap-3 p-[18px]")}>
            <h2 className="m-0 text-[14.5px] font-semibold">{t("managers")}</h2>
            <div className="flex flex-wrap gap-1.5">
              {MANAGER_POOL.map((m) => {
                const on = f.managers.includes(m.name);
                return <button key={m.name} type="button" aria-pressed={on} onClick={() => set("managers", on ? f.managers.filter((n) => n !== m.name) : [...f.managers, m.name])} className={cn("h-8 rounded-full border border-solid px-3 text-[12.5px] font-medium", on ? "border-accent bg-accent text-white" : "border-border-strong bg-surface text-text-2")}>{m.name}</button>;
              })}
            </div>
            <h2 className="m-0 mt-1 text-[14.5px] font-semibold">{t("employees")} <span className="font-normal text-text-3">({f.assigned.length})</span></h2>
            <input value={empQuery} onChange={(e) => setEmpQuery(e.target.value)} placeholder={t("searchEmployees")} aria-label={t("searchEmployees")} className={cn(input, "h-9 border-border-strong")} />
            <div className="max-h-44 overflow-auto rounded-[10px] border border-border">
              {empMatches.map((e) => {
                const on = f.assigned.includes(e.name);
                return (
                  <label key={e.id} className="flex cursor-pointer items-center gap-2.5 border-b border-border px-3 py-2 text-[13px] last:border-b-0 hover:bg-hover">
                    <input type="checkbox" checked={on} onChange={() => set("assigned", on ? f.assigned.filter((n) => n !== e.name) : [...f.assigned, e.name])} className="m-0 size-4 accent-accent" />
                    {e.name}
                  </label>
                );
              })}
            </div>
          </section>

          <section className={cn(card, "flex flex-col gap-3.5 p-[18px]")}>
            <h2 className="m-0 text-[14.5px] font-semibold">{t("hours")}</h2>
            <div className="grid grid-cols-3 gap-3">
              <label className={label}>{t("start")}<input type="time" value={f.hoursStart} onChange={(e) => set("hoursStart", e.target.value)} className={cn(input, "font-mono", err("hours") ? "border-bad-dot" : "border-border-strong")} /></label>
              <label className={label}>{t("end")}<input type="time" value={f.hoursEnd} onChange={(e) => set("hoursEnd", e.target.value)} className={cn(input, "font-mono", err("hours") ? "border-bad-dot" : "border-border-strong")} /></label>
              <label className={label}>{t("break")}<input type="number" min={0} value={f.breakMinutes} onChange={(e) => set("breakMinutes", e.target.value)} className={cn(input, "border-border-strong")} /></label>
            </div>
            {err("hours") && <span className="text-[12.5px] text-bad">{err("hours")}</span>}
            <h2 className="m-0 mt-1 text-[14.5px] font-semibold">{t("verification")}</h2>
            {toggles.map(([key, k]) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <div><div className="text-[13.5px] font-medium">{t(`toggles.${k}.title`)}</div><div className="text-[12.5px] text-text-3">{t(`toggles.${k}.hint`)}</div></div>
                <Switch checked={f[key]} onChange={(v) => set(key, v)} label={t(`toggles.${k}.title`)} />
              </div>
            ))}
            <label className={label}>{t("accuracy")}
              <input type="number" value={f.minAccuracy} onChange={(e) => set("minAccuracy", e.target.value)} aria-invalid={!!err("accuracy")} className={cn(input, "w-32", err("accuracy") ? "border-bad-dot" : "border-border-strong")} />
              {err("accuracy") && <span className="text-[12.5px] font-normal text-bad">{err("accuracy")}</span>}
            </label>
            <div role="group" aria-label={t("status")} className="flex gap-0.5 self-start rounded-[9px] border border-border p-[3px]">
              {([true, false] as const).map((v) => <button key={String(v)} type="button" aria-pressed={f.active === v} onClick={() => set("active", v)} className={cn("h-8 rounded-md border-0 px-3.5 text-[12.5px] font-medium", f.active === v ? "bg-accent text-white" : "bg-transparent text-text-2")}>{t(v ? "active" : "inactive")}</button>)}
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-[1.4_1_460px] flex-col gap-4">
          <section className={cn(card, "overflow-hidden", err("geo") && "border-bad-dot")}>
            <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-3.5 py-2.5">
              <h2 className="m-0 mr-auto text-[14.5px] font-semibold">{t("geofence")}</h2>
              <div role="group" aria-label={t("shape")} className="flex gap-0.5 rounded-[9px] border border-border p-[3px]">
                {(["circle", "polygon"] as const).map((k) => <button key={k} type="button" aria-pressed={f.shape === k} onClick={() => switchShape(k)} className={cn("h-7 rounded-md border-0 px-3 text-[12.5px] font-medium", f.shape === k ? "bg-accent text-white" : "bg-transparent text-text-2")}>{t(`shapes.${k}`)}</button>)}
              </div>
              <div role="group" aria-label={t("mapType")} className="flex gap-0.5 rounded-[9px] border border-border p-[3px]">
                {([false, true] as const).map((sat) => <button key={String(sat)} type="button" aria-pressed={satellite === sat} onClick={() => setSatellite(sat)} className={cn("h-7 rounded-md border-0 px-3 text-[12.5px] font-medium", satellite === sat ? "bg-accent text-white" : "bg-transparent text-text-2")}>{t(sat ? "satellite" : "street")}</button>)}
              </div>
              <button type="button" onClick={locate} title={t("locate")} aria-label={t("locate")} className="grid size-8 place-items-center rounded-lg border border-solid border-border-strong bg-surface text-text-2"><LocateFixed size={15} /></button>
            </div>
            <div ref={mapRef} className="relative z-0 h-[460px] bg-map-bg">
              <div className="absolute inset-0">
                <GeofenceEditor
                  shape={f.shape} center={f.center} radius={f.radius} points={f.points} drawing={f.drawing} satellite={satellite}
                  neighbours={sites.filter((s) => s.id !== site?.id && s.active).map((s) => ({ id: s.id, name: s.name, position: s.position, radius: s.geofence.kind === "circle" ? s.geofence.radius : 90 }))}
                  view={focus.view} zoom={focus.zoom} focusKey={focus.key}
                  onCenter={(p) => set("center", p)} onRadius={(r) => set("radius", r)} onPoints={(pts) => set("points", pts)} onFinish={() => set("drawing", false)}
                  onNotice={() => toast(t("hint.minVertices"), "info")}
                />
              </div>
              <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[12.5px] text-text-2 shadow-card">{hint}</div>
              <div className="absolute right-3 top-3 z-[500] flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-card">
                <button type="button" onClick={() => setFocus((c) => ({ ...c, key: c.key + 1, zoom: Math.min(19, c.zoom + 1) }))} aria-label={t("zoomIn")} className="grid size-8 place-items-center border-0 border-b border-border bg-transparent text-text-2"><ZoomIn size={15} /></button>
                <button type="button" onClick={() => setFocus((c) => ({ ...c, key: c.key + 1, zoom: Math.max(3, c.zoom - 1) }))} aria-label={t("zoomOut")} className="grid size-8 place-items-center border-0 bg-transparent text-text-2"><ZoomOut size={15} /></button>
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-border p-3.5">
              {f.shape === "circle" ? (
                <label className={label}>{t("radius")}
                  <div className="flex items-center gap-3">
                    <input type="range" min={30} max={1000} step={10} value={Math.min(f.radius, 1000)} onChange={(e) => set("radius", Number(e.target.value))} className="flex-1" aria-label={t("radius")} />
                    <input type="number" min={30} value={f.radius} onChange={(e) => set("radius", Math.max(0, Number(e.target.value) || 0))} className={cn(input, "h-9 w-24 font-mono")} aria-label={t("radiusMeters")} />
                    <span className="text-[13px] text-text-3">m</span>
                  </div>
                </label>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] text-text-2">{t("vertices", { count: f.points.length })}</span>
                  <div className="flex-1" />
                  {f.drawing && <Button size="sm" variant="primary" disabled={f.points.length < 3} onClick={() => set("drawing", false)}>{t("finishShape")}</Button>}
                  <Button size="sm" onClick={() => setF((x) => ({ ...x, points: [], drawing: true }))}>{t("redraw")}</Button>
                </div>
              )}
              {err("geo") && <span className="text-[12.5px] text-bad">{err("geo")}</span>}
              <dl className="m-0 grid grid-cols-3 gap-3">
                {([["area", metrics ? formatArea(metrics.area) : "—"], ["perimeter", metrics ? formatLength(metrics.perimeter) : "—"], ["center", position ? `${position[0].toFixed(5)}, ${position[1].toFixed(5)}` : "—"]] as const).map(([k, v]) => (
                  <div key={k}><dt className="text-[11.5px] text-text-3">{t(`measures.${k}`)}</dt><dd className="m-0 font-mono text-[13px] font-medium">{v}</dd></div>
                ))}
              </dl>
            </div>
          </section>

          <section className={cn(card, "flex items-center gap-4 p-[18px]")}>
            <div className="rounded-lg bg-white p-2.5"><QRCodeSVG id="site-qr" value={qrValue} size={112} level="M" marginSize={1} /></div>
            <div className="min-w-0 flex-1">
              <h2 className="m-0 text-[14.5px] font-semibold">{t("qr.title")}</h2>
              <p className="mb-2.5 mt-1 text-[12.5px] text-text-3">{isNew && !f.code ? t("qr.preview") : t(f.requireQr ? "qr.required" : "qr.optional")}</p>
              <code className="mb-2.5 block truncate rounded-md bg-surface-2 px-2 py-1 font-mono text-[12px] text-text-2">{qrValue}</code>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => window.print()}><Printer size={14} /> {t("qr.print")}</Button>
                <Button size="sm" onClick={downloadQr}><Download size={14} /> {t("qr.download")}</Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
