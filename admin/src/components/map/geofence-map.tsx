"use client";

import dynamic from "next/dynamic";

/** Leaflet touches `window`, so the map only loads in the browser. */
export const GeofenceMap = dynamic(() => import("./geofence-picker"), {
  ssr: false,
  loading: () => <div className="size-full animate-shimmer bg-map-bg" />,
});
