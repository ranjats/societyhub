"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Building2,
  Users,
  IndianRupee,
  Receipt,
  CalendarDays,
  Megaphone,
  Package,
  TrendingUp,
  Clock,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface DashboardData {
  type: string;
  totalFlats: number;
  totalResidents: number;
  monthlyCollection: number;
  pendingCollection: number;
  totalExpenses: number;
  upcomingEvents: number;
  activeNotices: number;
  totalAssets: number;
  recentCollections: any[];
  recentExpenses: any[];
  eventsList: any[];
}

export function AdminDashboard() {
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Overview of your society management system</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[5, 6, 7, 8].map((i) => (
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">
          Overview of your society management system
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Flats"
          value={data?.totalFlats || 0}
          icon={Building2}
          description="All registered flats"
        />
        <StatCard
          title="Total Residents"
          value={data?.totalResidents || 0}
          icon={Users}
          description="Active residents"
        />
        <StatCard
          title="This Month Collection"
          value={formatCurrency(data?.monthlyCollection || 0)}
          icon={IndianRupee}
          trend="up"
          trendValue={`${data?.totalFlats ? Math.round(((data.monthlyCollection / (data.totalFlats * 5000)) * 100)) : 0}%`}
        />
        <StatCard
          title="Pending Collection"
          value={formatCurrency(data?.pendingCollection || 0)}
          icon={Clock}
          trend={data?.pendingCollection ? "down" : "neutral"}
          trendValue="This month"
          className={data?.pendingCollection ? "border-amber-200 bg-amber-50/50" : ""}
          iconClassName={data?.pendingCollection ? "bg-amber-100" : ""}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Expenses"
          value={formatCurrency(data?.totalExpenses || 0)}
          icon={Receipt}
          description="All time"
        />
        <StatCard
          title="Upcoming Events"
          value={data?.upcomingEvents || 0}
          icon={CalendarDays}
          description="Next 30 days"
        />
        <StatCard
          title="Active Notices"
          value={data?.activeNotices || 0}
          icon={Megaphone}
          description="Published"
        />
        <StatCard
          title="Total Assets"
          value={data?.totalAssets || 0}
          icon={Package}
          description="Registered assets"
        />
      </div>

      {/* Tables Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Collections */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Collections</CardTitle>
            <Badge variant="outline">This Month</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.recentCollections && data.recentCollections.length > 0 ? (
                data.recentCollections.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Flat {item.flat?.flatNumber || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.paidDate ? formatDate(item.paidDate) : formatDate(item.dueDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(Number(item.amount))}
                      </p>
                      <Badge
                        variant={
                          item.status === "PAID"
                            ? "success"
                            : "warning"
                        }
                        className="text-xs"
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No recent collections
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Expenses</CardTitle>
            <Badge variant="outline">All Time</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.recentExpenses && data.recentExpenses.length > 0 ? (
                data.recentExpenses.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                        <Receipt className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(Number(item.amount))}
                      </p>
                      <Badge
                        variant={
                          item.status === "PAID"
                            ? "success"
                            : item.status === "APPROVED"
                            ? "info"
                            : "warning"
                        }
                        className="text-xs"
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No recent expenses
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Upcoming Events</CardTitle>
          <Badge variant="outline">Next 30 Days</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {data?.eventsList && data.eventsList.length > 0 ? (
              data.eventsList.map((event, index) => (
                <div
                  key={event.id || index}
                  className="p-4 rounded-lg border border-gray-200 hover:border-primary/50 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <Badge variant="secondary" className="text-xs">
                      {formatDate(event.startDate)}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {event.location || "No location specified"}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                No upcoming events
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Collection Summary Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Collection Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">
                Collection chart will be displayed here
              </p>
              <p className="text-sm text-gray-400">
                Real-time data from your society database
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
