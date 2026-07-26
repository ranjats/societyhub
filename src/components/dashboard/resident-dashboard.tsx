"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Wallet,
  CalendarDays,
  Megaphone,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Building2,
  Bell,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface DashboardData {
  type: string;
  paymentStatus: string;
  pendingAmount: number;
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-500">Welcome to your society portal</p>
        </div>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
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
              className="border-red-300 text-red-700 hover:bg-red-100"
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-500">Welcome to your society portal</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Payment Status"
          value={data?.paymentStatus || "Loading..."}
          icon={data?.pendingAmount === 0 ? CheckCircle2 : Clock}
          description={data?.pendingAmount === 0 ? "No pending dues" : `${formatCurrency(data?.pendingAmount || 0)} pending`}
          className={data?.pendingAmount === 0 ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-amber-50/50"}
          iconClassName={data?.pendingAmount === 0 ? "bg-emerald-100" : "bg-amber-100"}
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
            <CardTitle className="text-lg">My Payment History</CardTitle>
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
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        payment.status === "PAID" ? "bg-emerald-100" : "bg-amber-100"
                      }`}>
                        {payment.status === "PAID" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(2024, payment.month - 1).toLocaleString("default", { month: "long" })} {payment.year}
                        </p>
                        <p className="text-sm text-gray-500">
                          {payment.paidDate ? `Paid on ${formatDate(payment.paidDate)}` : `Due by ${formatDate(payment.dueDate)}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(Number(payment.amount))}
                      </p>
                      <Badge
                        variant={payment.status === "PAID" ? "success" : "warning"}
                        className="text-xs"
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No payment records yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Latest Notices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Latest Notices</CardTitle>
            <Badge variant="outline">Recent</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.latestNoticesList && data.latestNoticesList.length > 0 ? (
                data.latestNoticesList.slice(0, 5).map((notice, index) => (
                  <div
                    key={notice.id || index}
                    className="p-4 rounded-lg border border-gray-200 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
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
                        className="text-xs"
                      >
                        {notice.priority}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDate(notice.createdAt)}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900">{notice.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {notice.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
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
            <CardTitle className="text-lg">Upcoming Events</CardTitle>
            <Badge variant="outline">Next 30 Days</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.upcomingEventsList && data.upcomingEventsList.length > 0 ? (
                data.upcomingEventsList.slice(0, 5).map((event, index) => (
                  <div
                    key={event.id || index}
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-primary/50 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                      <CalendarDays className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-500">{event.location || "No location"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(event.startDate)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No upcoming events
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* My Vehicle */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">My Vehicles</CardTitle>
            <Badge variant="outline">Registered</Badge>
          </CardHeader>
          <CardContent>
            {data?.vehicleList && data.vehicleList.length > 0 ? (
              <div className="space-y-3">
                {data.vehicleList.map((vehicle, index) => (
                  <div
                    key={vehicle.id || index}
                    className="p-4 rounded-lg bg-gray-50 border border-gray-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100">
                        <Car className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {vehicle.registrationNumber}
                        </p>
                        <p className="text-sm text-gray-500">
                          {vehicle.brand} {vehicle.model} • {vehicle.type}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">Slot {vehicle.parkingSlot || "N/A"}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Car className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No vehicles registered</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calendar Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Upcoming Calendar Events</CardTitle>
          <Badge variant="outline">{data?.calendarEventsList?.length || 0} Events</Badge>
        </CardHeader>
        <CardContent>
          {data?.calendarEventsList && data.calendarEventsList.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {data.calendarEventsList.map((event, index) => (
                <div
                  key={event.id || index}
                  className="p-3 rounded-lg border-l-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  style={{ borderLeftColor: event.color || "#3b82f6" }}
                >
                  <p className="text-xs text-gray-500 mb-1">
                    {formatDate(event.startDate)}
                  </p>
                  <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No calendar events scheduled
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      {data?.notifications && data.notifications.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Notifications</CardTitle>
            <Badge variant="destructive">{data.notifications.length} new</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.notifications.map((notification, index) => (
                <div
                  key={notification.id || index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{notification.title}</p>
                    <p className="text-sm text-gray-500">{notification.message}</p>
                  </div>
                  <span className="text-xs text-gray-400">
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
