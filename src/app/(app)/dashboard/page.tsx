"use client";

import { useSession } from "next-auth/react";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { ResidentDashboard } from "@/components/dashboard/resident-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  const role = session?.user.role || "RESIDENT";

  if (role === "RESIDENT") {
    return <ResidentDashboard />;
  }

  return <AdminDashboard />;
}
