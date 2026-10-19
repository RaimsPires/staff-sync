import { distanceToGeofenceM, haversineM, isInsideGeofence } from '../geo';
import type { Geofence } from '../types';

const center = { lat: 4.0511, lng: 9.7679 };
const circle: Geofence = { kind: 'circle', center, radiusM: 100 };
// ~0.001° lat ≈ 111 m
const square: Geofence = {
  kind: 'polygon',
  points: [
    { lat: 4.05, lng: 9.767 },
    { lat: 4.05, lng: 9.769 },
    { lat: 4.052, lng: 9.769 },
    { lat: 4.052, lng: 9.767 },
  ],
};

describe('geo', () => {
  it('computes haversine distance', () => {
    expect(haversineM(center, { lat: center.lat + 0.001, lng: center.lng })).toBeCloseTo(111.2, 0);
    expect(haversineM(center, center)).toBe(0);
  });

  it('detects points inside and outside a circle', () => {
    expect(isInsideGeofence(center, circle)).toBe(true);
    expect(isInsideGeofence({ lat: center.lat + 0.002, lng: center.lng }, circle)).toBe(false);
  });

  it('reports distance to a circle boundary', () => {
    const d = distanceToGeofenceM({ lat: center.lat + 0.002, lng: center.lng }, circle);
    expect(d).toBeGreaterThan(115);
    expect(d).toBeLessThan(125);
    expect(distanceToGeofenceM(center, circle)).toBe(0);
  });

  it('handles polygons', () => {
    expect(isInsideGeofence({ lat: 4.051, lng: 9.768 }, square)).toBe(true);
    expect(isInsideGeofence({ lat: 4.06, lng: 9.768 }, square)).toBe(false);
    const d = distanceToGeofenceM({ lat: 4.053, lng: 9.768 }, square);
    expect(d).toBeGreaterThan(100);
    expect(d).toBeLessThan(120);
  });
});
