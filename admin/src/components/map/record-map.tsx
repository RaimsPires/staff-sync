"use client";

import dynamic from "next/dynamic";

export type { RecordMapProps } from "./record-map-view";

export const RecordMap = dynamic(() => import("./record-map-view"), {
  ssr: false,
  loading: () => <div className="size-full animate-shimmer bg-map-bg" />,
});
