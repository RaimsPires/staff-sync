"use client";

import L, { type LatLngBoundsExpression } from "leaflet";
import { useEffect } from "react";
import { Circle, CircleMarker, MapContainer, Marker, Polygon, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { Geofence, LatLng } from "@/types/domain";

export interface MapPoint {
  id: string;
  position: LatLng;
  color: string;
  label: string;
  emphasised?: boolean;
}

export interface PointsMapProps {
  center: LatLng;
  geofence: Geofence;
  points: MapPoint[];
}

const CENTER_ICON = L.divIcon({
  className: "",
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  html: '<span style="display:block;width:12px;height:12px;background:var(--accent);transform:rotate(45deg);border-radius:2px;border:2px solid #fff"></span>',
});
const FENCE = { color: "#0B67DD", weight: 2, dashArray: "6 4", fillColor: "#0B67DD", fillOpacity: 0.12 } as const;

function Fit({ points }: { points: LatLng[] }) {
  const map = useMap();
  const key = points.map((p) => p.join(",")).join("|");
  useEffect(() => {
    map.fitBounds(points as LatLngBoundsExpression, { padding: [30, 30], maxZoom: 18 });
    // The key captures every position; the array identity changes each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

/** Site boundary with a dot per employee check-in. */
export default function PointsMapView({ center, geofence, points }: PointsMapProps) {
  const edge: LatLng[] =
    geofence.kind === "polygon"
      ? geofence.points
      : [[center[0] + geofence.radius / 111_320, center[1]], [center[0] - geofence.radius / 111_320, center[1]], [center[0], center[1] + geofence.radius / 76_000], [center[0], center[1] - geofence.radius / 76_000]];
  return (
    <MapContainer center={center} zoom={16} className="size-full" scrollWheelZoom={false}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
      <Fit points={[...edge, ...points.map((p) => p.position)]} />
      {geofence.kind === "circle" ? <Circle center={center} radius={geofence.radius} pathOptions={FENCE} /> : <Polygon positions={geofence.points} pathOptions={FENCE} />}
      <Marker position={center} icon={CENTER_ICON} interactive={false} />
      {points.map((p) => (
        <CircleMarker key={p.id} center={p.position} radius={p.emphasised ? 8 : 6} pathOptions={{ color: "#fff", weight: 2, fillColor: p.color, fillOpacity: 1 }}>
          <Tooltip direction="top">{p.label}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
