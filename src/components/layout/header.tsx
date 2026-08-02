"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  LogOut,
  User,
  Menu,
  ChevronDown,
  Building2,
  IndianRupee,
  CalendarDays,
  Megaphone,
  Receipt,
  Package,
  CheckCheck,
  ExternalLink,
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  onMobileMenuToggle?: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

const NOTIF_ICONS: Record<string, { icon: typeof Bell; classes: string }> = {
  COLLECTION: { icon: IndianRupee, classes: "bg-emerald-50 text-emerald-600" },
  EVENT: { icon: CalendarDays, classes: "bg-violet-50 text-violet-600" },
  NOTICE: { icon: Megaphone, classes: "bg-amber-50 text-amber-600" },
  EXPENSE: { icon: Receipt, classes: "bg-rose-50 text-rose-600" },
  ASSET: { icon: Package, classes: "bg-blue-50 text-blue-600" },
  GENERAL: { icon: Bell, classes: "bg-slate-100 text-slate-600" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function Header({ user, onMobileMenuToggle }: HeaderProps) {
  const router = useRouter();
  const firstName = user.name?.split(" ")[0] || "User";
  const lastName = user.name?.split(" ")[1] || "";
  const initials = getInitials(firstName, lastName);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    try {
      setNotifLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) setNotifications(await res.json());
    } catch {
      // silent — header shouldn't break on notification fetch failure
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleOpenChange = (open: boolean) => {
    setBellOpen(open);
    if (open) fetchNotifications();
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.isRead) {
      try {
        await fetch(`/api/notifications/${n.id}`, { method: "PUT" });
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
        );
      } catch {
        // non-fatal
      }
    }
    setBellOpen(false);
    router.push(n.link || "/notifications");
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;
    try {
      setMarkingAll(true);
      await Promise.all(
        unread.map((n) =>
          fetch(`/api/notifications/${n.id}`, { method: "PUT" })
        )
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark notifications as read");
    } finally {
      setMarkingAll(false);
    }
  };

  const visibleNotifications = notifications.slice(0, 6);

  return (
    <header className="sticky top-0 z-40 h-16 backdrop-blur-xl bg-background/80 border-b border-border/60 flex items-center justify-between px-4 lg:px-6">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-muted-foreground"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden lg:block">
          <h2 className="text-base font-bold tracking-tight text-foreground">
            Welcome back, <span className="text-gradient">{firstName}</span>!
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Here&apos;s what&apos;s happening in your society today.
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2.5">
        {/* Society Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/8 to-primary-2/8 border border-primary/10">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            99 Sentosa Green Society
          </span>
        </div>

        {/* Notifications */}
        <DropdownMenu open={bellOpen} onOpenChange={handleOpenChange}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-foreground hover:bg-accent/70"
              aria-label={`${unreadCount} unread notifications`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-primary hover:bg-accent/60"
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-1" />
                  {markingAll ? "Marking..." : "Mark all read"}
                </Button>
              )}
            </div>
            <div className="max-h-80 overflow-auto">
              {notifLoading && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : visibleNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                visibleNotifications.map((n) => {
                  const meta = NOTIF_ICONS[n.type] || NOTIF_ICONS.GENERAL;
                  const Icon = meta.icon;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-accent/50 transition-colors border-b border-border/40 last:border-b-0"
                    >
                      <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${meta.classes}`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm truncate ${n.isRead ? "text-muted-foreground font-normal" : "font-semibold text-foreground"}`}>
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-label="unread" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {n.message}
                        </p>
                        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <DropdownMenuSeparator className="my-0" />
            <DropdownMenuItem
              className="cursor-pointer justify-center text-primary font-medium py-2.5"
              onClick={() => {
                setBellOpen(false);
                router.push("/notifications");
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2.5 px-2 py-1.5 h-auto hover:bg-accent/70 rounded-lg"
            >
              <Avatar className="h-9 w-9 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary-2 text-white text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {user.name}
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {user.role?.replace("_", " ")}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1.5">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-muted-foreground break-all">
                  {user.email}
                </p>
                <Badge variant="secondary" className="w-fit text-[10px]">
                  {user.role?.replace("_", " ")}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/profile")}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
