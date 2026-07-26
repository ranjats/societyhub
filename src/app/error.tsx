"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-500 mb-6">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="outline">
            Try Again
          </Button>
          <Button onClick={() => window.location.href = "/dashboard"}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
