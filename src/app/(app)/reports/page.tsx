"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Download,
  FileText,
  IndianRupee,
  Users,
  Building2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ReportsData {
  totalCollection: number;
  totalExpenses: number;
  pendingDues: number;
  totalResidents: number;
  totalFlats: number;
  occupiedFlats: number;
  collectionRate: number;
  occupancyRate: number;
  expensesByCategory: { category: string; amount: number }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Utilities: "bg-blue-500",
  "Staff Salary": "bg-green-500",
  Maintenance: "bg-amber-500",
  Security: "bg-purple-500",
  "Garden & Landscaping": "bg-emerald-500",
  Repairs: "bg-red-500",
  Other: "bg-gray-500",
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/reports");
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to load reports (${response.status})`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const reports = [
    {
      title: "Collection Summary",
      description: "Monthly and yearly collection reports",
      icon: IndianRupee,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Expense Report",
      description: "Detailed expense breakdown by category",
      icon: FileText,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Resident Directory",
      description: "Complete list of residents with contact details",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Flat Occupancy",
      description: "Status of all flats and occupancy rates",
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Vehicle Registry",
      description: "All registered vehicles in the society",
      icon: BarChart3,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Asset Valuation",
      description: "Current value of society assets",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
  ];

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500">Generate and download society reports</p>
        </div>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Reports</h2>
            <p className="text-red-700 text-sm text-center max-w-md mb-6">{error}</p>
            <Button onClick={fetchReports} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500">Generate and download society reports</p>
        </div>
        <Button variant="outline" onClick={fetchReports}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Collection</p>
                <p className="text-lg font-bold text-green-600">
                  {loading ? "..." : formatCurrency(data?.totalCollection || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="text-lg font-bold text-red-600">
                  {loading ? "..." : formatCurrency(data?.totalExpenses || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100">
                <IndianRupee className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Dues</p>
                <p className="text-lg font-bold text-amber-600">
                  {loading ? "..." : formatCurrency(data?.pendingDues || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Residents</p>
                <p className="text-lg font-bold text-blue-600">
                  {loading ? "..." : data?.totalResidents || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Available Reports</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report, index) => {
            const Icon = report.icon;
            return (
              <Card key={index} className="card-hover cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${report.bgColor}`}>
                      <Icon className={`w-6 h-6 ${report.color}`} />
                    </div>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <h3 className="font-semibold mb-1">{report.title}</h3>
                  <p className="text-sm text-gray-500">{report.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Collection Statistics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Collection Rate</span>
                    <span className="font-medium">{data?.collectionRate || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${data?.collectionRate || 0}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Occupancy Rate</span>
                    <span className="font-medium">{data?.occupancyRate || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${data?.occupancyRate || 0}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Expense Breakdown</h3>
                <div className="space-y-2">
                  {data?.expensesByCategory && data.expensesByCategory.length > 0 ? (
                    data.expensesByCategory.map((expense) => (
                      <div key={expense.category} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.Other}`} />
                          <span className="text-sm">{expense.category}</span>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(expense.amount)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No expenses recorded yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
