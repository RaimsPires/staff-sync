"use client";

import dynamic from "next/dynamic";

export type { MapPoint, PointsMapProps } from "./points-map-view";

export const PointsMap = dynamic(() => import("./points-map-view"), {
  ssr: false,
  loading: () => <div className="size-full animate-shimmer bg-map-bg" />,
});
