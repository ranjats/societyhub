"use client";

import { useEffect, useState, useCallback } from "react";
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
  Building2, Plus, Search, Users, IndianRupee, BedDouble, Maximize, Edit, Trash2, AlertTriangle, RefreshCw, Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";

interface Flat {
  id: string;
  flatNumber: string;
  floor: number;
  area: number | null;
  bedrooms: number | null;
  status: string;
  monthlyDues: any;
  residents: any[];
}

interface FormErrors {
  flatNumber?: string;
  floor?: string;
  monthlyDues?: string;
  [key: string]: string | undefined;
}

export default function FlatsPage() {
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingFlat, setEditingFlat] = useState<Flat | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState({
    flatNumber: "",
    floor: 1,
    area: "",
    bedrooms: "",
    monthlyDues: "",
    status: "OCCUPIED",
  });

  const fetchFlats = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch("/api/flats");
      if (res.ok) setFlats(await res.json());
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load flats"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFlats(); }, [fetchFlats]);

  const resetForm = () => {
    setFormData({ flatNumber: "", floor: 1, area: "", bedrooms: "", monthlyDues: "", status: "OCCUPIED" });
    setFormErrors({});
  };

  const openEditDialog = (flat: Flat) => {
    setEditingFlat(flat);
    setFormData({
      flatNumber: flat.flatNumber,
      floor: flat.floor,
      area: flat.area?.toString() || "",
      bedrooms: flat.bedrooms?.toString() || "",
      monthlyDues: Number(flat.monthlyDues).toString(),
      status: flat.status,
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!formData.flatNumber.trim()) errors.flatNumber = "Flat number is required";
    if (formData.floor < 0) errors.floor = "Floor must be non-negative";
    if (!formData.monthlyDues || Number(formData.monthlyDues) < 0) errors.monthlyDues = "Monthly dues must be positive";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/flats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flatNumber: formData.flatNumber.trim(),
          floor: Number(formData.floor),
          area: formData.area ? Number(formData.area) : undefined,
          bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
          monthlyDues: Number(formData.monthlyDues),
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        if (res.status === 400 && result.details) {
          const errs: FormErrors = {};
          for (const [f, msgs] of Object.entries(result.details)) { if (Array.isArray(msgs) && msgs.length > 0) (errs as Record<string, string>)[f] = msgs[0]; }
          setFormErrors(errs); return;
        }
        throw new Error(result.error || "Failed to create flat");
      }
      toast.success(`Flat ${result.flatNumber} created`);
      setIsAddDialogOpen(false); resetForm(); fetchFlats();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to create flat"); }
    finally { setIsSubmitting(false); }
  };

  const handleUpdate = async () => {
    if (!validateForm() || !editingFlat) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/flats/${editingFlat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flatNumber: formData.flatNumber.trim(),
          floor: Number(formData.floor),
          area: formData.area ? Number(formData.area) : undefined,
          bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
          monthlyDues: Number(formData.monthlyDues),
          status: formData.status,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        if (res.status === 400 && result.details) {
          const errs: FormErrors = {};
          for (const [f, msgs] of Object.entries(result.details)) { if (Array.isArray(msgs) && msgs.length > 0) (errs as Record<string, string>)[f] = msgs[0]; }
          setFormErrors(errs); return;
        }
        throw new Error(result.error || "Failed to update flat");
      }
      toast.success("Flat updated successfully");
      setIsEditDialogOpen(false); setEditingFlat(null); resetForm(); fetchFlats();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update flat"); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/flats/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to delete flat");
      toast.success("Flat deleted successfully");
      fetchFlats();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to delete flat"); }
  };

  const getStatusColor = (s: string) => s === "OCCUPIED" ? "success" : s === "VACANT" ? "warning" : "destructive";

  const filteredFlats = flats.filter(
    (f) => f.flatNumber.toLowerCase().includes(searchQuery.toLowerCase()) || f.floor.toString().includes(searchQuery)
  );

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Flats" description="Manage society flats" icon={Building2} />
        <Card className="border-red-200 bg-red-50/50"><CardContent className="flex flex-col items-center justify-center py-12"><AlertTriangle className="w-8 h-8 text-red-600 mb-4" /><h2 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Flats</h2><p className="text-red-700 text-sm text-center max-w-md mb-6">{error}</p><Button onClick={fetchFlats} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100"><RefreshCw className="w-4 h-4 mr-2" /> Try Again</Button></CardContent></Card>
      </div>
    );
  }

  const FlatForm = () => (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Flat Number <span className="text-red-500">*</span></Label>
          <Input placeholder="e.g. 101" value={formData.flatNumber} onChange={(e) => setFormData({ ...formData, flatNumber: e.target.value })} className={formErrors.flatNumber ? "border-red-500" : ""} />
          {formErrors.flatNumber && <p className="text-sm text-red-500">{formErrors.flatNumber}</p>}
        </div>
        <div className="space-y-2">
          <Label>Floor <span className="text-red-500">*</span></Label>
          <Input type="number" min="0" value={formData.floor} onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Area (sq ft)</Label>
          <Input type="number" placeholder="Optional" value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Bedrooms</Label>
          <Input type="number" min="1" placeholder="Optional" value={formData.bedrooms} onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Monthly Dues (₹) <span className="text-red-500">*</span></Label>
        <Input type="number" min="0" placeholder="e.g. 5000" value={formData.monthlyDues} onChange={(e) => setFormData({ ...formData, monthlyDues: e.target.value })} className={formErrors.monthlyDues ? "border-red-500" : ""} />
        {formErrors.monthlyDues && <p className="text-sm text-red-500">{formErrors.monthlyDues}</p>}
      </div>
      {isEditDialogOpen && (
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="OCCUPIED">Occupied</SelectItem>
              <SelectItem value="VACANT">Vacant</SelectItem>
              <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Flats" description="Manage society flats and apartments" icon={Building2}>
        <Dialog open={isAddDialogOpen} onOpenChange={(o) => { setIsAddDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Flat</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Flat</DialogTitle><DialogDescription>Enter the details for the new flat.</DialogDescription></DialogHeader>
            <FlatForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : "Create Flat"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search flats..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
        <Badge variant="secondary">{filteredFlats.length} Flats</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : filteredFlats.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8"><Building2 className="w-12 h-12 text-gray-300 mb-4" /><p className="text-gray-500">No flats found</p></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Flat</TableHead><TableHead>Floor</TableHead><TableHead>Area</TableHead><TableHead>Bedrooms</TableHead><TableHead>Monthly Dues</TableHead><TableHead>Resident</TableHead><TableHead>Status</TableHead><TableHead className="w-[100px]">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredFlats.map((flat) => (
                  <TableRow key={flat.id}>
                    <TableCell><div className="flex items-center gap-3"><div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10"><Building2 className="w-5 h-5 text-primary" /></div><span className="font-medium">{flat.flatNumber}</span></div></TableCell>
                    <TableCell>Floor {flat.floor}</TableCell>
                    <TableCell>{flat.area ? <div className="flex items-center gap-1"><Maximize className="w-4 h-4 text-gray-400" /> {flat.area} sq ft</div> : "-"}</TableCell>
                    <TableCell>{flat.bedrooms ? <div className="flex items-center gap-1"><BedDouble className="w-4 h-4 text-gray-400" /> {flat.bedrooms} BHK</div> : "-"}</TableCell>
                    <TableCell><div className="flex items-center gap-1"><IndianRupee className="w-4 h-4 text-gray-400" /> {formatCurrency(Number(flat.monthlyDues))}</div></TableCell>
                    <TableCell>{flat.residents.length > 0 ? <div className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" /> {flat.residents[0].firstName} {flat.residents[0].lastName}</div> : <span className="text-gray-400">Vacant</span>}</TableCell>
                    <TableCell><Badge variant={getStatusColor(flat.status)}>{flat.status.replace("_", " ")}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(flat)}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete Flat {flat.flatNumber}?</AlertDialogTitle><AlertDialogDescription>This will soft-delete this flat. All related data will be preserved but hidden.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(flat.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={(o) => { setIsEditDialogOpen(o); if (!o) { setEditingFlat(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Flat {editingFlat?.flatNumber}</DialogTitle><DialogDescription>Update the flat details.</DialogDescription></DialogHeader>
          <FlatForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingFlat(null); resetForm(); }} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
