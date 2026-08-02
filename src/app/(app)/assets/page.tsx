"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
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
  Package, Plus, Search, MapPin, Edit, Trash2, AlertTriangle, RefreshCw, Loader2,
  ArrowDownToLine, ArrowUpFromLine, CheckCheck, XCircle, CheckCircle2, Clock, Users,
  Send, ClipboardList,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";

interface Asset {
  id: string;
  name: string;
  description: string | null;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  location: string | null;
  condition: string | null;
  isActive: boolean;
  bookings?: { id: string; quantity: number; resident: { firstName: string; lastName: string } }[];
}

type BookingStatus =
  | "REQUESTED" | "APPROVED" | "ACTIVE" | "REJECTED" | "RETURNED" | "COMPLETED" | "CANCELLED";

interface Booking {
  id: string;
  quantity: number;
  status: BookingStatus;
  borrowDate: string;
  returnDate: string | null;
  pickupDate: string | null;
  expectedReturnDate: string | null;
  notes: string | null;
  asset: { id: string; name: string; category: string };
  resident: { firstName: string; lastName: string; phone: string | null; flat: { flatNumber: string } | null };
}

interface FormErrors { name?: string; category?: string; quantity?: string; pickupDate?: string; expectedReturnDate?: string; [key: string]: string | undefined; }
interface Resident { id: string; firstName: string; lastName: string; flat: { flatNumber: string } | null }

const STATUS_META: Record<BookingStatus, { label: string; variant: "info" | "success" | "secondary" | "warning" | "destructive" | "default" | "outline" }> = {
  REQUESTED: { label: "Pending Approval", variant: "info" },
  APPROVED: { label: "Approved", variant: "success" },
  ACTIVE: { label: "Active", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  RETURNED: { label: "Returned", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "secondary" },
  CANCELLED: { label: "Cancelled", variant: "outline" },
};

export default function AssetsPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const isCommittee = user?.role === "COMMITTEE_MEMBER";

  const [assets, setAssets] = useState<Asset[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [view, setView] = useState<"assets" | "bookings">("assets");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBorrowDialogOpen, setIsBorrowDialogOpen] = useState(false);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [borrowingAsset, setBorrowingAsset] = useState<Asset | null>(null);
  const [requestingAsset, setRequestingAsset] = useState<Asset | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState({
    name: "", description: "", category: "", totalQuantity: "1", location: "", condition: "",
  });
  const [borrowData, setBorrowData] = useState({
    residentId: "", quantity: "1", notes: "", pickupDate: "", expectedReturnDate: "",
  });
  const [requestData, setRequestData] = useState({
    quantity: "1", pickupDate: "", expectedReturnDate: "", notes: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [assetsRes, bookingsRes] = await Promise.all([
        fetch("/api/assets"),
        fetch("/api/asset-bookings"),
      ]);
      if (assetsRes.ok) setAssets(await assetsRes.json());
      if (bookingsRes.ok) setBookings(await bookingsRes.json());
      if (isCommittee) {
        const residentsRes = await fetch("/api/residents");
        if (residentsRes.ok) setResidents(await residentsRes.json());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [isCommittee]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setFormData({ name: "", description: "", category: "", totalQuantity: "1", location: "", condition: "" });
    setFormErrors({});
  };

  const resetBorrowForm = () => {
    setBorrowData({ residentId: "", quantity: "1", notes: "", pickupDate: "", expectedReturnDate: "" });
  };

  const resetRequestForm = () => {
    setRequestData({ quantity: "1", pickupDate: "", expectedReturnDate: "", notes: "" });
    setFormErrors({});
  };

  const openEditDialog = (a: Asset) => {
    setEditingAsset(a);
    setFormData({
      name: a.name, description: a.description || "", category: a.category,
      totalQuantity: a.totalQuantity.toString(), location: a.location || "", condition: a.condition || "",
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const openBorrowDialog = (a: Asset) => {
    setBorrowingAsset(a);
    resetBorrowForm();
    setIsBorrowDialogOpen(true);
  };

  const openRequestDialog = (a: Asset) => {
    setRequestingAsset(a);
    resetRequestForm();
    setIsRequestDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const errs: FormErrors = {};
    if (!formData.name.trim()) errs.name = "Name is required";
    if (!formData.category.trim()) errs.category = "Category is required";
    if (!formData.totalQuantity || Number(formData.totalQuantity) < 1) errs.quantity = "Quantity must be at least 1";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateRequest = (): boolean => {
    const errs: FormErrors = {};
    const qty = Number(requestData.quantity);
    if (!requestData.quantity || qty < 1) errs.quantity = "Quantity must be at least 1";
    else if (requestingAsset && qty > requestingAsset.availableQuantity) errs.quantity = `Only ${requestingAsset.availableQuantity} available`;
    if (!requestData.pickupDate) errs.pickupDate = "Pickup date is required";
    if (!requestData.expectedReturnDate) errs.expectedReturnDate = "Return date is required";
    else if (requestData.pickupDate && requestData.expectedReturnDate < requestData.pickupDate) errs.expectedReturnDate = "Return date must be on or after pickup";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          category: formData.category.trim(),
          totalQuantity: Number(formData.totalQuantity),
          location: formData.location.trim() || undefined,
          condition: formData.condition.trim() || undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        if (res.status === 400 && result.details) {
          const errs: FormErrors = {};
          for (const [f, m] of Object.entries(result.details)) {
            if (Array.isArray(m) && m.length > 0) (errs as Record<string, string>)[f] = m[0];
          }
          setFormErrors(errs);
          return;
        }
        throw new Error(result.error);
      }
      toast.success("Asset created successfully");
      setIsAddDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!validateForm() || !editingAsset) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/assets/${editingAsset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          category: formData.category.trim(),
          totalQuantity: Number(formData.totalQuantity),
          location: formData.location.trim() || undefined,
          condition: formData.condition.trim() || undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Asset updated successfully");
      setIsEditDialogOpen(false);
      setEditingAsset(null);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Asset deleted");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete asset");
    }
  };

  const handleBorrow = async () => {
    if (!borrowingAsset || !borrowData.residentId) {
      toast.error("Please select a resident");
      return;
    }
    const qty = Number(borrowData.quantity);
    if (qty < 1 || qty > borrowingAsset.availableQuantity) {
      toast.error(`Quantity must be between 1 and ${borrowingAsset.availableQuantity}`);
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/asset-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: borrowingAsset.id,
          residentId: borrowData.residentId,
          quantity: qty,
          notes: borrowData.notes.trim() || undefined,
          pickupDate: borrowData.pickupDate || undefined,
          expectedReturnDate: borrowData.expectedReturnDate || undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success(`${borrowingAsset.name} borrowed successfully`);
      setIsBorrowDialogOpen(false);
      setBorrowingAsset(null);
      resetBorrowForm();
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to borrow asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequest = async () => {
    if (!requestingAsset || !validateRequest()) return;
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/asset-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: requestingAsset.id,
          quantity: Number(requestData.quantity),
          notes: requestData.notes.trim() || undefined,
          pickupDate: requestData.pickupDate,
          expectedReturnDate: requestData.expectedReturnDate,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        if (res.status === 400 && result.details) {
          const errs: FormErrors = {};
          for (const [f, m] of Object.entries(result.details)) {
            if (Array.isArray(m) && m.length > 0) (errs as Record<string, string>)[f] = m[0];
          }
          setFormErrors(errs);
          return;
        }
        throw new Error(result.error);
      }
      toast.success("Asset request submitted — awaiting committee approval");
      setIsRequestDialogOpen(false);
      setRequestingAsset(null);
      resetRequestForm();
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookingAction = async (bookingId: string, action: string, successMsg: string) => {
    try {
      const res = await fetch(`/api/asset-bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success(successMsg);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process");
    }
  };

  const categories = ["ALL", ...new Set(assets.map((a) => a.category))];
  const filteredAssets = assets.filter(
    (a) => (categoryFilter === "ALL" || a.category === categoryFilter) &&
      (a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalQuantity = assets.reduce((s, a) => s + a.totalQuantity, 0);
  const totalAvailable = assets.reduce((s, a) => s + a.availableQuantity, 0);
  const totalBorrowed = totalQuantity - totalAvailable;

  const myRequests = bookings;
  const myPending = myRequests.filter((b) => b.status === "REQUESTED").length;
  const myApproved = myRequests.filter((b) => b.status === "APPROVED" || b.status === "ACTIVE").length;

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "ACTIVE") return b.status === "ACTIVE" || b.status === "APPROVED";
    return b.status === statusFilter;
  });

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Society Assets" description={isCommittee ? "Track and manage society assets inventory" : "Browse society assets and raise booking requests"} icon={Package} />
        <Card className="border-red-100 bg-red-50/40"><CardContent className="flex flex-col items-center justify-center py-12"><AlertTriangle className="w-8 h-8 text-red-600 mb-4" /><h2 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Assets</h2><p className="text-red-700 text-sm text-center max-w-md mb-6">{error}</p><Button onClick={fetchData} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100"><RefreshCw className="w-4 h-4 mr-2" /> Try Again</Button></CardContent></Card>
      </div>
    );
  }

  const AssetForm = () => (
    <div className="grid gap-4 py-2">
      <div className="space-y-2">
        <Label>Name <span className="text-red-500">*</span></Label>
        <Input placeholder="e.g. Chairs, Tables, Projector" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={formErrors.name ? "border-red-500" : ""} />
        {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category <span className="text-red-500">*</span></Label>
          <Input placeholder="e.g. Furniture, Electronics" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={formErrors.category ? "border-red-500" : ""} />
          {formErrors.category && <p className="text-sm text-red-500">{formErrors.category}</p>}
        </div>
        <div className="space-y-2">
          <Label>Total Quantity <span className="text-red-500">*</span></Label>
          <Input type="number" min="1" value={formData.totalQuantity} onChange={(e) => setFormData({ ...formData, totalQuantity: e.target.value })} className={formErrors.quantity ? "border-red-500" : ""} disabled={!!editingAsset} />
          {formErrors.quantity && <p className="text-sm text-red-500">{formErrors.quantity}</p>}
          {editingAsset && <p className="text-xs text-gray-400">Cannot change quantity after creation</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Condition</Label>
          <Input placeholder="e.g. Good, Fair, New" value={formData.condition} onChange={(e) => setFormData({ ...formData, condition: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Location</Label>
          <Input placeholder="e.g. Common Hall, Store Room" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input placeholder="Optional description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Society Assets" description={isCommittee ? "Track and manage society assets inventory" : "Browse society assets and raise booking requests"} icon={Package}>
        {isCommittee && (
          <Dialog open={isAddDialogOpen} onOpenChange={(o) => { setIsAddDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Asset</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Asset</DialogTitle><DialogDescription>Register a new society asset with quantity.</DialogDescription></DialogHeader>
              <AssetForm />
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }} disabled={isSubmitting}>Cancel</Button>
                <Button onClick={handleCreate} disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Create Asset"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-500/15 border border-blue-500/10"><Package className="w-5 h-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">{isCommittee ? "Total Items" : "Available Items"}</p><p className="text-lg font-bold text-blue-600">{isCommittee ? totalQuantity : totalAvailable}</p></div></div></CardContent></Card>
        <Card className="card-hover"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 border border-emerald-500/10"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div><div><p className="text-sm text-muted-foreground">{isCommittee ? "Available" : "My Requests"}</p><p className="text-lg font-bold text-emerald-600">{isCommittee ? totalAvailable : myRequests.length}</p></div></div></CardContent></Card>
        <Card className="card-hover"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/15 border border-amber-500/10"><Clock className="w-5 h-5 text-amber-600" /></div><div><p className="text-sm text-muted-foreground">{isCommittee ? "Borrowed" : "Awaiting Approval"}</p><p className="text-lg font-bold text-amber-600">{isCommittee ? totalBorrowed : myPending}</p></div></div></CardContent></Card>
        <Card className="card-hover"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 border border-violet-500/10"><Users className="w-5 h-5 text-violet-600" /></div><div><p className="text-sm text-muted-foreground">{isCommittee ? "Asset Types" : "Approved"}</p><p className="text-lg font-bold text-violet-600">{isCommittee ? assets.length : myApproved}</p></div></div></CardContent></Card>
      </div>

      <div className="flex items-center gap-2">
        <Button variant={view === "assets" ? "default" : "outline"} size="sm" onClick={() => setView("assets")}>Assets</Button>
        <Button variant={view === "bookings" ? "default" : "outline"} size="sm" onClick={() => setView("bookings")}>{isCommittee ? "All Bookings" : "My Requests"}</Button>
      </div>

      {view === "assets" && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search assets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
          <div className="flex items-center gap-2 flex-wrap">{categories.map((c) => <Button key={c} variant={categoryFilter === c ? "default" : "outline"} size="sm" onClick={() => setCategoryFilter(c)}>{c === "ALL" ? "All" : c}</Button>)}</div>
        </div>
      )}

      {view === "assets" && (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
            ) : filteredAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8"><Package className="w-12 h-12 text-gray-300 mb-4" /><p className="text-gray-500">No assets found</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Category</TableHead>
                    {isCommittee && <TableHead>Total</TableHead>}
                    <TableHead>Available</TableHead>
                    {!isCommittee && <TableHead>Condition</TableHead>}
                    {!isCommittee && <TableHead>Location</TableHead>}
                    {isCommittee && <TableHead>Borrowed</TableHead>}
                    {isCommittee && <TableHead>Condition</TableHead>}
                    {isCommittee && <TableHead>Location</TableHead>}
                    <TableHead className="w-[130px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => {
                    const borrowed = asset.totalQuantity - asset.availableQuantity;
                    return (
                      <TableRow key={asset.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10"><Package className="w-5 h-5 text-primary" /></div>
                            <div><p className="font-medium">{asset.name}</p>{asset.description && <p className="text-sm text-gray-500 truncate max-w-[200px]">{asset.description}</p>}</div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{asset.category}</Badge></TableCell>
                        {isCommittee && <TableCell className="font-semibold">{asset.totalQuantity}</TableCell>}
                        <TableCell><Badge variant={asset.availableQuantity > 0 ? "success" : "destructive"}>{asset.availableQuantity}</Badge></TableCell>
                        {!isCommittee && <TableCell><Badge variant={asset.condition === "Excellent" ? "success" : asset.condition === "Good" ? "info" : asset.condition === "Fair" ? "warning" : "secondary"}>{asset.condition || "Unknown"}</Badge></TableCell>}
                        {!isCommittee && <TableCell><div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-gray-400" /><span>{asset.location || "-"}</span></div></TableCell>}
                        {isCommittee && <TableCell><Badge variant={borrowed > 0 ? "warning" : "secondary"}>{borrowed}</Badge></TableCell>}
                        {isCommittee && <TableCell><Badge variant={asset.condition === "Excellent" ? "success" : asset.condition === "Good" ? "info" : asset.condition === "Fair" ? "warning" : "secondary"}>{asset.condition || "Unknown"}</Badge></TableCell>}
                        {isCommittee && <TableCell><div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-gray-400" /><span>{asset.location || "-"}</span></div></TableCell>}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {isCommittee ? (
                              asset.availableQuantity > 0 && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => openBorrowDialog(asset)} title="Borrow"><ArrowDownToLine className="h-4 w-4" /></Button>
                              )
                            ) : (
                              asset.availableQuantity > 0 && (
                                <Button size="sm" className="text-xs" onClick={() => openRequestDialog(asset)} disabled={!asset.isActive}><Send className="w-3.5 h-3.5 mr-1" /> Request</Button>
                              )
                            )}
                            {isCommittee && (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(asset)}><Edit className="h-4 w-4" /></Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Delete "{asset.name}"?</AlertDialogTitle><AlertDialogDescription>This will soft-delete this asset record.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(asset.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {view === "bookings" && isCommittee && (
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center gap-2 px-4 pt-4 flex-wrap">
              {[
                { value: "ALL", label: "All" },
                { value: "REQUESTED", label: "Pending" },
                { value: "ACTIVE", label: "Active" },
                { value: "RETURNED", label: "Returned" },
                { value: "COMPLETED", label: "Completed" },
              ].map((f) => (
                <Button key={f.value} variant={statusFilter === f.value ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(f.value)}>{f.label}</Button>
              ))}
            </div>
            {loading ? (
              <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
            ) : filteredBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8"><ClipboardList className="w-12 h-12 text-gray-300 mb-4" /><p className="text-gray-500">No bookings found</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Resident</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Pickup</TableHead>
                    <TableHead>Expected Return</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => {
                    const meta = STATUS_META[booking.status];
                    return (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10"><Package className="w-5 h-5 text-primary" /></div>
                            <div><p className="font-medium">{booking.asset.name}</p><p className="text-sm text-gray-500">{booking.asset.category}</p></div>
                          </div>
                        </TableCell>
                        <TableCell><p className="font-medium">{booking.resident.firstName} {booking.resident.lastName}</p>{booking.resident.flat && <p className="text-sm text-gray-500">Flat {booking.resident.flat.flatNumber}</p>}</TableCell>
                        <TableCell className="font-semibold">{booking.quantity}</TableCell>
                        <TableCell>{booking.pickupDate ? formatDate(booking.pickupDate) : "—"}</TableCell>
                        <TableCell>{booking.expectedReturnDate ? formatDate(booking.expectedReturnDate) : "—"}</TableCell>
                        <TableCell><Badge variant={meta.variant}>{meta.label}</Badge></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {booking.status === "REQUESTED" && (
                              <>
                                <Button variant="outline" size="sm" className="text-emerald-700 border-emerald-300 hover:bg-emerald-50" onClick={() => handleBookingAction(booking.id, "approve", "Request approved — resident notified")}><CheckCheck className="h-3.5 w-3.5 mr-1" /> Approve</Button>
                                <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => handleBookingAction(booking.id, "reject", "Request rejected")}><XCircle className="h-3.5 w-3.5 mr-1" /> Reject</Button>
                              </>
                            )}
                            {booking.status === "RETURNED" && (
                              <Button variant="outline" size="sm" className="text-emerald-700 border-emerald-300 hover:bg-emerald-50" onClick={() => handleBookingAction(booking.id, "complete", "Booking completed — stock restored")}><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Done</Button>
                            )}
                            {booking.status === "ACTIVE" && (
                              <>
                                <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50" onClick={() => handleBookingAction(booking.id, "return", "Asset marked returned")}><ArrowUpFromLine className="h-3.5 w-3.5 mr-1" /> Return</Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleBookingAction(booking.id, "cancel", "Booking cancelled")} title="Cancel"><Trash2 className="h-4 w-4" /></Button>
                              </>
                            )}
                            {booking.status === "APPROVED" && (
                              <span className="text-xs text-gray-400">Awaiting pickup</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {view === "bookings" && !isCommittee && (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
            ) : myRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8"><ClipboardList className="w-12 h-12 text-gray-300 mb-4" /><p className="text-gray-500">You haven't raised any asset requests yet. Go to the Assets tab and tap Request on an asset.</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Pickup</TableHead>
                    <TableHead>Expected Return</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myRequests.map((booking) => {
                    const meta = STATUS_META[booking.status];
                    const canReturn = booking.status === "APPROVED" || booking.status === "ACTIVE";
                    const canCancel = booking.status === "REQUESTED" || booking.status === "APPROVED" || booking.status === "ACTIVE";
                    return (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10"><Package className="w-5 h-5 text-primary" /></div>
                            <div><p className="font-medium">{booking.asset.name}</p><p className="text-sm text-gray-500">{booking.asset.category}</p></div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{booking.quantity}</TableCell>
                        <TableCell>{booking.pickupDate ? formatDate(booking.pickupDate) : "—"}</TableCell>
                        <TableCell>{booking.expectedReturnDate ? formatDate(booking.expectedReturnDate) : "—"}</TableCell>
                        <TableCell><Badge variant={meta.variant}>{meta.label}</Badge></TableCell>
                        <TableCell className="max-w-[180px]"><span className="block truncate">{booking.notes || "—"}</span></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {canReturn && (
                              <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50" onClick={() => handleBookingAction(booking.id, "return", "Marked as returned — committee will verify")}><ArrowUpFromLine className="h-3.5 w-3.5 mr-1" /> Return</Button>
                            )}
                            {canCancel && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleBookingAction(booking.id, "cancel", "Booking cancelled")} title="Cancel"><Trash2 className="h-4 w-4" /></Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={(o) => { setIsEditDialogOpen(o); if (!o) { setEditingAsset(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Asset</DialogTitle><DialogDescription>Update the asset details.</DialogDescription></DialogHeader>
          <AssetForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingAsset(null); resetForm(); }} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isCommittee && (
        <Dialog open={isBorrowDialogOpen} onOpenChange={(o) => { setIsBorrowDialogOpen(o); if (!o) { setBorrowingAsset(null); resetBorrowForm(); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Borrow Asset</DialogTitle>
              <DialogDescription>
                Borrow {borrowingAsset?.name} ({borrowingAsset?.availableQuantity} available)
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label>Resident <span className="text-red-500">*</span></Label>
                <Select value={borrowData.residentId} onValueChange={(value) => setBorrowData({ ...borrowData, residentId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select resident" />
                  </SelectTrigger>
                  <SelectContent>
                    {residents.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.firstName} {r.lastName} {r.flat ? `(${r.flat.flatNumber})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" min="1" max={borrowingAsset?.availableQuantity || 1} value={borrowData.quantity} onChange={(e) => setBorrowData({ ...borrowData, quantity: e.target.value })} />
                <p className="text-xs text-gray-400">Max: {borrowingAsset?.availableQuantity}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pickup Date</Label>
                  <Input type="date" value={borrowData.pickupDate} onChange={(e) => setBorrowData({ ...borrowData, pickupDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Expected Return</Label>
                  <Input type="date" value={borrowData.expectedReturnDate} onChange={(e) => setBorrowData({ ...borrowData, expectedReturnDate: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input placeholder="Optional notes" value={borrowData.notes} onChange={(e) => setBorrowData({ ...borrowData, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsBorrowDialogOpen(false); setBorrowingAsset(null); resetBorrowForm(); }} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleBorrow} disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : "Borrow"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {!isCommittee && (
        <Dialog open={isRequestDialogOpen} onOpenChange={(o) => { setIsRequestDialogOpen(o); if (!o) { setRequestingAsset(null); resetRequestForm(); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Asset</DialogTitle>
              <DialogDescription>
                Request {requestingAsset?.name} ({requestingAsset?.availableQuantity} available). The committee will review your request before you can pick it up.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label>Quantity <span className="text-red-500">*</span></Label>
                <Input type="number" min="1" max={requestingAsset?.availableQuantity || 1} value={requestData.quantity} onChange={(e) => setRequestData({ ...requestData, quantity: e.target.value })} className={formErrors.quantity ? "border-red-500" : ""} />
                <p className="text-xs text-gray-400">Max: {requestingAsset?.availableQuantity}</p>
                {formErrors.quantity && <p className="text-sm text-red-500">{formErrors.quantity}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pickup Date <span className="text-red-500">*</span></Label>
                  <Input type="date" min={new Date().toISOString().slice(0, 10)} value={requestData.pickupDate} onChange={(e) => setRequestData({ ...requestData, pickupDate: e.target.value })} className={formErrors.pickupDate ? "border-red-500" : ""} />
                  {formErrors.pickupDate && <p className="text-sm text-red-500">{formErrors.pickupDate}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Return Date <span className="text-red-500">*</span></Label>
                  <Input type="date" min={requestData.pickupDate || new Date().toISOString().slice(0, 10)} value={requestData.expectedReturnDate} onChange={(e) => setRequestData({ ...requestData, expectedReturnDate: e.target.value })} className={formErrors.expectedReturnDate ? "border-red-500" : ""} />
                  {formErrors.expectedReturnDate && <p className="text-sm text-red-500">{formErrors.expectedReturnDate}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Purpose / Notes</Label>
                <Input placeholder="e.g. Birthday party, family function" value={requestData.notes} onChange={(e) => setRequestData({ ...requestData, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsRequestDialogOpen(false); setRequestingAsset(null); resetRequestForm(); }} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleRequest} disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4 mr-2" /> Submit Request</>}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
