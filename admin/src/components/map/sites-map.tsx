"use client";

import dynamic from "next/dynamic";

export type { PinTone, SitePin, SitesMapProps } from "./sites-map-view";

/** Leaflet touches `window`, so the map only loads in the browser. */
export const SitesMap = dynamic(() => import("./sites-map-view"), {
  ssr: false,
  loading: () => <div className="size-full animate-shimmer bg-map-bg" />,
});
