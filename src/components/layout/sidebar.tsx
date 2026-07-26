"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  IndianRupee,
  Receipt,
  CalendarDays,
  Megaphone,
  Package,
  Calendar,
  Car,
  BarChart3,
  Bell,
  Shield,
  Settings,
  ChevronLeft,
  UserCircle,
  Wallet,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Building2 as LogoIcon } from "lucide-react";

const adminMenuItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Residents", href: "/residents", icon: Users },
  { label: "Flats", href: "/flats", icon: Building2 },
  { label: "Collections", href: "/collections", icon: IndianRupee },
  { label: "Expenses", href: "/expenses", icon: Receipt },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Notices", href: "/notices", icon: Megaphone },
  { label: "Assets", href: "/assets", icon: Package },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Vehicles", href: "/vehicles", icon: Car },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Users & Roles", href: "/users", icon: Shield },
  { label: "Settings", href: "/settings", icon: Settings },
];

const residentMenuItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Profile", href: "/profile", icon: UserCircle },
  { label: "My Payments", href: "/payments", icon: Wallet },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Notices", href: "/notices", icon: Megaphone },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "My Vehicles", href: "/vehicles", icon: Car },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

interface SidebarProps {
  role: string;
  collapsed?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
}

export function Sidebar({ role, collapsed = false, onToggle, isMobile = false }: SidebarProps) {
  const pathname = usePathname();
  const menuItems = role === "RESIDENT" ? residentMenuItems : adminMenuItems;

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300",
        collapsed && !isMobile ? "w-16" : "w-64",
        isMobile ? "w-full" : ""
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white">
            <LogoIcon className="w-5 h-5" />
          </div>
          {(!collapsed || isMobile) && (
            <span className="font-bold text-xl text-gray-900">SocietyHub</span>
          )}
        </Link>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  collapsed && !isMobile ? "justify-center" : ""
                )}
                title={collapsed && !isMobile ? item.label : undefined}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                {(!collapsed || isMobile) && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Role Badge */}
      {(!collapsed || isMobile) && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
            <Shield className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">
              {role === "COMMITTEE_MEMBER"
                ? "Committee Member"
                : "Resident"}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
