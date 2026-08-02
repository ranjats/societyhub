"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Plus,
  Loader2,
  Hourglass,
  Send,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
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
  paymentMethod: string | null;
  notes: string | null;
  flat: {
    flatNumber: string;
  };
}

const PAYMENT_METHODS = ["UPI", "Net Banking", "Cash", "Cheque", "Other"];

const getMonthName = (month: number) => {
  return new Date(2024, month - 1).toLocaleString("default", {
    month: "long",
  });
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<Record<string, string>>({});
  const [submitForm, setSubmitForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: "",
    paymentMethod: "UPI",
    notes: "",
  });

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

  const resetSubmitForm = () => {
    setSubmitForm({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      amount: "",
      paymentMethod: "UPI",
      notes: "",
    });
    setSubmitErrors({});
  };

  const handleSubmitPayment = async () => {
    const errors: Record<string, string> = {};
    if (!submitForm.amount || Number(submitForm.amount) <= 0)
      errors.amount = "Enter a valid amount";
    if (!submitForm.year || submitForm.year < 2020)
      errors.year = "Enter a valid year";
    setSubmitErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: Number(submitForm.month),
          year: Number(submitForm.year),
          amount: Number(submitForm.amount),
          paymentMethod: submitForm.paymentMethod,
          notes: submitForm.notes.trim() || undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        if (res.status === 400 && result.details) {
          const errs: Record<string, string> = {};
          for (const [f, m] of Object.entries(result.details)) {
            if (Array.isArray(m) && m.length > 0)
              errs[f] = m[0] as string;
          }
          setSubmitErrors(errs);
          return;
        }
        throw new Error(result.error || "Failed to submit payment");
      }
      toast.success(
        "Payment details submitted! The committee has been notified and will approve shortly."
      );
      setIsSubmitDialogOpen(false);
      resetSubmitForm();
      fetchPayments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "SUBMITTED":
        return <Send className="w-4 h-4 text-blue-500" />;
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
      case "SUBMITTED":
        return "info";
      case "PENDING":
        return "warning";
      case "OVERDUE":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "Awaiting Approval";
      default:
        return status;
    }
  };

  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const thisMonthPaid = payments
    .filter(
      (p) =>
        p.status === "PAID" &&
        p.month === currentMonth &&
        p.year === currentYear
    )
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalSubmitted = payments
    .filter((p) => p.status === "SUBMITTED")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPending = payments
    .filter((p) => p.status === "PENDING" || p.status === "OVERDUE")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Payments"
        description="View your payment history, dues, and submit monthly maintenance payments"
        icon={Wallet}
      >
        <Dialog
          open={isSubmitDialogOpen}
          onOpenChange={(o) => {
            setIsSubmitDialogOpen(o);
            if (!o) resetSubmitForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Submit Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit Monthly Payment</DialogTitle>
              <DialogDescription>
                Paid the committee? Submit the details below. The committee will
                be notified and approve your payment.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Month <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={submitForm.month.toString()}
                    onValueChange={(v) =>
                      setSubmitForm({ ...submitForm, month: Number(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {getMonthName(i + 1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Year <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="2020"
                    value={submitForm.year}
                    onChange={(e) =>
                      setSubmitForm({ ...submitForm, year: Number(e.target.value) })
                    }
                    className={submitErrors.year ? "border-red-500" : ""}
                  />
                  {submitErrors.year && (
                    <p className="text-sm text-red-500">{submitErrors.year}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>
                  Amount Paid (₹) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="1"
                    placeholder="5000"
                    value={submitForm.amount}
                    onChange={(e) =>
                      setSubmitForm({ ...submitForm, amount: e.target.value })
                    }
                    className={`pl-9 ${submitErrors.amount ? "border-red-500" : ""}`}
                  />
                </div>
                {submitErrors.amount && (
                  <p className="text-sm text-red-500">{submitErrors.amount}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={submitForm.paymentMethod}
                  onValueChange={(v) =>
                    setSubmitForm({ ...submitForm, paymentMethod: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description / Notes</Label>
                <Input
                  placeholder="e.g. Paid via UPI to committee account"
                  value={submitForm.notes}
                  onChange={(e) =>
                    setSubmitForm({ ...submitForm, notes: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsSubmitDialogOpen(false);
                  resetSubmitForm();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitPayment} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" /> Submit for Approval
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 border border-emerald-500/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-lg font-bold text-emerald-600">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 border border-indigo-500/10">
                <Wallet className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  This Month Contribution
                </p>
                <p className="text-lg font-bold text-indigo-600">
                  {formatCurrency(thisMonthPaid)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-500/15 border border-blue-500/10">
                <Hourglass className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Awaiting Approval
                </p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(totalSubmitted)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/15 border border-amber-500/10">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Outstanding Dues</p>
                <p className="text-lg font-bold text-amber-600">
                  {formatCurrency(totalPending)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payment History</CardTitle>
          <Badge variant="outline">{payments.length} records</Badge>
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
              <p className="text-sm text-gray-400 mt-1">
                Submit your first monthly payment to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
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
                      {payment.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-[220px] truncate" title={payment.notes}>
                          {payment.notes}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {formatCurrency(Number(payment.amount))}
                      </span>
                    </TableCell>
                    <TableCell>
                      {payment.paymentMethod || "-"}
                    </TableCell>
                    <TableCell>{formatDate(payment.dueDate)}</TableCell>
                    <TableCell>
                      {payment.paidDate ? formatDate(payment.paidDate) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.status)}
                        <Badge variant={getStatusColor(payment.status) as any}>
                          {getStatusLabel(payment.status)}
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
