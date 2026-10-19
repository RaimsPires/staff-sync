import type { Geofence, LatLng } from './types';

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in metres. */
export function haversineM(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Ray-casting point-in-polygon on lat/lng (valid for site-sized polygons). */
export function pointInPolygon(point: LatLng, polygon: readonly LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    const crosses =
      a.lat > point.lat !== b.lat > point.lat &&
      point.lng < ((b.lng - a.lng) * (point.lat - a.lat)) / (b.lat - a.lat) + a.lng;
    if (crosses) inside = !inside;
  }
  return inside;
}

/** Distance from a point to the segment a-b, in metres (local equirectangular projection). */
function distanceToSegmentM(p: LatLng, a: LatLng, b: LatLng): number {
  const k = Math.cos(toRad(p.lat));
  const toXY = (q: LatLng) => ({ x: toRad(q.lng) * k * EARTH_RADIUS_M, y: toRad(q.lat) * EARTH_RADIUS_M });
  const P = toXY(p);
  const A = toXY(a);
  const B = toXY(b);
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const lenSq = dx * dx + dy * dy;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((P.x - A.x) * dx + (P.y - A.y) * dy) / lenSq));
  return Math.hypot(P.x - (A.x + t * dx), P.y - (A.y + t * dy));
}

export function isInsideGeofence(point: LatLng, fence: Geofence): boolean {
  return fence.kind === 'circle'
    ? haversineM(point, fence.center) <= fence.radiusM
    : pointInPolygon(point, fence.points);
}

/** Metres from the point to the boundary; 0 when inside. */
export function distanceToGeofenceM(point: LatLng, fence: Geofence): number {
  if (isInsideGeofence(point, fence)) return 0;
  if (fence.kind === 'circle') return haversineM(point, fence.center) - fence.radiusM;
  const pts = fence.points;
  return Math.min(...pts.map((a, i) => distanceToSegmentM(point, a, pts[(i + 1) % pts.length])));
}
