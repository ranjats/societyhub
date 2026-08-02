"use client";

import {
  TrendChart,
  type TrendPoint,
  type TrendSeries,
} from "@/components/dashboard/trend-chart";

export interface ExpenseTrendPoint extends TrendPoint {
  month: string;
  paid: number;
  pending: number;
}

interface ExpenseTrendChartProps {
  data: ExpenseTrendPoint[];
}

const EXPENSE_SERIES: TrendSeries[] = [
  {
    key: "paid",
    name: "Paid",
    color: "#f43f5e",
    gradientId: "paidGradient",
    strokeWidth: 2.5,
  },
  {
    key: "pending",
    name: "Pending",
    color: "#f59e0b",
    gradientId: "expensePendingGradient",
  },
];

export function ExpenseTrendChart({ data }: ExpenseTrendChartProps) {
  return (
    <TrendChart
      data={data}
      series={EXPENSE_SERIES}
      ariaLabel="Monthly expense trend chart showing paid and pending amounts for the last six months"
    />
  );
}
