"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowDownToLine, ArrowUpFromLine, CheckCircle2, Clock, Users,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
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
  bookings: { id: string; quantity: number; resident: { firstName: string; lastName: string } }[];
}

interface Booking {
  id: string;
  quantity: number;
  status: string;
  borrowDate: string;
  returnDate: string | null;
  notes: string | null;
  asset: { id: string; name: string; category: string };
  resident: { firstName: string; lastName: string; phone: string | null };
}

interface FormErrors { name?: string; category?: string; quantity?: string; [key: string]: string | undefined; }
interface Resident { id: string; firstName: string; lastName: string; flat: { flatNumber: string } | null }

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

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBorrowDialogOpen, setIsBorrowDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [borrowingAsset, setBorrowingAsset] = useState<Asset | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState({
    name: "", description: "", category: "", totalQuantity: "1", location: "", condition: "",
  });
  const [borrowData, setBorrowData] = useState({
    residentId: "", quantity: "1", notes: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [assetsRes, bookingsRes, residentsRes] = await Promise.all([
        fetch("/api/assets"),
        fetch("/api/asset-bookings"),
        fetch("/api/residents"),
      ]);
      if (assetsRes.ok) setAssets(await assetsRes.json());
      if (bookingsRes.ok) setBookings(await bookingsRes.json());
      if (residentsRes.ok) setResidents(await residentsRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setFormData({ name: "", description: "", category: "", totalQuantity: "1", location: "", condition: "" });
    setFormErrors({});
  };

  const resetBorrowForm = () => {
    setBorrowData({ residentId: "", quantity: "1", notes: "" });
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

  const validateForm = (): boolean => {
    const errs: FormErrors = {};
    if (!formData.name.trim()) errs.name = "Name is required";
    if (!formData.category.trim()) errs.category = "Category is required";
    if (!formData.totalQuantity || Number(formData.totalQuantity) < 1) errs.quantity = "Quantity must be at least 1";
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

  const handleReturn = async (bookingId: string, action: "return" | "cancel") => {
    try {
      const res = await fetch(`/api/asset-bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success(action === "return" ? "Asset returned successfully" : "Booking cancelled");
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

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Society Assets</h1><p className="text-gray-500">Track and manage society assets inventory</p></div>
        <Card className="border-red-200 bg-red-50/50"><CardContent className="flex flex-col items-center justify-center py-12"><AlertTriangle className="w-8 h-8 text-red-600 mb-4" /><h2 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Assets</h2><p className="text-red-700 text-sm text-center max-w-md mb-6">{error}</p><Button onClick={fetchData} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100"><RefreshCw className="w-4 h-4 mr-2" /> Try Again</Button></CardContent></Card>
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
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Society Assets</h1><p className="text-gray-500">Track and manage society assets inventory</p></div>
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
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100"><Package className="w-5 h-5 text-blue-600" /></div><div><p className="text-sm text-gray-500">Total Items</p><p className="text-lg font-bold text-blue-600">{totalQuantity}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100"><CheckCircle2 className="w-5 h-5 text-green-600" /></div><div><p className="text-sm text-gray-500">Available</p><p className="text-lg font-bold text-green-600">{totalAvailable}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100"><Clock className="w-5 h-5 text-amber-600" /></div><div><p className="text-sm text-gray-500">Borrowed</p><p className="text-lg font-bold text-amber-600">{totalBorrowed}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100"><Users className="w-5 h-5 text-purple-600" /></div><div><p className="text-sm text-gray-500">Asset Types</p><p className="text-lg font-bold text-purple-600">{assets.length}</p></div></div></CardContent></Card>
      </div>

      <div className="flex items-center gap-2">
        <Button variant={view === "assets" ? "default" : "outline"} size="sm" onClick={() => setView("assets")}>Assets</Button>
        <Button variant={view === "bookings" ? "default" : "outline"} size="sm" onClick={() => setView("bookings")}>Active Bookings</Button>
      </div>

      {view === "assets" && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search assets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
          <div className="flex items-center gap-2">{categories.map((c) => <Button key={c} variant={categoryFilter === c ? "default" : "outline"} size="sm" onClick={() => setCategoryFilter(c)}>{c === "ALL" ? "All" : c}</Button>)}</div>
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
                    <TableHead>Total</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Borrowed</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
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
                        <TableCell className="font-semibold">{asset.totalQuantity}</TableCell>
                        <TableCell><Badge variant={asset.availableQuantity > 0 ? "success" : "destructive"}>{asset.availableQuantity}</Badge></TableCell>
                        <TableCell><Badge variant={borrowed > 0 ? "warning" : "secondary"}>{borrowed}</Badge></TableCell>
                        <TableCell><Badge variant={asset.condition === "Excellent" ? "success" : asset.condition === "Good" ? "info" : asset.condition === "Fair" ? "warning" : "secondary"}>{asset.condition || "Unknown"}</Badge></TableCell>
                        <TableCell><div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-gray-400" /><span>{asset.location || "-"}</span></div></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {asset.availableQuantity > 0 && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => openBorrowDialog(asset)} title="Borrow"><ArrowDownToLine className="h-4 w-4" /></Button>
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

      {view === "bookings" && (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
            ) : bookings.filter((b) => b.status === "ACTIVE").length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8"><Clock className="w-12 h-12 text-gray-300 mb-4" /><p className="text-gray-500">No active bookings</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Resident</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Borrowed On</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.filter((b) => b.status === "ACTIVE").map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell><div className="flex items-center gap-3"><div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10"><Package className="w-5 h-5 text-primary" /></div><div><p className="font-medium">{booking.asset.name}</p><p className="text-sm text-gray-500">{booking.asset.category}</p></div></div></TableCell>
                      <TableCell><p className="font-medium">{booking.resident.firstName} {booking.resident.lastName}</p>{booking.resident.phone && <p className="text-sm text-gray-500">{booking.resident.phone}</p>}</TableCell>
                      <TableCell className="font-semibold">{booking.quantity}</TableCell>
                      <TableCell>{formatDate(booking.borrowDate)}</TableCell>
                      <TableCell>{booking.notes || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50" onClick={() => handleReturn(booking.id, "return")}><ArrowUpFromLine className="h-4 w-4 mr-1" /> Return</Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleReturn(booking.id, "cancel")} title="Cancel"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
    </div>
  );
}
