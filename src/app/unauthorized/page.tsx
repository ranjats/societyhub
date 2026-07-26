import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mx-auto mb-6">
          <Building2 className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-2">
          You don&apos;t have permission to access this page.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Please contact your administrator if you believe this is an error.
        </p>
        <Link href="/dashboard">
          <Button>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
