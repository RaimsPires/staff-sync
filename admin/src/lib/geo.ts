import type { Geofence, LatLng } from "@/types/domain";

const METERS_PER_DEGREE = 111_320;

/** Moves a point by `east`/`north` meters (small distances only). */
export function offsetMeters([lat, lng]: LatLng, east: number, north: number): LatLng {
  return [lat + north / METERS_PER_DEGREE, lng + east / (METERS_PER_DEGREE * Math.cos((lat * Math.PI) / 180))];
}

/** Great-circle distance in meters. */
export function distanceMeters([lat1, lng1]: LatLng, [lat2, lng2]: LatLng): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Local planar meters around a reference point (equirectangular; fine for site-sized shapes). */
function toLocal(points: LatLng[]): [number, number][] {
  const lat0 = points.reduce((s, p) => s + p[0], 0) / points.length;
  const kx = METERS_PER_DEGREE * Math.cos((lat0 * Math.PI) / 180);
  return points.map(([lat, lng]) => [lng * kx, lat * METERS_PER_DEGREE]);
}

export function polygonAreaM2(points: LatLng[]): number {
  if (points.length < 3) return 0;
  const p = toLocal(points);
  let a = 0;
  p.forEach(([x, y], i) => {
    const [nx, ny] = p[(i + 1) % p.length];
    a += x * ny - nx * y;
  });
  return Math.abs(a / 2);
}

export function polygonPerimeterM(points: LatLng[]): number {
  return points.reduce((sum, p, i) => sum + distanceMeters(p, points[(i + 1) % points.length]), 0);
}

export function centroid(points: LatLng[]): LatLng {
  const n = points.length;
  return [points.reduce((s, p) => s + p[0], 0) / n, points.reduce((s, p) => s + p[1], 0) / n];
}

export interface GeofenceMetrics {
  center: LatLng;
  /** Radius of the circle with the same area, meters. */
  radius: number;
  area: number;
  perimeter: number;
}

export function geofenceMetrics(fence: Geofence, center: LatLng): GeofenceMetrics {
  if (fence.kind === "circle") return { center, radius: fence.radius, area: Math.PI * fence.radius ** 2, perimeter: 2 * Math.PI * fence.radius };
  const area = polygonAreaM2(fence.points);
  return { center: centroid(fence.points), radius: Math.sqrt(area / Math.PI), area, perimeter: polygonPerimeterM(fence.points) };
}

/** A regular-ish hexagon around a point, used when switching a circle to a polygon. */
export function hexagonAround(center: LatLng, radius: number): LatLng[] {
  const k = [1, 0.88, 1.08, 0.94, 1.04, 0.9];
  return k.map((m, i) => {
    const t = (i / 6) * Math.PI * 2;
    return offsetMeters(center, Math.cos(t) * radius * m, Math.sin(t) * radius * m);
  });
}

export const formatArea = (m2: number): string => (m2 >= 10_000 ? `${(m2 / 10_000).toFixed(2)} ha` : `${Math.round(m2).toLocaleString("en")} m²`);
export const formatLength = (m: number): string => (m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`);
