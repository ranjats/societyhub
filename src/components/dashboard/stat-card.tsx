"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  iconClassName?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendValue,
  className,
  iconClassName,
}: StatCardProps) {
  return (
    <Card className={cn("card-hover relative overflow-hidden", className)}>
      {/* Decorative corner glow */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br from-primary/[0.07] to-primary-2/[0.07]" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-[26px] font-bold leading-none tracking-tight text-foreground truncate">
              {value}
            </p>
            {(description || trendValue) && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {trendValue && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      trend === "up" && "bg-emerald-50 text-emerald-700",
                      trend === "down" && "bg-red-50 text-red-700",
                      trend === "neutral" && "bg-secondary text-muted-foreground"
                    )}
                  >
                    {trend === "up" && "↑"}
                    {trend === "down" && "↓"}
                    {trendValue}
                  </span>
                )}
                {description && (
                  <span className="text-xs text-muted-foreground">
                    {description}
                  </span>
                )}
              </div>
            )}
          </div>
          <div
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary-2/15 border border-primary/10 shadow-sm shrink-0",
              iconClassName
            )}
          >
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
