export const dynamic = "force-dynamic";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldX, ArrowRight } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-auth p-4">
      <div className="text-center max-w-md relative z-10 animate-fade-up">
        <div className="relative mx-auto mb-6 w-fit">
          <div className="absolute -inset-2 rounded-2xl bg-red-500/20 blur-xl" />
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-lg">
            <ShieldX className="w-8 h-8" />
          </div>
        </div>
        <p className="text-sm font-semibold uppercase tracking-widest text-red-600 mb-2">
          Restricted Area
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
          Access Denied
        </h1>
        <p className="text-muted-foreground mb-2">
          You don&apos;t have permission to access this page.
        </p>
        <p className="text-sm text-muted-foreground/70 mb-8">
          Please contact your administrator if you believe this is an error.
        </p>
        <Link href="/dashboard">
          <Button className="h-11 px-6">
            Back to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
