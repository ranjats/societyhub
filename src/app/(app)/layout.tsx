"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth is handled by middleware. If middleware passes, user is authenticated.
  // No client-side redirect needed — it causes redirect loops on Vercel.

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-primary/20 blur-2xl animate-pulse-soft" />
          <div className="relative animate-spin rounded-full h-9 w-9 border-[3px] border-primary/20 border-t-primary" />
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const role = (session.user as Record<string, unknown>).role as string || "RESIDENT";

  return (
    <div className="min-h-screen bg-mesh">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:z-50">
        <Sidebar
          role={role}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 animate-fade-in">
            <Sidebar
              role={role}
              isMobile={true}
              onToggle={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "lg:ml-[76px]" : "lg:ml-64"
        )}
      >
        <Header
          user={session.user}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className="p-4 lg:p-6 max-w-[1600px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
