"use client";

import {
  TrendChart,
  type TrendPoint,
  type TrendSeries,
} from "@/components/dashboard/trend-chart";

export interface CollectionTrendPoint extends TrendPoint {
  month: string;
  collected: number;
  pending: number;
}

interface CollectionTrendChartProps {
  data: CollectionTrendPoint[];
}

const COLLECTION_SERIES: TrendSeries[] = [
  {
    key: "collected",
    name: "Collected",
    color: "#6366f1",
    gradientId: "collectedGradient",
    strokeWidth: 2.5,
  },
  {
    key: "pending",
    name: "Pending",
    color: "#f59e0b",
    gradientId: "collectionPendingGradient",
  },
];

export function CollectionTrendChart({ data }: CollectionTrendChartProps) {
  return (
    <TrendChart
      data={data}
      series={COLLECTION_SERIES}
      ariaLabel="Monthly collection trend chart showing collected and pending amounts for the last six months"
    />
  );
}
