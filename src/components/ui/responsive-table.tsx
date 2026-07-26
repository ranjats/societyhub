"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Card component for mobile table rows */
export function MobileCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 shadow-sm space-y-2",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Row within a MobileCard */
export function MobileCardRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right min-w-0 truncate">{children}</span>
    </div>
  );
}
