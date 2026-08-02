"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 gap-4",
        className
      )}
    >
      <div className="relative">
        <div className="absolute -inset-2 rounded-full bg-primary/15 blur-lg animate-pulse-soft" />
        <Loader2 className="relative w-8 h-8 animate-spin text-primary" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12",
        className
      )}
    >
      {icon && (
        <div className="mb-5 flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/60 text-muted-foreground/40">
          {icon}
        </div>
      )}
      <p className="text-muted-foreground font-medium">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground/70 mt-1.5 text-center max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title,
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "border-red-100 bg-red-50/40 rounded-xl",
        className
      )}
    >
      <div className="flex flex-col items-center justify-center p-12">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 mb-5">
          <AlertTriangle className="w-7 h-7 text-red-600" />
        </div>
        <h2 className="text-lg font-semibold text-red-900 mb-2">{title}</h2>
        <p className="text-red-700/80 text-sm text-center max-w-md mb-6">
          {message}
        </p>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
