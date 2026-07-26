"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  CalendarDays, Plus, Search, MapPin, Clock, Users, Edit, Trash2, AlertTriangle, RefreshCw, Loader2,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

interface Event {
  id: string; title: string; description: string | null; startDate: string; endDate: string;
  location: string | null; status: string; maxAttendees: number | null;
  creator: { firstName: string; lastName: string };
}

interface FormErrors { title?: string; startDate?: string; endDate?: string; [key: string]: string | undefined; }

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState({
    title: "", description: "", startDate: "", endDate: "", location: "", maxAttendees: "",
  });

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch("/api/events");
      if (res.ok) setEvents(await res.json());
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load events"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const resetForm = () => { setFormData({ title: "", description: "", startDate: "", endDate: "", location: "", maxAttendees: "" }); setFormErrors({}); };

  const openEditDialog = (ev: Event) => {
    setEditingEvent(ev);
    setFormData({
      title: ev.title, description: ev.description || "",
      startDate: ev.startDate.slice(0, 16), endDate: ev.endDate.slice(0, 16),
      location: ev.location || "", maxAttendees: ev.maxAttendees?.toString() || "",
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const toISO = (v: string) => v ? new Date(v).toISOString() : "";

  const validateForm = (): boolean => {
    const errs: FormErrors = {};
    if (!formData.title.trim()) errs.title = "Title is required";
    if (!formData.startDate) errs.startDate = "Start date is required";
    if (!formData.endDate) errs.endDate = "End date is required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/events", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(), description: formData.description.trim() || undefined,
          startDate: toISO(formData.startDate), endDate: toISO(formData.endDate),
          location: formData.location.trim() || undefined,
          maxAttendees: formData.maxAttendees ? Number(formData.maxAttendees) : undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) { if (res.status === 400 && result.details) { const errs: FormErrors = {}; for (const [f, m] of Object.entries(result.details)) { if (Array.isArray(m) && m.length > 0) (errs as Record<string, string>)[f] = m[0]; } setFormErrors(errs); return; } throw new Error(result.error); }
      toast.success("Event created successfully");
      setIsAddDialogOpen(false); resetForm(); fetchEvents();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to create event"); }
    finally { setIsSubmitting(false); }
  };

  const handleUpdate = async () => {
    if (!validateForm() || !editingEvent) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/events/${editingEvent.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(), description: formData.description.trim() || undefined,
          startDate: toISO(formData.startDate), endDate: toISO(formData.endDate),
          location: formData.location.trim() || undefined,
          maxAttendees: formData.maxAttendees ? Number(formData.maxAttendees) : undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) { if (res.status === 400 && result.details) { const errs: FormErrors = {}; for (const [f, m] of Object.entries(result.details)) { if (Array.isArray(m) && m.length > 0) (errs as Record<string, string>)[f] = m[0]; } setFormErrors(errs); return; } throw new Error(result.error); }
      toast.success("Event updated successfully");
      setIsEditDialogOpen(false); setEditingEvent(null); resetForm(); fetchEvents();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update event"); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Event deleted"); fetchEvents();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to delete event"); }
  };

  const filteredEvents = events.filter(
    (e) => (statusFilter === "ALL" || e.status === statusFilter) && e.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const upcomingEvents = filteredEvents.filter((e) => e.status === "UPCOMING" || e.status === "ONGOING");
  const pastEvents = filteredEvents.filter((e) => e.status === "COMPLETED" || e.status === "CANCELLED");

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Events</h1><p className="text-gray-500">Manage society events</p></div>
        <Card className="border-red-200 bg-red-50/50"><CardContent className="flex flex-col items-center justify-center py-12"><AlertTriangle className="w-8 h-8 text-red-600 mb-4" /><h2 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Events</h2><p className="text-red-700 text-sm text-center max-w-md mb-6">{error}</p><Button onClick={fetchEvents} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100"><RefreshCw className="w-4 h-4 mr-2" /> Try Again</Button></CardContent></Card>
      </div>
    );
  }

  const EventForm = () => (
    <div className="grid gap-4 py-2">
      <div className="space-y-2">
        <Label>Title <span className="text-red-500">*</span></Label>
        <Input placeholder="Event title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={formErrors.title ? "border-red-500" : ""} />
        {formErrors.title && <p className="text-sm text-red-500">{formErrors.title}</p>}
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input placeholder="Optional description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date & Time <span className="text-red-500">*</span></Label>
          <Input type="datetime-local" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className={formErrors.startDate ? "border-red-500" : ""} />
          {formErrors.startDate && <p className="text-sm text-red-500">{formErrors.startDate}</p>}
        </div>
        <div className="space-y-2">
          <Label>End Date & Time <span className="text-red-500">*</span></Label>
          <Input type="datetime-local" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className={formErrors.endDate ? "border-red-500" : ""} />
          {formErrors.endDate && <p className="text-sm text-red-500">{formErrors.endDate}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Location</Label>
          <Input placeholder="Optional" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Max Attendees</Label>
          <Input type="number" min="1" placeholder="Optional" value={formData.maxAttendees} onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Events</h1><p className="text-gray-500">Manage society events and activities</p></div>
        <Dialog open={isAddDialogOpen} onOpenChange={(o) => { setIsAddDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Create Event</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Create New Event</DialogTitle><DialogDescription>Add a new event for residents.</DialogDescription></DialogHeader>
            <EventForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : "Create Event"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
        <div className="flex items-center gap-2">{["ALL", "UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"].map((s) => <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>{s === "ALL" ? "All" : s}</Button>)}</div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <>
          <div>
            <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.length === 0 ? (
                <Card className="col-span-full"><CardContent className="flex flex-col items-center justify-center p-8"><CalendarDays className="w-12 h-12 text-gray-300 mb-4" /><p className="text-gray-500">No upcoming events</p></CardContent></Card>
              ) : upcomingEvents.map((event) => (
                <Card key={event.id} className="card-hover">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <div className="flex items-center gap-1">
                        <Badge variant={event.status === "UPCOMING" ? "info" : "success"}>{event.status}</Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(event)}><Edit className="h-3.5 w-3.5" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete "{event.title}"?</AlertDialogTitle><AlertDialogDescription>This will soft-delete this event.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(event.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {event.description && <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>}
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Clock className="w-4 h-4" /> <span>{formatDateTime(event.startDate)}</span></div>
                    {event.location && <div className="flex items-center gap-2 text-sm text-gray-600"><MapPin className="w-4 h-4" /> <span>{event.location}</span></div>}
                    {event.maxAttendees && <div className="flex items-center gap-2 text-sm text-gray-600"><Users className="w-4 h-4" /> <span>Max {event.maxAttendees}</span></div>}
                    <div className="text-xs text-gray-400">Created by {event.creator.firstName} {event.creator.lastName}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          {pastEvents.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Past Events</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pastEvents.map((event) => (
                  <Card key={event.id} className="opacity-75">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <div className="flex items-center gap-1">
                          <Badge variant={event.status === "CANCELLED" ? "destructive" : "secondary"}>{event.status}</Badge>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(event)}><Edit className="h-3.5 w-3.5" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Delete "{event.title}"?</AlertDialogTitle><AlertDialogDescription>This will soft-delete this event.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(event.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600"><Clock className="w-4 h-4" /> <span>{formatDateTime(event.startDate)}</span></div>
                      {event.location && <div className="flex items-center gap-2 text-sm text-gray-600"><MapPin className="w-4 h-4" /> <span>{event.location}</span></div>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={(o) => { setIsEditDialogOpen(o); if (!o) { setEditingEvent(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Event</DialogTitle><DialogDescription>Update the event details.</DialogDescription></DialogHeader>
          <EventForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingEvent(null); resetForm(); }} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
