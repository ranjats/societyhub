"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  CollectionTrendChart,
  type CollectionTrendPoint,
} from "@/components/dashboard/collection-trend-chart";
import {
  ExpenseTrendChart,
  type ExpenseTrendPoint,
} from "@/components/dashboard/expense-trend-chart";
import { PageHeader } from "@/components/ui/page-header";
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
  LayoutDashboard,
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
  collectionTrend?: CollectionTrendPoint[];
  expenseTrend?: ExpenseTrendPoint[];
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
        <PageHeader
          title="Dashboard"
          description="Overview of your society management system"
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
          title="Dashboard"
          description="Loading dashboard data..."
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[5, 6, 7, 8].map((i) => (
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description="Overview of your society management system"
        icon={LayoutDashboard}
      />

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
          className={data?.pendingCollection ? "border-amber-200/70 bg-amber-50/40" : ""}
          iconClassName={data?.pendingCollection ? "!from-amber-100 !to-amber-100/60 !border-amber-200" : ""}
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
            <CardTitle>Recent Collections</CardTitle>
            <Badge variant="outline">This Month</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.recentCollections && data.recentCollections.length > 0 ? (
                data.recentCollections.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-transparent hover:border-primary/20 hover:bg-white hover:shadow-card transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary-2/15 border border-primary/10">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          Flat {item.flat?.flatNumber || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.paidDate ? formatDate(item.paidDate) : formatDate(item.dueDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground text-sm">
                        {formatCurrency(Number(item.amount))}
                      </p>
                      <Badge
                        variant={item.status === "PAID" ? "success" : "warning"}
                        className="text-[11px] mt-1"
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No recent collections
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Expenses</CardTitle>
            <Badge variant="outline">All Time</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.recentExpenses && data.recentExpenses.length > 0 ? (
                data.recentExpenses.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-transparent hover:border-primary/20 hover:bg-white hover:shadow-card transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 border border-red-100">
                        <Receipt className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground text-sm">
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
                        className="text-[11px] mt-1"
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
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
          <CardTitle>Upcoming Events</CardTitle>
          <Badge variant="outline">Next 30 Days</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {data?.eventsList && data.eventsList.length > 0 ? (
              data.eventsList.map((event, index) => (
                <div
                  key={event.id || index}
                  className="p-4 rounded-xl border bg-muted/30 hover:bg-white hover:border-primary/25 hover:shadow-card transition-all duration-200 group"
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-primary/15 to-primary-2/15 border border-primary/10">
                      <CalendarDays className="w-4 h-4 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-[11px]">
                      {formatDate(event.startDate)}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {event.location || "No location specified"}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No upcoming events
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trend Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Collection Trend Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
            <CardTitle>Collection Trend</CardTitle>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-[#6366f1]" />
                Collected
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Pending
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {data?.collectionTrend &&
            data.collectionTrend.some((p) => p.collected > 0 || p.pending > 0) ? (
              <CollectionTrendChart data={data.collectionTrend} />
            ) : (
              <div className="h-72 flex items-center justify-center rounded-xl bg-muted/40 border border-border/60">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-medium text-muted-foreground text-sm">
                    No collection data yet
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Collected amounts will appear here over time
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Trend Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
            <CardTitle>Expense Trend</CardTitle>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f43f5e]" />
                Paid
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Pending
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {data?.expenseTrend &&
            data.expenseTrend.some((p) => p.paid > 0 || p.pending > 0) ? (
              <ExpenseTrendChart data={data.expenseTrend} />
            ) : (
              <div className="h-72 flex items-center justify-center rounded-xl bg-muted/40 border border-border/60">
                <div className="text-center">
                  <Receipt className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-medium text-muted-foreground text-sm">
                    No expense data yet
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Expense amounts will appear here over time
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
