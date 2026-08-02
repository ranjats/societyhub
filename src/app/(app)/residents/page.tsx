"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MobileCard, MobileCardRow } from "@/components/ui/responsive-table";
import { Pagination, usePagination } from "@/components/ui/pagination";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Plus,
  Search,
  Building2,
  Phone,
  Edit,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  UserCheck,
  UserX,
  Clock,
} from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  ownershipType: string;
  isActive: boolean;
  flat: { id: string; flatNumber: string; floor: number };
  vehicles: unknown[];
}

interface Flat {
  id: string;
  flatNumber: string;
  floor: number;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  flatId?: string;
  [key: string]: string | undefined;
}

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [pendingResidents, setPendingResidents] = useState<Resident[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    ownershipType: "OWNER",
    flatId: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [residentsRes, flatsRes, pendingRes] = await Promise.all([
        fetch("/api/residents"),
        fetch("/api/flats"),
        fetch("/api/residents/pending"),
      ]);
      if (residentsRes.ok) setResidents(await residentsRes.json());
      if (flatsRes.ok) setFlats(await flatsRes.json());
      if (pendingRes.ok) setPendingResidents(await pendingRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      ownershipType: "OWNER",
      flatId: "",
    });
    setFormErrors({});
  };

  const openEditDialog = (resident: Resident) => {
    setEditingResident(resident);
    setFormData({
      firstName: resident.firstName,
      lastName: resident.lastName,
      email: resident.email || "",
      phone: resident.phone,
      ownershipType: resident.ownershipType,
      flatId: resident.flat.id,
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.phone.trim() || formData.phone.length < 10)
      errors.phone = "Phone must be at least 10 digits";
    if (!formData.flatId) errors.flatId = "Flat is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/residents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim(),
          ownershipType: formData.ownershipType,
          flatId: formData.flatId,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        if (res.status === 400 && result.details) {
          const serverErrors: FormErrors = {};
          for (const [field, msgs] of Object.entries(result.details)) {
            if (Array.isArray(msgs) && msgs.length > 0)
              (serverErrors as Record<string, string>)[field] = msgs[0] as string;
          }
          setFormErrors(serverErrors);
          return;
        }
        throw new Error(result.error || "Failed to create resident");
      }
      toast.success(`Resident "${result.firstName} ${result.lastName}" created`);
      setIsAddDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create resident");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!validateForm() || !editingResident) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/residents/${editingResident.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim(),
          ownershipType: formData.ownershipType,
          flatId: formData.flatId,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        if (res.status === 400 && result.details) {
          const serverErrors: FormErrors = {};
          for (const [field, msgs] of Object.entries(result.details)) {
            if (Array.isArray(msgs) && msgs.length > 0)
              (serverErrors as Record<string, string>)[field] = msgs[0] as string;
          }
          setFormErrors(serverErrors);
          return;
        }
        throw new Error(result.error || "Failed to update resident");
      }
      toast.success("Resident updated successfully");
      setIsEditDialogOpen(false);
      setEditingResident(null);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update resident");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/residents/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to delete resident");
      toast.success("Resident deleted successfully");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete resident");
    }
  };

  const handleApproveReject = async (id: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/residents/pending/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || `Failed to ${action} resident`);
      toast.success(result.message || `Resident ${action}d successfully`);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action} resident`);
    }
  };

  const filteredResidents = residents.filter(
    (r) =>
      r.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.flat.flatNumber.includes(searchQuery)
  );

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems,
    totalItems,
  } = usePagination(filteredResidents, 15);

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Residents"
          description="Manage society residents"
          icon={Users}
        />
        <Card className="border-red-100 bg-red-50/40">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="w-8 h-8 text-red-600 mb-4" />
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              Failed to Load Residents
            </h2>
            <p className="text-red-700 text-sm text-center max-w-md mb-6">
              {error}
            </p>
            <Button
              onClick={fetchData}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ResidentForm = () => (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            className={formErrors.firstName ? "border-red-500" : ""}
          />
          {formErrors.firstName && (
            <p className="text-sm text-red-500">{formErrors.firstName}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            className={formErrors.lastName ? "border-red-500" : ""}
          />
          {formErrors.lastName && (
            <p className="text-sm text-red-500">{formErrors.lastName}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          placeholder="Optional"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>
          Phone <span className="text-red-500">*</span>
        </Label>
        <Input
          placeholder="+91 98765 43210"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className={formErrors.phone ? "border-red-500" : ""}
        />
        {formErrors.phone && (
          <p className="text-sm text-red-500">{formErrors.phone}</p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Ownership Type</Label>
          <Select
            value={formData.ownershipType}
            onValueChange={(v) =>
              setFormData({ ...formData, ownershipType: v })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OWNER">Owner</SelectItem>
              <SelectItem value="TENANT">Tenant</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>
            Flat <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.flatId}
            onValueChange={(v) => setFormData({ ...formData, flatId: v })}
          >
            <SelectTrigger className={formErrors.flatId ? "border-red-500" : ""}>
              <SelectValue placeholder="Select flat" />
            </SelectTrigger>
            <SelectContent>
              {flats.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  Flat {f.flatNumber} (Floor {f.floor})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formErrors.flatId && (
            <p className="text-sm text-red-500">{formErrors.flatId}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Residents"
        description="Manage society residents"
        icon={Users}
      >
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Add Resident
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Resident</DialogTitle>
              <DialogDescription>
                Fill in the details to add a new resident.
              </DialogDescription>
            </DialogHeader>
            <ResidentForm />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
                  </>
                ) : (
                  "Create Resident"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Pending Registrations Section */}
      {pendingResidents.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-amber-900">Pending Registrations ({pendingResidents.length})</h3>
            </div>
            <p className="text-sm text-amber-700 mb-3">New resident registrations waiting for your approval.</p>
            <div className="space-y-2">
              {pendingResidents.map((pending) => (
                <div key={pending.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-medium">
                      {getInitials(pending.firstName, pending.lastName)}
                    </div>
                    <div>
                      <p className="font-medium">{pending.firstName} {pending.lastName}</p>
                      <p className="text-sm text-gray-500">Flat {pending.flat.flatNumber} &middot; {pending.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50" onClick={() => handleApproveReject(pending.id, "approve")}>
                      <UserCheck className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                          <UserX className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reject Registration?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will reject {pending.firstName} {pending.lastName}&apos;s registration. They will need to register again.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleApproveReject(pending.id, "reject")} className="bg-red-600 hover:bg-red-700">Reject</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search residents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary">{filteredResidents.length} Residents</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading residents...</p>
            </div>
          ) : filteredResidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Users className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">No residents found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Add your first resident to get started"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resident</TableHead>
                      <TableHead>Flat</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((resident) => (
                      <TableRow key={resident.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-medium">
                              {getInitials(resident.firstName, resident.lastName)}
                            </div>
                            <div>
                              <p className="font-medium">
                                {resident.firstName} {resident.lastName}
                              </p>
                              {resident.email && (
                                <p className="text-sm text-gray-500">
                                  {resident.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" /> Flat{" "}
                            {resident.flat.flatNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />{" "}
                            {resident.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              resident.ownershipType === "OWNER"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {resident.ownershipType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              resident.isActive ? "success" : "destructive"
                            }
                          >
                            {resident.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(resident)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Resident?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will soft-delete {resident.firstName}{" "}
                                    {resident.lastName}. They will no longer appear in
                                    the list.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(resident.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
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
                {paginatedItems.map((resident) => (
                  <MobileCard key={resident.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-medium">
                          {getInitials(resident.firstName, resident.lastName)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {resident.firstName} {resident.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            Flat {resident.flat.flatNumber}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(resident)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Resident?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will soft-delete {resident.firstName}{" "}
                                {resident.lastName}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(resident.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <MobileCardRow label="Phone">{resident.phone}</MobileCardRow>
                      <MobileCardRow label="Type">
                        <Badge
                          variant={
                            resident.ownershipType === "OWNER"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {resident.ownershipType}
                        </Badge>
                      </MobileCardRow>
                      <MobileCardRow label="Status">
                        <Badge
                          variant={resident.isActive ? "success" : "destructive"}
                          className="text-xs"
                        >
                          {resident.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </MobileCardRow>
                    </div>
                  </MobileCard>
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingResident(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Resident</DialogTitle>
            <DialogDescription>Update the resident&apos;s information.</DialogDescription>
          </DialogHeader>
          <ResidentForm />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingResident(null);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
