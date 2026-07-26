"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  IndianRupee,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Payment {
  id: string;
  amount: any;
  dueDate: string;
  paidDate: string | null;
  status: string;
  month: number;
  year: number;
  receiptNumber: string | null;
  flat: {
    flatNumber: string;
  };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/collections");
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "PENDING":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "OVERDUE":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "success";
      case "PENDING":
        return "warning";
      case "OVERDUE":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getMonthName = (month: number) => {
    return new Date(2024, month - 1).toLocaleString("default", {
      month: "long",
    });
  };

  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPending = payments
    .filter((p) => p.status === "PENDING" || p.status === "OVERDUE")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Payments</h1>
        <p className="text-gray-500">View your payment history and pending dues</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Paid</p>
                <p className="text-lg font-bold text-emerald-600">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-lg font-bold text-amber-600">
                  {formatCurrency(totalPending)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Payments</p>
                <p className="text-lg font-bold text-blue-600">{payments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <IndianRupee className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500">No payment records found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {getMonthName(payment.month)} {payment.year}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {formatCurrency(Number(payment.amount))}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(payment.dueDate)}</TableCell>
                    <TableCell>
                      {payment.paidDate ? formatDate(payment.paidDate) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.status)}
                        <Badge variant={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{payment.receiptNumber || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
