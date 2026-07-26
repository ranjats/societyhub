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
        "flex flex-col items-center justify-center p-12 gap-3",
        className
      )}
    >
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
      {icon && <div className="mb-4 text-gray-300">{icon}</div>}
      <p className="text-gray-500 font-medium">{title}</p>
      {description && (
        <p className="text-sm text-gray-400 mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
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
        "border-red-200 bg-red-50/50 rounded-lg",
        className
      )}
    >
      <div className="flex flex-col items-center justify-center p-12">
        <AlertTriangle className="w-8 h-8 text-red-600 mb-4" />
        <h2 className="text-lg font-semibold text-red-900 mb-2">{title}</h2>
        <p className="text-red-700 text-sm text-center max-w-md mb-6">
          {message}
        </p>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
