"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { MobileCard, MobileCardRow } from "@/components/ui/responsive-table";
import { Pagination, usePagination } from "@/components/ui/pagination";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Receipt, Plus, Search, TrendingDown, CheckCircle2, Clock, Edit, Trash2, AlertTriangle, RefreshCw, Loader2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";

interface Expense {
  id: string; title: string; description: string | null; amount: number; category: string;
  vendor: string | null; status: string; createdAt: string; creator: { firstName: string; lastName: string };
}

interface FormErrors { title?: string; amount?: string; category?: string; }

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState({
    title: "", description: "", amount: "", category: "", vendor: "",
  });

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch("/api/expenses");
      if (res.ok) setExpenses(await res.json());
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load expenses"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const resetForm = () => { setFormData({ title: "", description: "", amount: "", category: "", vendor: "" }); setFormErrors({}); };

  const openEditDialog = (e: Expense) => {
    setEditingExpense(e);
    setFormData({ title: e.title, description: e.description || "", amount: Number(e.amount).toString(), category: e.category, vendor: e.vendor || "" });
    setFormErrors({}); setIsEditDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const errs: FormErrors = {};
    if (!formData.title.trim()) errs.title = "Title is required";
    if (!formData.amount || Number(formData.amount) <= 0) errs.amount = "Amount must be positive";
    if (!formData.category.trim()) errs.category = "Category is required";
    setFormErrors(errs); return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/expenses", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formData.title.trim(), description: formData.description.trim() || undefined, amount: Number(formData.amount), category: formData.category.trim(), vendor: formData.vendor.trim() || undefined }),
      });
      const result = await res.json();
      if (!res.ok) { if (res.status === 400 && result.details) { const errs: FormErrors = {}; for (const [f, m] of Object.entries(result.details)) { if (Array.isArray(m) && m.length > 0) (errs as Record<string, string>)[f] = m[0] as string; } setFormErrors(errs); return; } throw new Error(result.error); }
      toast.success("Expense created successfully");
      setIsAddDialogOpen(false); resetForm(); fetchExpenses();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to create expense"); }
    finally { setIsSubmitting(false); }
  };

  const handleUpdate = async () => {
    if (!validateForm() || !editingExpense) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formData.title.trim(), description: formData.description.trim() || undefined, amount: Number(formData.amount), category: formData.category.trim(), vendor: formData.vendor.trim() || undefined }),
      });
      const result = await res.json();
      if (!res.ok) { if (res.status === 400 && result.details) { const errs: FormErrors = {}; for (const [f, m] of Object.entries(result.details)) { if (Array.isArray(m) && m.length > 0) (errs as Record<string, string>)[f] = m[0] as string; } setFormErrors(errs); return; } throw new Error(result.error); }
      toast.success("Expense updated successfully");
      setIsEditDialogOpen(false); setEditingExpense(null); resetForm(); fetchExpenses();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update expense"); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Expense deleted"); fetchExpenses();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to delete expense"); }
  };

  const filteredExpenses = expenses.filter(
    (e) => (statusFilter === "ALL" || e.status === statusFilter) &&
      (e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const { currentPage, setCurrentPage, totalPages, paginatedItems, totalItems } = usePagination(filteredExpenses, 15);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Expenses" description="Track and manage society expenses" icon={Receipt} />
        <Card className="border-red-100 bg-red-50/40"><CardContent className="flex flex-col items-center justify-center py-12"><AlertTriangle className="w-8 h-8 text-red-600 mb-4" /><h2 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Expenses</h2><p className="text-red-700 text-sm text-center max-w-md mb-6">{error}</p><Button onClick={fetchExpenses} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100"><RefreshCw className="w-4 h-4 mr-2" /> Try Again</Button></CardContent></Card>
      </div>
    );
  }

  const ExpenseForm = () => (
    <div className="grid gap-4 py-2">
      <div className="space-y-2">
        <Label>Title <span className="text-red-500">*</span></Label>
        <Input placeholder="e.g. Electricity Bill" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={formErrors.title ? "border-red-500" : ""} />
        {formErrors.title && <p className="text-sm text-red-500">{formErrors.title}</p>}
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input placeholder="Optional description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Amount (₹) <span className="text-red-500">*</span></Label>
          <Input type="number" min="1" placeholder="5000" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className={formErrors.amount ? "border-red-500" : ""} />
          {formErrors.amount && <p className="text-sm text-red-500">{formErrors.amount}</p>}
        </div>
        <div className="space-y-2">
          <Label>Category <span className="text-red-500">*</span></Label>
          <Input placeholder="e.g. Utilities" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={formErrors.category ? "border-red-500" : ""} />
          {formErrors.category && <p className="text-sm text-red-500">{formErrors.category}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Vendor</Label>
        <Input placeholder="Optional vendor name" value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Expenses" description="Track and manage society expenses" icon={Receipt}>
        <Dialog open={isAddDialogOpen} onOpenChange={(o) => { setIsAddDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Expense</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add New Expense</DialogTitle><DialogDescription>Record a new expense.</DialogDescription></DialogHeader>
            <ExpenseForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Create Expense"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="card-hover"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-red-500/15 to-rose-500/15 border border-red-500/10"><TrendingDown className="w-5 h-5 text-red-600" /></div><div><p className="text-sm text-muted-foreground">Total Expenses</p><p className="text-lg font-bold text-red-600">{formatCurrency(totalExpenses)}</p></div></div></CardContent></Card>
        <Card className="card-hover"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 border border-emerald-500/10"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div><div><p className="text-sm text-muted-foreground">Paid</p><p className="text-lg font-bold text-emerald-600">{formatCurrency(expenses.filter((e) => e.status === "PAID").reduce((s, e) => s + Number(e.amount), 0))}</p></div></div></CardContent></Card>
        <Card className="card-hover"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/15 border border-amber-500/10"><Clock className="w-5 h-5 text-amber-600" /></div><div><p className="text-sm text-muted-foreground">Pending</p><p className="text-lg font-bold text-amber-600">{formatCurrency(expenses.filter((e) => e.status === "PENDING").reduce((s, e) => s + Number(e.amount), 0))}</p></div></div></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search expenses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
        <div className="flex items-center gap-2 flex-wrap">{["ALL", "PENDING", "APPROVED", "PAID", "REJECTED"].map((s) => <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>{s === "ALL" ? "All" : s}</Button>)}</div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-3"><Loader2 className="w-8 h-8 animate-spin text-primary" /><p className="text-sm text-muted-foreground">Loading expenses...</p></div>
          ) : filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12"><Receipt className="w-12 h-12 text-gray-300 mb-4" /><p className="text-gray-500 font-medium">No expenses found</p><p className="text-sm text-gray-400 mt-1">{searchQuery ? "Try adjusting your search" : "Add your first expense to get started"}</p></div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Vendor</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="w-[100px]">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {paginatedItems.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell><div><p className="font-medium">{expense.title}</p>{expense.description && <p className="text-sm text-gray-500 truncate max-w-[200px]">{expense.description}</p>}</div></TableCell>
                        <TableCell><Badge variant="outline">{expense.category}</Badge></TableCell>
                        <TableCell><span className="font-semibold">{formatCurrency(Number(expense.amount))}</span></TableCell>
                        <TableCell>{expense.vendor || "-"}</TableCell>
                        <TableCell><Badge variant={expense.status === "PAID" ? "success" : expense.status === "APPROVED" ? "default" : expense.status === "PENDING" ? "warning" : "destructive"}>{expense.status}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(expense.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(expense)}><Edit className="h-4 w-4" /></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Delete &quot;{expense.title}&quot;?</AlertDialogTitle><AlertDialogDescription>This will soft-delete this expense record.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(expense.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden p-4 space-y-3">
                {paginatedItems.map((expense) => (
                  <MobileCard key={expense.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{expense.title}</p>
                        <p className="text-sm text-gray-500">{expense.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(Number(expense.amount))}</p>
                        <Badge variant={expense.status === "PAID" ? "success" : expense.status === "APPROVED" ? "default" : expense.status === "PENDING" ? "warning" : "destructive"} className="text-xs">{expense.status}</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <MobileCardRow label="Vendor">{expense.vendor || "-"}</MobileCardRow>
                      <MobileCardRow label="Date">{formatDate(expense.createdAt)}</MobileCardRow>
                    </div>
                    <div className="flex items-center justify-end gap-1 pt-2 border-t">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(expense)}><Edit className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-red-600"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Delete &quot;{expense.title}&quot;?</AlertDialogTitle><AlertDialogDescription>This will soft-delete this expense record.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(expense.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </MobileCard>
                ))}
              </div>

              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={(o) => { setIsEditDialogOpen(o); if (!o) { setEditingExpense(null); resetForm(); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Expense</DialogTitle><DialogDescription>Update the expense details.</DialogDescription></DialogHeader>
          <ExpenseForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingExpense(null); resetForm(); }} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
