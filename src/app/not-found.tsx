import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-auth p-4">
      <div className="text-center max-w-md relative z-10 animate-fade-up">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-primary-2/15 border border-primary/10 mx-auto mb-6">
          <Building2 className="w-8 h-8 text-primary" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">
          Error 404
        </p>
        <h1 className="text-6xl font-bold tracking-tight text-gradient mb-4">404</h1>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Page Not Found
        </h2>
        <p className="text-muted-foreground mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
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
