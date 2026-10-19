"use client";

import L, { type LatLngBoundsExpression } from "leaflet";
import { useEffect } from "react";
import { Circle, CircleMarker, MapContainer, Marker, Polygon, Polyline, TileLayer, useMap } from "react-leaflet";
import type { Geofence, LatLng } from "@/types/domain";

export interface RecordMapProps {
  center: LatLng;
  geofence: Geofence;
  checkIn?: { position: LatLng; color: string };
  checkOut?: { position: LatLng };
  /** GPS accuracy ring around the check-in, in meters. */
  accuracy?: number;
}

const CENTER_ICON = L.divIcon({
  className: "",
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  html: '<span style="display:block;width:12px;height:12px;background:var(--accent);transform:rotate(45deg);border-radius:2px;border:2px solid #fff"></span>',
});

const FENCE_STYLE = { color: "#0B67DD", weight: 2, dashArray: "6 4", fillColor: "#0B67DD", fillOpacity: 0.12 } as const;

function Fit({ points }: { points: LatLng[] }) {
  const map = useMap();
  const key = points.map((p) => p.join(",")).join("|");
  useEffect(() => {
    map.fitBounds(points as LatLngBoundsExpression, { padding: [28, 28], maxZoom: 18 });
    // The key captures every position; the array identity changes each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

/** Mini map for a record: geofence, site centre, and where the employee checked in and out. */
export default function RecordMapView({ center, geofence, checkIn, checkOut, accuracy }: RecordMapProps) {
  const fencePoints: LatLng[] =
    geofence.kind === "polygon"
      ? geofence.points
      : [
          [center[0] + geofence.radius / 111_320, center[1]],
          [center[0] - geofence.radius / 111_320, center[1]],
          [center[0], center[1] + geofence.radius / 76_000],
          [center[0], center[1] - geofence.radius / 76_000],
        ];
  const all = [...fencePoints, ...(checkIn ? [checkIn.position] : []), ...(checkOut ? [checkOut.position] : [])];

  return (
    <MapContainer center={center} zoom={16} className="size-full" scrollWheelZoom={false} attributionControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
      <Fit points={all} />
      {geofence.kind === "circle" ? (
        <Circle center={center} radius={geofence.radius} pathOptions={FENCE_STYLE} />
      ) : (
        <Polygon positions={geofence.points} pathOptions={FENCE_STYLE} />
      )}
      <Marker position={center} icon={CENTER_ICON} interactive={false} />
      {checkIn && (
        <>
          <Polyline positions={[center, checkIn.position]} pathOptions={{ color: checkIn.color, weight: 1.5, dashArray: "3 3" }} />
          {accuracy ? <Circle center={checkIn.position} radius={accuracy} pathOptions={{ color: checkIn.color, weight: 1, fillColor: checkIn.color, fillOpacity: 0.1 }} /> : null}
          <CircleMarker center={checkIn.position} radius={7} pathOptions={{ color: "#fff", weight: 2, fillColor: checkIn.color, fillOpacity: 1 }} />
        </>
      )}
      {checkOut && (
        <>
          <Polyline positions={[center, checkOut.position]} pathOptions={{ color: "#8B5CF6", weight: 1.5, dashArray: "3 3" }} />
          <CircleMarker center={checkOut.position} radius={7} pathOptions={{ color: "#fff", weight: 2, fillColor: "#8B5CF6", fillOpacity: 1 }} />
        </>
      )}
    </MapContainer>
  );
}
