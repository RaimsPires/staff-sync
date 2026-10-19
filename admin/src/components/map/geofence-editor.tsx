"use client";

import dynamic from "next/dynamic";

export type { GeofenceEditorProps, NeighbourSite } from "./geofence-editor-view";

export const GeofenceEditor = dynamic(() => import("./geofence-editor-view"), {
  ssr: false,
  loading: () => <div className="size-full animate-shimmer bg-map-bg" />,
});
