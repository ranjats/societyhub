"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Megaphone, Plus, Search, AlertCircle, Clock, Calendar, Edit, Trash2, AlertTriangle, RefreshCw, Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Notice {
  id: string; title: string; content: string; priority: string; isPublished: boolean;
  publishedAt: string | null; expiresAt: string | null; createdAt: string;
  creator: { firstName: string; lastName: string };
}

interface FormErrors { title?: string; content?: string; [key: string]: string | undefined; }

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState({
    title: "", content: "", priority: "MEDIUM", expiresAt: "",
  });

  const fetchNotices = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch("/api/notices");
      if (res.ok) setNotices(await res.json());
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load notices"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);

  const resetForm = () => { setFormData({ title: "", content: "", priority: "MEDIUM", expiresAt: "" }); setFormErrors({}); };

  const openEditDialog = (n: Notice) => {
    setEditingNotice(n);
    setFormData({ title: n.title, content: n.content, priority: n.priority, expiresAt: n.expiresAt ? n.expiresAt.split("T")[0] : "" });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const errs: FormErrors = {};
    if (!formData.title.trim()) errs.title = "Title is required";
    if (!formData.content.trim()) errs.content = "Content is required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/notices", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formData.title.trim(), content: formData.content.trim(), priority: formData.priority, expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined }),
      });
      const result = await res.json();
      if (!res.ok) { if (res.status === 400 && result.details) { const errs: FormErrors = {}; for (const [f, m] of Object.entries(result.details)) { if (Array.isArray(m) && m.length > 0) (errs as Record<string, string>)[f] = m[0]; } setFormErrors(errs); return; } throw new Error(result.error); }
      toast.success("Notice published successfully");
      setIsAddDialogOpen(false); resetForm(); fetchNotices();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to create notice"); }
    finally { setIsSubmitting(false); }
  };

  const handleUpdate = async () => {
    if (!validateForm() || !editingNotice) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/notices/${editingNotice.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formData.title.trim(), content: formData.content.trim(), priority: formData.priority, expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined }),
      });
      const result = await res.json();
      if (!res.ok) { if (res.status === 400 && result.details) { const errs: FormErrors = {}; for (const [f, m] of Object.entries(result.details)) { if (Array.isArray(m) && m.length > 0) (errs as Record<string, string>)[f] = m[0]; } setFormErrors(errs); return; } throw new Error(result.error); }
      toast.success("Notice updated successfully");
      setIsEditDialogOpen(false); setEditingNotice(null); resetForm(); fetchNotices();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update notice"); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notices/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Notice deleted"); fetchNotices();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to delete notice"); }
  };

  const filteredNotices = notices.filter(
    (n) => (priorityFilter === "ALL" || n.priority === priorityFilter) &&
      (n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getPriorityColor = (p: string) => p === "URGENT" ? "destructive" : p === "HIGH" ? "warning" : p === "MEDIUM" ? "info" : "secondary";

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Notices</h1><p className="text-gray-500">View and manage society notices</p></div>
        <Card className="border-red-200 bg-red-50/50"><CardContent className="flex flex-col items-center justify-center py-12"><AlertTriangle className="w-8 h-8 text-red-600 mb-4" /><h2 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Notices</h2><p className="text-red-700 text-sm text-center max-w-md mb-6">{error}</p><Button onClick={fetchNotices} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100"><RefreshCw className="w-4 h-4 mr-2" /> Try Again</Button></CardContent></Card>
      </div>
    );
  }

  const NoticeForm = () => (
    <div className="grid gap-4 py-2">
      <div className="space-y-2">
        <Label>Title <span className="text-red-500">*</span></Label>
        <Input placeholder="Notice title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={formErrors.title ? "border-red-500" : ""} />
        {formErrors.title && <p className="text-sm text-red-500">{formErrors.title}</p>}
      </div>
      <div className="space-y-2">
        <Label>Content <span className="text-red-500">*</span></Label>
        <Input placeholder="Notice content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className={formErrors.content ? "border-red-500" : ""} />
        {formErrors.content && <p className="text-sm text-red-500">{formErrors.content}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Expires At</Label>
          <Input type="date" value={formData.expiresAt} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Notices</h1><p className="text-gray-500">View and manage society notices</p></div>
        <Dialog open={isAddDialogOpen} onOpenChange={(o) => { setIsAddDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Create Notice</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Create New Notice</DialogTitle><DialogDescription>Publish a new notice for residents.</DialogDescription></DialogHeader>
            <NoticeForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing...</> : "Publish Notice"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search notices..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
        <div className="flex items-center gap-2">{["ALL", "URGENT", "HIGH", "MEDIUM", "LOW"].map((p) => <Button key={p} variant={priorityFilter === p ? "default" : "outline"} size="sm" onClick={() => setPriorityFilter(p)}>{p === "ALL" ? "All" : p}</Button>)}</div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : filteredNotices.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center p-8"><Megaphone className="w-12 h-12 text-gray-300 mb-4" /><p className="text-gray-500">No notices found</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((notice) => (
            <Card key={notice.id} className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${notice.priority === "URGENT" ? "bg-red-100" : notice.priority === "HIGH" ? "bg-amber-100" : notice.priority === "MEDIUM" ? "bg-blue-100" : "bg-gray-100"}`}>
                      <Megaphone className={`w-5 h-5 ${notice.priority === "URGENT" ? "text-red-600" : notice.priority === "HIGH" ? "text-amber-600" : notice.priority === "MEDIUM" ? "text-blue-600" : "text-gray-600"}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{notice.title}</h3>
                      <p className="text-sm text-gray-500">Published by {notice.creator.firstName} {notice.creator.lastName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={getPriorityColor(notice.priority)}>{notice.priority}</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(notice)}><Edit className="h-3.5 w-3.5" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Delete "{notice.title}"?</AlertDialogTitle><AlertDialogDescription>This will soft-delete this notice.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(notice.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <p className="text-gray-600 mb-4 whitespace-pre-wrap">{notice.content}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /><span>{formatDate(notice.createdAt)}</span></div>
                  {notice.expiresAt && <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>Expires: {formatDate(notice.expiresAt)}</span></div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={(o) => { setIsEditDialogOpen(o); if (!o) { setEditingNotice(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Notice</DialogTitle><DialogDescription>Update the notice details.</DialogDescription></DialogHeader>
          <NoticeForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingNotice(null); resetForm(); }} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
