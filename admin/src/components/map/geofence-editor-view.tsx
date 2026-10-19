"use client";

import L, { type LatLngBoundsExpression, type LeafletMouseEvent } from "leaflet";
import { useEffect } from "react";
import { Circle, CircleMarker, MapContainer, Marker, Polygon, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import { distanceMeters, offsetMeters } from "@/lib/geo";
import type { LatLng } from "@/types/domain";

export interface NeighbourSite {
  id: string;
  name: string;
  position: LatLng;
  radius: number;
}

export interface GeofenceEditorProps {
  shape: "circle" | "polygon";
  center: LatLng | null;
  radius: number;
  points: LatLng[];
  drawing: boolean;
  neighbours: NeighbourSite[];
  satellite: boolean;
  /** Initial camera. */
  view: LatLng;
  /** Bumping this recentres the camera on `view`. */
  focusKey: number;
  zoom: number;
  onCenter: (p: LatLng) => void;
  onRadius: (meters: number) => void;
  onPoints: (pts: LatLng[]) => void;
  onFinish: () => void;
  onNotice: (key: "minVertices") => void;
}

const ACCENT = "#0B67DD";
const STYLE = { color: ACCENT, weight: 2, dashArray: "6 4", fillColor: ACCENT, fillOpacity: 0.18 } as const;
const PIN_ICON = L.divIcon({
  className: "",
  iconSize: [32, 40],
  iconAnchor: [16, 38],
  html: `<svg width="32" height="40" viewBox="0 0 32 40" aria-hidden="true"><path d="M16 38C16 38 3 24.5 3 15a13 13 0 0 1 26 0c0 9.5-13 23-13 23z" fill="${ACCENT}" stroke="#fff" stroke-width="2"/><circle cx="16" cy="15" r="5" fill="#fff"/></svg>`,
});
const HANDLE_ICON = L.divIcon({
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  html: `<span style="display:block;width:18px;height:18px;border-radius:50%;background:#fff;border:3px solid ${ACCENT};box-shadow:0 1px 4px rgb(0 0 0/.35);cursor:ew-resize"></span>`,
});
const VERTEX_ICON = L.divIcon({
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:#fff;border:3px solid ${ACCENT};box-shadow:0 1px 4px rgb(0 0 0/.35);cursor:move"></span>`,
});

const ll = (e: { latlng: { lat: number; lng: number } }): LatLng => [e.latlng.lat, e.latlng.lng];

function Interactions({ props }: { props: GeofenceEditorProps }) {
  useMapEvents({
    click: (e: LeafletMouseEvent) => {
      if (props.shape === "circle") props.onCenter(ll(e));
      else if (props.drawing) props.onPoints([...props.points, ll(e)]);
    },
  });
  return null;
}

function Camera({ view, zoom, focusKey }: Pick<GeofenceEditorProps, "view" | "zoom" | "focusKey">) {
  const map = useMap();
  useEffect(() => {
    map.setView(view, zoom, { animate: focusKey > 0 });
    // Only an explicit focus request moves the camera, never ordinary edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, map]);
  return null;
}

function FitOnShapeSwitch({ props }: { props: GeofenceEditorProps }) {
  const map = useMap();
  const closed = props.shape === "polygon" && !props.drawing && props.points.length >= 3;
  useEffect(() => {
    if (closed) map.fitBounds(props.points as LatLngBoundsExpression, { padding: [60, 60], maxZoom: 18 });
    // Fit once when a polygon is closed or loaded, not on every vertex drag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closed, map]);
  return null;
}

export default function GeofenceEditorView(props: GeofenceEditorProps) {
  const { shape, center, radius, points, drawing, neighbours, satellite, view, zoom } = props;
  const closed = shape === "polygon" && !drawing && points.length >= 3;
  const handle = center ? offsetMeters(center, radius, 0) : null;
  const cursor = (shape === "circle" && !center) || (shape === "polygon" && drawing) ? "crosshair" : "grab";

  return (
    <MapContainer center={view} zoom={zoom} scrollWheelZoom className="size-full" style={{ cursor }} doubleClickZoom={false}>
      {satellite ? (
        <TileLayer
          key="sat"
          attribution="Tiles &copy; Esri"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
      ) : (
        <TileLayer key="street" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
      )}
      <Camera view={view} zoom={zoom} focusKey={props.focusKey} />
      <FitOnShapeSwitch props={props} />
      <Interactions props={props} />

      {neighbours.map((n) => (
        <Circle key={n.id} center={n.position} radius={n.radius} pathOptions={{ color: "#97A1B0", weight: 1.5, fillColor: "#97A1B0", fillOpacity: 0.1 }} interactive={false}>
          <Tooltip permanent direction="top" opacity={0.85}>{n.name}</Tooltip>
        </Circle>
      ))}

      {shape === "circle" && center && (
        <>
          <Circle center={center} radius={radius} pathOptions={STYLE} interactive={false} />
          <Marker
            position={center}
            icon={PIN_ICON}
            draggable
            eventHandlers={{ drag: (e) => props.onCenter(ll({ latlng: (e.target as L.Marker).getLatLng() })), dragend: (e) => props.onCenter(ll({ latlng: (e.target as L.Marker).getLatLng() })) }}
          />
          {handle && (
            <Marker
              position={handle}
              icon={HANDLE_ICON}
              draggable
              eventHandlers={{
                drag: (e) => {
                  const p = (e.target as L.Marker).getLatLng();
                  props.onRadius(Math.max(30, Math.min(2000, Math.round(distanceMeters(center, [p.lat, p.lng]) / 10) * 10)));
                },
              }}
            />
          )}
        </>
      )}

      {shape === "polygon" && drawing && (
        <>
          {points.length > 1 && <Polyline positions={points} pathOptions={{ color: ACCENT, weight: 2, dashArray: "5 4" }} />}
          {points.map((p, i) => (
            <CircleMarker
              key={i}
              center={p}
              radius={i === 0 && points.length >= 3 ? 10 : 7}
              pathOptions={{ color: ACCENT, weight: 3, fillColor: i === 0 && points.length >= 3 ? ACCENT : "#fff", fillOpacity: 1 }}
              eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e); if (i === 0 && points.length >= 3) props.onFinish(); } }}
            />
          ))}
        </>
      )}

      {closed && (
        <>
          <Polygon positions={points} pathOptions={STYLE} interactive={false} />
          {points.map((p, i) => (
            <Marker
              key={i}
              position={p}
              icon={VERTEX_ICON}
              draggable
              eventHandlers={{
                drag: (e) => {
                  const q = (e.target as L.Marker).getLatLng();
                  props.onPoints(points.map((x, j) => (j === i ? [q.lat, q.lng] : x)));
                },
                contextmenu: (e) => {
                  L.DomEvent.preventDefault(e.originalEvent);
                  if (points.length > 3) props.onPoints(points.filter((_, j) => j !== i));
                  else props.onNotice("minVertices");
                },
              }}
            />
          ))}
        </>
      )}
    </MapContainer>
  );
}
