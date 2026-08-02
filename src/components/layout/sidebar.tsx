"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
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
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Building2 as LogoIcon } from "lucide-react";

interface MenuItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const adminMenuGroups: MenuGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Management",
    items: [
      { label: "Residents", href: "/residents", icon: Users },
      { label: "Collections", href: "/collections", icon: IndianRupee },
      { label: "Expenses", href: "/expenses", icon: Receipt },
      { label: "Events", href: "/events", icon: CalendarDays },
      { label: "Notices", href: "/notices", icon: Megaphone },
      { label: "Assets", href: "/assets", icon: Package },
      { label: "Calendar", href: "/calendar", icon: Calendar },
      { label: "Vehicles", href: "/vehicles", icon: Car },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Reports", href: "/reports", icon: BarChart3 },
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Users & Roles", href: "/users", icon: Shield },
    ],
  },
  {
    label: "System",
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
];

const residentMenuGroups: MenuGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "My Profile", href: "/profile", icon: UserCircle },
      { label: "My Payments", href: "/payments", icon: Wallet },
    ],
  },
  {
    label: "Community",
    items: [
      { label: "Events", href: "/events", icon: CalendarDays },
      { label: "Notices", href: "/notices", icon: Megaphone },
      { label: "Calendar", href: "/calendar", icon: Calendar },
      { label: "Society Assets", href: "/assets", icon: Package },
      { label: "My Vehicles", href: "/vehicles", icon: Car },
    ],
  },
  {
    label: "Alerts",
    items: [{ label: "Notifications", href: "/notifications", icon: Bell }],
  },
];

interface SidebarProps {
  role: string;
  collapsed?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
}

export function Sidebar({ role, collapsed = false, onToggle, isMobile = false }: SidebarProps) {
  const pathname = usePathname();
  const menuGroups = role === "RESIDENT" ? residentMenuGroups : adminMenuGroups;
  const showLabels = !collapsed || isMobile;

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-card border-r border-border/70 transition-all duration-300",
        collapsed && !isMobile ? "w-[76px]" : "w-64",
        isMobile ? "w-full" : ""
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border/60 bg-gradient-to-r from-primary/[0.04] to-transparent">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-2 text-white shadow-glow transition-transform duration-200 group-hover:scale-105">
            <LogoIcon className="w-5 h-5" />
          </div>
          {showLabels && (
            <span className="font-bold text-lg tracking-tight text-foreground">
              Society<span className="text-gradient">Hub</span>
            </span>
          )}
        </Link>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform duration-300",
                collapsed && "rotate-180"
              )}
            />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {menuGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            {showLabels && (
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-primary/12 to-primary-2/10 text-primary"
                      : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
                    collapsed && !isMobile ? "justify-center" : ""
                  )}
                  title={!showLabels ? item.label : undefined}
                >
                  {isActive && showLabels && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-gradient-to-b from-primary to-primary-2" />
                  )}
                  <span
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-br from-primary to-primary-2 text-white shadow-glow"
                        : "text-muted-foreground group-hover:bg-background group-hover:text-foreground"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  {showLabels && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Role Card */}
      {showLabels && (
        <div className="p-4 border-t border-border/60">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/[0.08] to-primary-2/[0.08] border border-primary/10 p-3">
            <Sparkles className="absolute -right-2 -top-2 h-10 w-10 text-primary/10" />
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary-2/20 border border-primary/15">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {role === "COMMITTEE_MEMBER"
                    ? "Committee Member"
                    : role === "RESIDENT"
                    ? "Resident"
                    : "Super Admin"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  SocietyHub Portal
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
