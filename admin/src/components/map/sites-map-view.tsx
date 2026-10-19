"use client";

import L, { type LatLngBoundsExpression } from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { LatLng } from "@/types/domain";

export type PinTone = "ok" | "warn" | "bad" | "neutral";

export interface SitePin {
  id: string;
  position: LatLng;
  tone: PinTone;
  /** "41/48" */
  count: string;
  label: string;
}

export interface SitesMapProps {
  pins: SitePin[];
  selectedId?: string | null;
  onSelect: (id: string | null) => void;
}

const ICONS: Record<PinTone, string> = {
  ok: '<path d="M5 12l5 5L20 7"/>',
  warn: '<path d="M12 6v8M12 18h.01"/>',
  bad: '<path d="M18 6L6 18M6 6l12 12"/>',
  neutral: '<path d="M5 12h14"/>',
};

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function pinIcon(pin: SitePin, selected: boolean) {
  const color = `var(--${pin.tone}-dot)`;
  return L.divIcon({
    className: "ss-pin-wrap",
    iconSize: [0, 0],
    html: `<div class="ss-pin${selected ? " ss-pin-selected" : ""}">
      <span class="ss-pin-body">
        <span class="ss-pin-badge" style="background:${color}"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${ICONS[pin.tone]}</svg></span>
        <span class="ss-pin-count">${escapeHtml(pin.count)}</span>
        <span class="ss-pin-label">${escapeHtml(pin.label)}</span>
      </span>
      <span class="ss-pin-stem" style="background:${color}"></span>
      <span class="ss-pin-tip" style="background:${color}"></span>
    </div>`,
  });
}

function FitToPins({ pins }: { pins: SitePin[] }) {
  const map = useMap();
  const key = pins.map((p) => `${p.id}:${p.position.join(",")}`).join("|");
  useEffect(() => {
    if (pins.length === 0) return;
    if (pins.length === 1) {
      map.setView(pins[0].position, 14);
      return;
    }
    map.fitBounds(pins.map((p) => p.position) as LatLngBoundsExpression, { padding: [60, 60], maxZoom: 13 });
    // `key` captures every position change; the pins array identity changes on each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

/** Clicking empty map closes any open site card. */
function ClickAway({ onSelect }: Pick<SitesMapProps, "onSelect">) {
  useMapEvents({ click: () => onSelect(null) });
  return null;
}

export default function SitesMapView({ pins, selectedId, onSelect }: SitesMapProps) {
  const first = useMemo(() => pins[0]?.position ?? ([46.6, 2.5] as LatLng), [pins]);
  return (
    <MapContainer center={first} zoom={6} scrollWheelZoom className="size-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <ClickAway onSelect={onSelect} />
      <FitToPins pins={pins} />
      {pins.map((pin) => (
        <Marker
          key={`${pin.id}-${pin.tone}-${pin.count}-${selectedId === pin.id}`}
          position={pin.position}
          icon={pinIcon(pin, selectedId === pin.id)}
          title={`${pin.label} · ${pin.count}`}
          zIndexOffset={selectedId === pin.id ? 1000 : 0}
          eventHandlers={{ click: () => onSelect(selectedId === pin.id ? null : pin.id) }}
        />
      ))}
    </MapContainer>
  );
}
