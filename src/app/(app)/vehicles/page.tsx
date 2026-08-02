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
  Car, Plus, Search, User, Tag, Edit, Trash2, AlertTriangle, RefreshCw, Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";

interface Vehicle {
  id: string; registrationNumber: string; type: string; brand: string | null; model: string | null;
  color: string | null; parkingSlot: string | null; isActive: boolean;
  resident: { id: string; firstName: string; lastName: string; phone: string };
}

interface Resident { id: string; firstName: string; lastName: string; }

interface FormErrors { registrationNumber?: string; residentId?: string; [key: string]: string | undefined; }

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState({
    registrationNumber: "", type: "CAR", brand: "", model: "", color: "", parkingSlot: "", residentId: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const [vRes, rRes] = await Promise.all([fetch("/api/vehicles"), fetch("/api/residents")]);
      if (vRes.ok) setVehicles(await vRes.json());
      if (rRes.ok) {
        const rData = await rRes.json();
        setResidents(rData.map((r: { id: string; firstName: string; lastName: string }) => ({ id: r.id, firstName: r.firstName, lastName: r.lastName })));
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => { setFormData({ registrationNumber: "", type: "CAR", brand: "", model: "", color: "", parkingSlot: "", residentId: "" }); setFormErrors({}); };

  const openEditDialog = (v: Vehicle) => {
    setEditingVehicle(v);
    setFormData({ registrationNumber: v.registrationNumber, type: v.type, brand: v.brand || "", model: v.model || "", color: v.color || "", parkingSlot: v.parkingSlot || "", residentId: v.resident.id });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const errs: FormErrors = {};
    if (!formData.registrationNumber.trim()) errs.registrationNumber = "Registration number is required";
    if (!formData.residentId) errs.residentId = "Resident is required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/vehicles", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber: formData.registrationNumber.trim(), type: formData.type, brand: formData.brand.trim() || undefined, model: formData.model.trim() || undefined, color: formData.color.trim() || undefined, parkingSlot: formData.parkingSlot.trim() || undefined, residentId: formData.residentId }),
      });
      const result = await res.json();
      if (!res.ok) { if (res.status === 400 && result.details) { const errs: FormErrors = {}; for (const [f, m] of Object.entries(result.details)) { if (Array.isArray(m) && m.length > 0) (errs as Record<string, string>)[f] = m[0]; } setFormErrors(errs); return; } throw new Error(result.error); }
      toast.success("Vehicle registered successfully");
      setIsAddDialogOpen(false); resetForm(); fetchData();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to register vehicle"); }
    finally { setIsSubmitting(false); }
  };

  const handleUpdate = async () => {
    if (!validateForm() || !editingVehicle) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/vehicles/${editingVehicle.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber: formData.registrationNumber.trim(), type: formData.type, brand: formData.brand.trim() || undefined, model: formData.model.trim() || undefined, color: formData.color.trim() || undefined, parkingSlot: formData.parkingSlot.trim() || undefined, residentId: formData.residentId }),
      });
      const result = await res.json();
      if (!res.ok) { if (res.status === 400 && result.details) { const errs: FormErrors = {}; for (const [f, m] of Object.entries(result.details)) { if (Array.isArray(m) && m.length > 0) (errs as Record<string, string>)[f] = m[0]; } setFormErrors(errs); return; } throw new Error(result.error); }
      toast.success("Vehicle updated successfully");
      setIsEditDialogOpen(false); setEditingVehicle(null); resetForm(); fetchData();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update vehicle"); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Vehicle deleted"); fetchData();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to delete vehicle"); }
  };

  const filteredVehicles = vehicles.filter(
    (v) => (typeFilter === "ALL" || v.type === typeFilter) &&
      (v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) || v.resident.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || v.resident.lastName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Vehicles" description="Manage registered vehicles" icon={Car} />
        <Card className="border-red-100 bg-red-50/40"><CardContent className="flex flex-col items-center justify-center py-12"><AlertTriangle className="w-8 h-8 text-red-600 mb-4" /><h2 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Vehicles</h2><p className="text-red-700 text-sm text-center max-w-md mb-6">{error}</p><Button onClick={fetchData} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100"><RefreshCw className="w-4 h-4 mr-2" /> Try Again</Button></CardContent></Card>
      </div>
    );
  }

  const VehicleForm = () => (
    <div className="grid gap-4 py-2">
      <div className="space-y-2">
        <Label>Registration Number <span className="text-red-500">*</span></Label>
        <Input placeholder="KA-01-XX-1234" value={formData.registrationNumber} onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })} className={formErrors.registrationNumber ? "border-red-500" : ""} />
        {formErrors.registrationNumber && <p className="text-sm text-red-500">{formErrors.registrationNumber}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CAR">Car</SelectItem>
              <SelectItem value="BIKE">Bike</SelectItem>
              <SelectItem value="BICYCLE">Bicycle</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Color</Label>
          <Input placeholder="e.g. White" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Brand</Label>
          <Input placeholder="e.g. Maruti" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Model</Label>
          <Input placeholder="e.g. Swift" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Resident <span className="text-red-500">*</span></Label>
          <Select value={formData.residentId} onValueChange={(v) => setFormData({ ...formData, residentId: v })}>
            <SelectTrigger className={formErrors.residentId ? "border-red-500" : ""}><SelectValue placeholder="Select owner" /></SelectTrigger>
            <SelectContent>{residents.map((r) => <SelectItem key={r.id} value={r.id}>{r.firstName} {r.lastName}</SelectItem>)}</SelectContent>
          </Select>
          {formErrors.residentId && <p className="text-sm text-red-500">{formErrors.residentId}</p>}
        </div>
        <div className="space-y-2">
          <Label>Parking Slot</Label>
          <Input placeholder="Optional" value={formData.parkingSlot} onChange={(e) => setFormData({ ...formData, parkingSlot: e.target.value })} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Vehicles" description="Manage registered vehicles" icon={Car}>
        <Dialog open={isAddDialogOpen} onOpenChange={(o) => { setIsAddDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Register Vehicle</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Register New Vehicle</DialogTitle><DialogDescription>Add a vehicle to the society registry.</DialogDescription></DialogHeader>
            <VehicleForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registering...</> : "Register Vehicle"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100"><Car className="w-5 h-5 text-blue-600" /></div><div><p className="text-sm text-gray-500">Total</p><p className="text-lg font-bold">{vehicles.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100"><Car className="w-5 h-5 text-blue-600" /></div><div><p className="text-sm text-gray-500">Cars</p><p className="text-lg font-bold">{vehicles.filter((v) => v.type === "CAR").length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100"><Car className="w-5 h-5 text-green-600" /></div><div><p className="text-sm text-gray-500">Bikes</p><p className="text-lg font-bold">{vehicles.filter((v) => v.type === "BIKE").length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100"><Car className="w-5 h-5 text-amber-600" /></div><div><p className="text-sm text-gray-500">Others</p><p className="text-lg font-bold">{vehicles.filter((v) => v.type !== "CAR" && v.type !== "BIKE").length}</p></div></div></CardContent></Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search vehicles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
        <div className="flex items-center gap-2">{["ALL", "CAR", "BIKE", "BICYCLE", "OTHER"].map((t) => <Button key={t} variant={typeFilter === t ? "default" : "outline"} size="sm" onClick={() => setTypeFilter(t)}>{t === "ALL" ? "All" : t}</Button>)}</div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : filteredVehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8"><Car className="w-12 h-12 text-gray-300 mb-4" /><p className="text-gray-500">No vehicles found</p></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Registration</TableHead><TableHead>Type</TableHead><TableHead>Vehicle</TableHead><TableHead>Color</TableHead><TableHead>Owner</TableHead><TableHead>Parking</TableHead><TableHead>Status</TableHead><TableHead className="w-[100px]">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell><div className="flex items-center gap-2"><Tag className="w-4 h-4 text-gray-400" /><span className="font-mono font-medium">{vehicle.registrationNumber}</span></div></TableCell>
                    <TableCell><Badge variant={vehicle.type === "CAR" ? "info" : vehicle.type === "BIKE" ? "success" : "secondary"}>{vehicle.type}</Badge></TableCell>
                    <TableCell>{vehicle.brand} {vehicle.model}</TableCell>
                    <TableCell><div className="flex items-center gap-2">{vehicle.color && <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: vehicle.color.toLowerCase() }} />}{vehicle.color || "-"}</div></TableCell>
                    <TableCell><div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /><span>{vehicle.resident.firstName} {vehicle.resident.lastName}</span></div></TableCell>
                    <TableCell>{vehicle.parkingSlot || "-"}</TableCell>
                    <TableCell><Badge variant={vehicle.isActive ? "success" : "destructive"}>{vehicle.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(vehicle)}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete vehicle {vehicle.registrationNumber}?</AlertDialogTitle><AlertDialogDescription>This will soft-delete this vehicle record.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(vehicle.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
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

      <Dialog open={isEditDialogOpen} onOpenChange={(o) => { setIsEditDialogOpen(o); if (!o) { setEditingVehicle(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Vehicle</DialogTitle><DialogDescription>Update the vehicle details.</DialogDescription></DialogHeader>
          <VehicleForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingVehicle(null); resetForm(); }} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
