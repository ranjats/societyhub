"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import {
  CalendarDays,
  Megaphone,
  Car,
  CheckCircle2,
  Clock,
  Bell,
  AlertTriangle,
  RefreshCw,
  LayoutDashboard,
  Hourglass,
  Send,
} from "lucide-react";

interface DashboardData {
  type: string;
  paymentStatus: string;
  pendingAmount: number;
  submittedAmount: number;
  upcomingEvents: number;
  latestNotices: number;
  upcomingCalendarEvents: number;
  myVehicles: number;
  collections: any[];
  upcomingEventsList: any[];
  latestNoticesList: any[];
  calendarEventsList: any[];
  notifications: any[];
  vehicleList: any[];
  committeeMembers: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    lastLoginAt: string | null;
  }[];
}

export function ResidentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/dashboard");
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to load dashboard (${response.status})`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Error state
  if (error && !loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Dashboard"
          description="Welcome to your society portal"
          icon={LayoutDashboard}
        />
        <Card className="border-red-100 bg-red-50/40">
          <CardContent className="flex flex-col items-center justify-center py-14">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              Failed to Load Dashboard
            </h2>
            <p className="text-red-700 text-sm text-center max-w-md mb-6">
              {error}
            </p>
            <Button
              onClick={fetchDashboardData}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Dashboard"
          description="Loading your dashboard..."
          icon={LayoutDashboard}
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="relative overflow-hidden h-32 rounded-xl bg-muted animate-pulse"
            >
              <span className="shimmer absolute inset-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const pendingAmount = data?.pendingAmount ?? 0;
  const submittedAmount = data?.submittedAmount ?? 0;
  const hasPendingDues = pendingAmount > 0;
  const hasSubmittedPayment = !hasPendingDues && submittedAmount > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="My Dashboard"
        description="Welcome to your society portal"
        icon={LayoutDashboard}
      />

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Payment Status"
          value={data?.paymentStatus || "Loading..."}
          icon={hasPendingDues ? Clock : hasSubmittedPayment ? Hourglass : CheckCircle2}
          description={
            hasPendingDues
              ? `${formatCurrency(pendingAmount)} pending`
              : hasSubmittedPayment
              ? `${formatCurrency(submittedAmount)} awaiting approval`
              : "No pending dues"
          }
          className={
            hasPendingDues
              ? "border-amber-200/70 bg-amber-50/30"
              : hasSubmittedPayment
              ? "border-blue-200/70 bg-blue-50/30"
              : "border-emerald-200/70 bg-emerald-50/30"
          }
          iconClassName={
            hasPendingDues
              ? "!from-amber-100 !to-amber-100/60 !border-amber-200 !text-amber-600"
              : hasSubmittedPayment
              ? "!from-blue-100 !to-blue-100/60 !border-blue-200 !text-blue-600"
              : "!from-emerald-100 !to-emerald-100/60 !border-emerald-200 !text-emerald-600"
          }
        />
        <StatCard
          title="Upcoming Events"
          value={data?.upcomingEvents || 0}
          icon={CalendarDays}
          description="Next 30 days"
        />
        <StatCard
          title="Latest Notices"
          value={data?.latestNotices || 0}
          icon={Megaphone}
          description="Active notices"
        />
        <StatCard
          title="My Vehicles"
          value={data?.myVehicles || 0}
          icon={Car}
          description="Registered vehicles"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Payment History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Payment History</CardTitle>
            <Badge variant={data?.pendingAmount === 0 ? "success" : "warning"}>
              {data?.pendingAmount === 0 ? "All Clear" : "Pending Dues"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.collections && data.collections.length > 0 ? (
                data.collections.slice(0, 5).map((payment, index) => (
                  <div
                    key={payment.id || index}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-transparent hover:border-primary/20 hover:bg-white hover:shadow-card transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-xl border ${
                        payment.status === "PAID"
                          ? "bg-emerald-50 border-emerald-100"
                          : payment.status === "SUBMITTED"
                          ? "bg-blue-50 border-blue-100"
                          : "bg-amber-50 border-amber-100"
                      }`}>
                        {payment.status === "PAID" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : payment.status === "SUBMITTED" ? (
                          <Send className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {new Date(2024, payment.month - 1).toLocaleString("default", { month: "long" })} {payment.year}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {payment.paidDate ? `Paid on ${formatDate(payment.paidDate)}` : `Due by ${formatDate(payment.dueDate)}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground text-sm">
                        {formatCurrency(Number(payment.amount))}
                      </p>
                      <Badge
                        variant={
                          payment.status === "PAID"
                            ? "success"
                            : payment.status === "SUBMITTED"
                            ? "info"
                            : "warning"
                        }
                        className="text-[11px] mt-1"
                      >
                        {payment.status === "SUBMITTED"
                          ? "Awaiting Approval"
                          : payment.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No payment records yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Latest Notices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Latest Notices</CardTitle>
            <Badge variant="outline">Recent</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.latestNoticesList && data.latestNoticesList.length > 0 ? (
                data.latestNoticesList.slice(0, 5).map((notice, index) => (
                  <div
                    key={notice.id || index}
                    className="p-4 rounded-xl border bg-muted/30 hover:bg-white hover:border-primary/25 hover:shadow-card transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant={
                          notice.priority === "HIGH"
                            ? "destructive"
                            : notice.priority === "MEDIUM"
                            ? "warning"
                            : "secondary"
                        }
                        className="text-[11px]"
                      >
                        {notice.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(notice.createdAt)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground text-sm">{notice.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {notice.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No notices yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Events</CardTitle>
            <Badge variant="outline">Next 30 Days</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.upcomingEventsList && data.upcomingEventsList.length > 0 ? (
                data.upcomingEventsList.slice(0, 5).map((event, index) => (
                  <div
                    key={event.id || index}
                    className="flex items-center gap-4 p-4 rounded-xl border bg-muted/30 hover:bg-white hover:border-primary/25 hover:shadow-card transition-all duration-200"
                  >
                    <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary-2/15 border border-primary/10 shrink-0">
                      <CalendarDays className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm">{event.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{event.location || "No location"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-primary">
                        {formatDate(event.startDate)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No upcoming events
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* My Vehicle */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Vehicles</CardTitle>
            <Badge variant="outline">Registered</Badge>
          </CardHeader>
          <CardContent>
            {data?.vehicleList && data.vehicleList.length > 0 ? (
              <div className="space-y-3">
                {data.vehicleList.map((vehicle, index) => (
                  <div
                    key={vehicle.id || index}
                    className="p-4 rounded-xl bg-muted/40 border hover:border-primary/20 hover:bg-white hover:shadow-card transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 shrink-0">
                        <Car className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">
                          {vehicle.registrationNumber}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {vehicle.brand} {vehicle.model} • {vehicle.type}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="secondary">Slot {vehicle.parkingSlot || "N/A"}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Car className="w-12 h-12 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm">No vehicles registered</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calendar Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upcoming Calendar Events</CardTitle>
          <Badge variant="outline">{data?.calendarEventsList?.length || 0} Events</Badge>
        </CardHeader>
        <CardContent>
          {data?.calendarEventsList && data.calendarEventsList.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {data.calendarEventsList.map((event, index) => (
                <div
                  key={event.id || index}
                  className="p-3.5 rounded-xl bg-muted/40 hover:bg-white hover:shadow-card transition-all duration-200"
                  style={{ borderLeft: `4px solid ${event.color || "#6366f1"}` }}
                >
                  <p className="text-xs text-muted-foreground mb-1">
                    {formatDate(event.startDate)}
                  </p>
                  <p className="font-semibold text-foreground text-sm">{event.title}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No calendar events scheduled
            </div>
          )}
        </CardContent>
      </Card>

      {/* Committee Members */}
      {data?.committeeMembers && data.committeeMembers.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Society Committee</CardTitle>
            <Badge variant="outline">{data.committeeMembers.length} Members</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {data.committeeMembers.map((member, index) => (
                <div
                  key={member.id || index}
                  className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 border border-transparent hover:bg-white hover:border-primary/25 hover:shadow-card transition-all duration-200"
                >
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary-2 text-white font-semibold text-sm shrink-0">
                    {getInitials(member.firstName, member.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    {member.phone && (
                      <p className="text-xs text-muted-foreground truncate">{member.phone}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    Committee
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications */}
      {data?.notifications && data.notifications.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Notifications</CardTitle>
            <Badge variant="destructive">{data.notifications.length} new</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.notifications.map((notification, index) => (
                <div
                  key={notification.id || index}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-white hover:shadow-card transition-all duration-200"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary-2/15 border border-primary/10 shrink-0">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{notification.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
