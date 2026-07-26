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
import { LoadingState, EmptyState } from "@/components/ui/state-components";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  IndianRupee, Plus, Search, CheckCircle2, Clock, TrendingUp, Edit, Trash2, AlertTriangle, RefreshCw, Loader2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Collection {
  id: string; amount: number; dueDate: string; paidDate: string | null; status: string;
  month: number; year: number; receiptNumber: string | null; flat: { id: string; flatNumber: string; floor: number };
}

interface Flat { id: string; flatNumber: string; floor: number }

interface FormErrors { flatId?: string; month?: string; year?: string; amount?: string; }

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState({
    flatId: "", month: new Date().getMonth() + 1, year: new Date().getFullYear(), amount: "", dueDate: "", status: "PENDING", receiptNumber: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const [colRes, flatRes] = await Promise.all([fetch("/api/collections"), fetch("/api/flats")]);
      if (colRes.ok) setCollections(await colRes.json());
      if (flatRes.ok) setFlats(await flatRes.json());
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setFormData({ flatId: "", month: new Date().getMonth() + 1, year: new Date().getFullYear(), amount: "", dueDate: "", status: "PENDING", receiptNumber: "" });
    setFormErrors({});
  };

  const openEditDialog = (c: Collection) => {
    setEditingCollection(c);
    setFormData({
      flatId: c.flat.id, month: c.month, year: c.year, amount: Number(c.amount).toString(),
      dueDate: c.dueDate.split("T")[0], status: c.status, receiptNumber: c.receiptNumber || "",
    });
    setFormErrors({}); setIsEditDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const errs: FormErrors = {};
    if (!formData.flatId) errs.flatId = "Flat is required";
    if (formData.month < 1 || formData.month > 12) errs.month = "Month must be 1-12";
    if (!formData.year || formData.year < 2020) errs.year = "Valid year required";
    if (!formData.amount || Number(formData.amount) <= 0) errs.amount = "Amount must be positive";
    setFormErrors(errs); return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/collections", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flatId: formData.flatId, month: Number(formData.month), year: Number(formData.year),
          amount: Number(formData.amount), dueDate: formData.dueDate || new Date().toISOString(),
          status: formData.status, receiptNumber: formData.receiptNumber || undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) { if (res.status === 400 && result.details) { const errs: FormErrors = {}; for (const [f, m] of Object.entries(result.details)) { if (Array.isArray(m) && m.length > 0) (errs as Record<string, string>)[f] = m[0] as string; } setFormErrors(errs); return; } throw new Error(result.error); }
      toast.success("Collection recorded successfully");
      setIsAddDialogOpen(false); resetForm(); fetchData();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to create collection"); }
    finally { setIsSubmitting(false); }
  };

  const handleUpdate = async () => {
    if (!validateForm() || !editingCollection) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/collections/${editingCollection.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flatId: formData.flatId, month: Number(formData.month), year: Number(formData.year),
          amount: Number(formData.amount), dueDate: formData.dueDate || undefined,
          status: formData.status, receiptNumber: formData.receiptNumber || undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) { if (res.status === 400 && result.details) { const errs: FormErrors = {}; for (const [f, m] of Object.entries(result.details)) { if (Array.isArray(m) && m.length > 0) (errs as Record<string, string>)[f] = m[0] as string; } setFormErrors(errs); return; } throw new Error(result.error); }
      toast.success("Collection updated successfully");
      setIsEditDialogOpen(false); setEditingCollection(null); resetForm(); fetchData();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update collection"); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/collections/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Collection deleted"); fetchData();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to delete collection"); }
  };

  const filteredCollections = collections.filter(
    (c) => (statusFilter === "ALL" || c.status === statusFilter) &&
      (c.flat.flatNumber.toLowerCase().includes(searchQuery.toLowerCase()) || c.receiptNumber?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const { currentPage, setCurrentPage, totalPages, paginatedItems, totalItems } = usePagination(filteredCollections, 15);
  const totalCollected = filteredCollections.filter((c) => c.status === "PAID").reduce((s, c) => s + Number(c.amount), 0);
  const totalPending = filteredCollections.filter((c) => c.status === "PENDING" || c.status === "OVERDUE").reduce((s, c) => s + Number(c.amount), 0);
  const getMonthName = (m: number) => new Date(2024, m - 1).toLocaleString("default", { month: "long" });

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Collections</h1><p className="text-gray-500">Track and manage maintenance payments</p></div>
        <EmptyState
          icon={<AlertTriangle className="w-12 h-12" />}
          title="Failed to Load Collections"
          description={error}
          action={<Button onClick={fetchData} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100"><RefreshCw className="w-4 h-4 mr-2" /> Try Again</Button>}
        />
      </div>
    );
  }

  const CollectionForm = () => (
    <div className="grid gap-4 py-2">
      <div className="space-y-2">
        <Label>Flat <span className="text-red-500">*</span></Label>
        <Select value={formData.flatId} onValueChange={(v) => setFormData({ ...formData, flatId: v })}>
          <SelectTrigger className={formErrors.flatId ? "border-red-500" : ""}><SelectValue placeholder="Select flat" /></SelectTrigger>
          <SelectContent>{flats.map((f) => <SelectItem key={f.id} value={f.id}>Flat {f.flatNumber}</SelectItem>)}</SelectContent>
        </Select>
        {formErrors.flatId && <p className="text-sm text-red-500">{formErrors.flatId}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Month <span className="text-red-500">*</span></Label>
          <Select value={formData.month.toString()} onValueChange={(v) => setFormData({ ...formData, month: Number(v) })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Array.from({ length: 12 }, (_, i) => <SelectItem key={i + 1} value={(i + 1).toString()}>{getMonthName(i + 1)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Year <span className="text-red-500">*</span></Label>
          <Input type="number" min="2020" value={formData.year} onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Amount (₹) <span className="text-red-500">*</span></Label>
          <Input type="number" min="1" placeholder="5000" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className={formErrors.amount ? "border-red-500" : ""} />
          {formErrors.amount && <p className="text-sm text-red-500">{formErrors.amount}</p>}
        </div>
        <div className="space-y-2">
          <Label>Due Date</Label>
          <Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
        </div>
      </div>
      {isEditDialogOpen && (
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-2">
        <Label>Receipt Number</Label>
        <Input placeholder="Optional" value={formData.receiptNumber} onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Collections</h1><p className="text-gray-500">Track and manage maintenance payments</p></div>
        <Dialog open={isAddDialogOpen} onOpenChange={(o) => { setIsAddDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Record Payment</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Record Payment</DialogTitle><DialogDescription>Record a new maintenance payment.</DialogDescription></DialogHeader>
            <CollectionForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Record Payment"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div><div><p className="text-sm text-gray-500">Collected</p><p className="text-lg font-bold text-emerald-600">{formatCurrency(totalCollected)}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100"><Clock className="w-5 h-5 text-amber-600" /></div><div><p className="text-sm text-gray-500">Pending</p><p className="text-lg font-bold text-amber-600">{formatCurrency(totalPending)}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100"><TrendingUp className="w-5 h-5 text-blue-600" /></div><div><p className="text-sm text-gray-500">Collection Rate</p><p className="text-lg font-bold text-blue-600">{filteredCollections.length > 0 ? Math.round((filteredCollections.filter((c) => c.status === "PAID").length / filteredCollections.length) * 100) : 0}%</p></div></div></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search by flat or receipt..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
        <div className="flex items-center gap-2 flex-wrap">{["ALL", "PAID", "PENDING", "OVERDUE"].map((s) => <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>{s === "ALL" ? "All" : s}</Button>)}</div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <LoadingState message="Loading collections..." />
          ) : filteredCollections.length === 0 ? (
            <EmptyState
              icon={<IndianRupee className="w-12 h-12" />}
              title="No collections found"
              description={searchQuery ? "Try adjusting your search" : "Record your first payment to get started"}
            />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader><TableRow><TableHead>Flat</TableHead><TableHead>Period</TableHead><TableHead>Amount</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead>Receipt</TableHead><TableHead className="w-[100px]">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {paginatedItems.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell><span className="font-medium">Flat {c.flat.flatNumber}</span></TableCell>
                        <TableCell>{getMonthName(c.month)} {c.year}</TableCell>
                        <TableCell><span className="font-semibold">{formatCurrency(Number(c.amount))}</span></TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(c.dueDate)}</TableCell>
                        <TableCell><Badge variant={c.status === "PAID" ? "success" : c.status === "PENDING" ? "warning" : "destructive"}>{c.status}</Badge></TableCell>
                        <TableCell>{c.receiptNumber || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(c)}><Edit className="h-4 w-4" /></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Delete this collection record?</AlertDialogTitle><AlertDialogDescription>This will remove the payment record for Flat {c.flat.flatNumber} ({getMonthName(c.month)} {c.year}).</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(c.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
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
                {paginatedItems.map((c) => (
                  <MobileCard key={c.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Flat {c.flat.flatNumber}</p>
                        <p className="text-sm text-gray-500">{getMonthName(c.month)} {c.year}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(Number(c.amount))}</p>
                        <Badge variant={c.status === "PAID" ? "success" : c.status === "PENDING" ? "warning" : "destructive"} className="text-xs">{c.status}</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <MobileCardRow label="Due Date">{formatDate(c.dueDate)}</MobileCardRow>
                      <MobileCardRow label="Receipt">{c.receiptNumber || "-"}</MobileCardRow>
                    </div>
                    <div className="flex items-center justify-end gap-1 pt-2 border-t">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(c)}><Edit className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-red-600"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Delete this collection record?</AlertDialogTitle><AlertDialogDescription>This will remove the payment record for Flat {c.flat.flatNumber} ({getMonthName(c.month)} {c.year}).</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(c.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
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

      <Dialog open={isEditDialogOpen} onOpenChange={(o) => { setIsEditDialogOpen(o); if (!o) { setEditingCollection(null); resetForm(); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Collection</DialogTitle><DialogDescription>Update the collection record.</DialogDescription></DialogHeader>
          <CollectionForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingCollection(null); resetForm(); }} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
