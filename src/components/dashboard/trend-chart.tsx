"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

export interface TrendPoint {
  month: string;
  [key: string]: string | number;
}

export interface TrendSeries {
  key: string;
  name: string;
  color: string;
  gradientId: string;
  strokeWidth?: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  series: TrendSeries[];
  ariaLabel: string;
}

const AXIS_TICK = { fontSize: 12, fill: "hsl(217, 20%, 45%)" };

interface TooltipEntry {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  stroke?: string;
  color?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/70 bg-card px-3.5 py-2.5 shadow-card text-sm">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-8"
          >
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.stroke || entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-semibold text-foreground tabular-nums">
              {formatCurrency(Number(entry.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrendChart({ data, series, ariaLabel }: TrendChartProps) {
  return (
    <div className="h-72 w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            {series.map((s) => (
              <linearGradient
                key={s.gradientId}
                id={s.gradientId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="4 4"
            stroke="hsl(226, 25%, 91%)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            dy={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            width={56}
            tickFormatter={(value: number) =>
              value >= 1000
                ? `₹${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
                : `₹${value}`
            }
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{
              stroke: "hsl(243, 75%, 59%)",
              strokeOpacity: 0.25,
              strokeDasharray: "4 4",
            }}
          />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={s.strokeWidth ?? 2}
              fill={`url(#${s.gradientId})`}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#ffffff" }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
