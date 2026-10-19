"use client";

import L, { type LatLngExpression } from "leaflet";
import { useEffect } from "react";
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { LatLng } from "@/features/onboarding/types";

export interface GeofencePickerProps {
  /** Pin position. */
  pin: LatLng;
  /** Geofence radius in meters. */
  radius: number;
  onPick: (position: LatLng) => void;
  /** Changing this value moves the camera to `pin` (used after choosing a searched address). */
  focusKey?: number;
}

const PIN_ICON = L.divIcon({
  className: "",
  iconSize: [32, 40],
  iconAnchor: [16, 38],
  html: `<svg width="32" height="40" viewBox="0 0 32 40" aria-hidden="true"><path d="M16 38C16 38 3 24.5 3 15a13 13 0 0 1 26 0c0 9.5-13 23-13 23z" fill="#0B67DD" stroke="#fff" stroke-width="2"/><circle cx="16" cy="15" r="5" fill="#fff"/></svg>`,
});

function ClickToPlace({ onPick }: Pick<GeofencePickerProps, "onPick">) {
  useMapEvents({ click: (e) => onPick([e.latlng.lat, e.latlng.lng]) });
  return null;
}

function Follow({ pin, focusKey }: Pick<GeofencePickerProps, "pin" | "focusKey">) {
  const map = useMap();
  useEffect(() => {
    if (focusKey) map.flyTo(pin, Math.max(map.getZoom(), 16), { duration: 0.8 });
    // Only the focus key should move the camera; plain clicks keep the current view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, map]);
  return null;
}

export default function GeofencePicker({ pin, radius, onPick, focusKey }: GeofencePickerProps) {
  const center: LatLngExpression = pin;
  return (
    <MapContainer center={center} zoom={16} scrollWheelZoom className="size-full cursor-crosshair">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <Circle
        center={center}
        radius={radius}
        pathOptions={{ color: "#0B67DD", weight: 2, dashArray: "7 5", fillColor: "#0B67DD", fillOpacity: 0.14 }}
      />
      <Marker position={center} icon={PIN_ICON} />
      <ClickToPlace onPick={onPick} />
      <Follow pin={pin} focusKey={focusKey} />
    </MapContainer>
  );
}
