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
    <Card className={cn("card-hover", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {(description || trendValue) && (
              <div className="flex items-center gap-1">
                {trendValue && (
                  <span
                    className={cn(
                      "text-xs font-medium",
                      trend === "up" && "text-emerald-600",
                      trend === "down" && "text-red-600",
                      trend === "neutral" && "text-gray-500"
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
              "flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10",
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
