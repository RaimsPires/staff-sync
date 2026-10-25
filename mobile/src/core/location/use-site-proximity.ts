import * as Location from 'expo-location';
import { Location as LocationNext, RequestPermissionsAccuracyOption } from 'expo-location/next';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { distanceToGeofenceM, type Geofence, type LatLng } from '@/domain';

export type PermissionState = 'undetermined' | 'granted' | 'denied';

export type Fix = LatLng & { accuracyM: number; mocked: boolean; capturedAt: Date };

type Perm = Location.LocationPermissionResponse;

/** iOS "Precise Location" off reports `reduced`; Android "Approximate" reports `coarse`. */
const isPrecise = (p: Perm) => p.ios?.accuracy !== 'reduced' && p.android?.accuracy !== 'coarse';

export function useLocationPermission() {
  const [state, setState] = useState<PermissionState>('undetermined');
  const [precise, setPrecise] = useState(true);

  const apply = (p: Perm) => {
    setState(p.granted ? 'granted' : p.canAskAgain ? 'undetermined' : 'denied');
    setPrecise(isPrecise(p));
  };
  const refresh = () => Location.getForegroundPermissionsAsync().then(apply);

  useEffect(() => {
    void refresh();
    // Picks up changes made in the system settings when the user comes back to the app.
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refresh();
    });
    return () => sub.remove();
  }, []);

  /**
   * Asks for precise location. Android shows the precise/approximate choice and iOS shows the
   * "Precise Location" upgrade prompt when only approximate access was given. Resolves true only
   * when location is granted AND precise; approximate access is treated as not enough.
   */
  const request = async () => {
    try {
      await LocationNext.requestForegroundPermissions({ accuracy: RequestPermissionsAccuracyOption.FULL });
    } catch {
      // The newer permission API is unavailable in this build: use the standard prompt.
      await Location.requestForegroundPermissionsAsync().catch(() => undefined);
    }
    const p = await Location.getForegroundPermissionsAsync();
    apply(p);
    return p.granted && isPrecise(p);
  };

  /** Granted with precise location: the only state in which checking in can work. */
  const ready = state === 'granted' && precise;

  return { state, precise, ready, request };
}

/** One-shot, high-accuracy fix taken at the moment of check-in / check-out. */
export async function captureFix(): Promise<Fix> {
  // Approximate access is kilometres off: never use it for a check-in.
  const perm = await Location.getForegroundPermissionsAsync();
  if (!perm.granted || !isPrecise(perm)) throw new Error('LOCATION_NOT_PRECISE');
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
  return toFix(pos);
}

function toFix(pos: Location.LocationObject): Fix {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracyM: pos.coords.accuracy ?? Number.POSITIVE_INFINITY,
    // `mocked` is Android-only; iOS reports undefined.
    mocked: pos.mocked === true,
    capturedAt: new Date(pos.timestamp),
  };
}

/**
 * Live position while a screen is open (map card, full map). Stops when unmounted, so the
 * app never tracks location in the background.
 */
export function useLivePosition(enabled: boolean) {
  const [fix, setFix] = useState<Fix>();

  useEffect(() => {
    if (!enabled) return;
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;
    // Show something quickly: the last position the OS knows, then a one-shot read, while the live watch warms up.
    // A fix that never arrives from the watch (indoors, simulator without a location) is still picked up here.
    void Location.getLastKnownPositionAsync()
      .then((pos) => {
        if (pos && !cancelled) setFix((cur) => cur ?? toFix(pos));
      })
      .catch(() => undefined);
    void Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      .then((pos) => {
        if (!cancelled) setFix((cur) => cur ?? toFix(pos));
      })
      .catch(() => undefined);
    void Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 3000 },
      (pos) => setFix(toFix(pos)),
    ).then((s) => {
      if (cancelled) s.remove();
      else sub = s;
    });
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [enabled]);

  return fix;
}

export function distanceToSite(fix: LatLng | undefined, fence: Geofence): number | undefined {
  return fix ? Math.round(distanceToGeofenceM(fix, fence)) : undefined;
}
