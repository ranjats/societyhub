"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-auth p-4">
      <div className="text-center max-w-md relative z-10 animate-fade-up">
        <div className="relative mx-auto mb-6 w-fit">
          <div className="absolute -inset-2 rounded-2xl bg-red-500/20 blur-xl" />
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-lg">
            <AlertTriangle className="w-8 h-8" />
          </div>
        </div>
        <p className="text-sm font-semibold uppercase tracking-widest text-red-600 mb-2">
          Unexpected Error
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
          Something went wrong
        </h1>
        <p className="text-muted-foreground mb-8">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="outline" className="h-11 px-5">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button onClick={() => window.location.href = "/dashboard"} className="h-11 px-5">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
