"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  Repeat,
  CalendarDays,
  FileText,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  allDay: boolean;
  color: string | null;
  recurring: boolean;
}

interface FormErrors { title?: string; startDate?: string; endDate?: string; [key: string]: string | undefined; }

export default function CalendarPage() {
  const { data: session } = useSession();
  const isCommittee = session?.user?.role === "COMMITTEE_MEMBER";

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    color: "#4f46e5",
  });

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/calendar");
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const resetForm = () => {
    setFormData({ title: "", description: "", startDate: "", endDate: "", color: "#4f46e5" });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errs: FormErrors = {};
    if (!formData.title.trim()) errs.title = "Title is required";
    if (!formData.startDate) errs.startDate = "Start date is required";
    if (!formData.endDate) errs.endDate = "End date is required";
    else if (formData.startDate && formData.endDate < formData.startDate) errs.endDate = "End date must be on or after start";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      const start = new Date(`${formData.startDate}T00:00:00`);
      const end = new Date(`${formData.endDate}T00:00:00`);
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          color: formData.color,
          allDay: true,
          recurring: false,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create event");
      toast.success("Calendar event created");
      setIsAddDialogOpen(false);
      resetForm();
      fetchEvents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getEventsForDay = (day: number) => {
    if (!day) return [];
    return events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();
  const upcomingEvents = events
    .filter((e) => new Date(e.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <div className="space-y-6">
      <PageHeader title="Calendar" description="Society events and important dates" icon={Calendar}>
        {isCommittee && (
          <Dialog open={isAddDialogOpen} onOpenChange={(o) => { setIsAddDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Calendar Event</DialogTitle>
                <DialogDescription>
                  Add a new event to the society calendar.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    placeholder="Event title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={formErrors.title ? "border-red-500" : ""}
                  />
                  {formErrors.title && <p className="text-sm text-red-500">{formErrors.title}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Event description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date <span className="text-red-500">*</span></Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className={formErrors.startDate ? "border-red-500" : ""}
                    />
                    {formErrors.startDate && <p className="text-sm text-red-500">{formErrors.startDate}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date <span className="text-red-500">*</span></Label>
                    <Input
                      id="endDate"
                      type="date"
                      min={formData.startDate || undefined}
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className={formErrors.endDate ? "border-red-500" : ""}
                    />
                    {formErrors.endDate && <p className="text-sm text-red-500">{formErrors.endDate}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-14 h-10 p-1"
                    />
                    <span className="text-sm text-muted-foreground">Pick a color for the event</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Add Event"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")} className="h-9 w-9">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-xl">
              {monthName} {year}
            </CardTitle>
            <Button variant="outline" size="icon" onClick={() => navigateMonth("next")} className="h-9 w-9">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <Badge variant="outline">{events.length} events</Badge>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-sm font-medium text-gray-500"
                >
                  {day}
                </div>
              ))}

              {days.map((day, index) => {
                const dayEvents = day ? getEventsForDay(day) : [];
                const isToday =
                  day === new Date().getDate() &&
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear();

                return (
                  <div
                    key={index}
                    className={`min-h-[80px] p-1 border rounded-lg ${
                      day ? "bg-white hover:bg-gray-50" : "bg-gray-50"
                    } ${isToday ? "ring-2 ring-primary" : ""}`}
                  >
                    {day && (
                      <>
                        <div
                          className={`text-sm font-medium p-1 ${
                            isToday
                              ? "bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center"
                              : "text-gray-700"
                          }`}
                        >
                          {day}
                        </div>
                        <div className="space-y-1 mt-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <button
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className="text-xs p-1 rounded truncate w-full text-left cursor-pointer hover:brightness-95 transition"
                              style={{
                                backgroundColor: event.color || "#3b82f6",
                                color: "white",
                              }}
                              title={event.title}
                            >
                              {event.title}
                            </button>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingEvents.slice(0, 5).map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="w-full text-left flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition cursor-pointer"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: event.color || "#3b82f6" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{event.title}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(event.startDate)}
                  </p>
                </div>
                {event.recurring && (
                  <Badge variant="outline" className="text-xs">
                    Recurring
                  </Badge>
                )}
              </button>
            ))}
            {upcomingEvents.length === 0 && (
              <p className="text-center text-gray-500 py-4">No upcoming events</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event details dialog — click any event to view */}
      <Dialog open={!!selectedEvent} onOpenChange={(o) => { if (!o) setSelectedEvent(null); }}>
        <DialogContent>
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: selectedEvent.color || "#3b82f6" }}
                  />
                  <DialogTitle className="text-xl">{selectedEvent.title}</DialogTitle>
                </div>
                {selectedEvent.recurring && (
                  <div className="mt-1">
                    <Badge variant="info" className="text-xs">
                      <Repeat className="w-3 h-3 mr-1" /> Recurring event
                    </Badge>
                  </div>
                )}
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex items-start gap-3">
                  <CalendarDays className="w-4.5 h-4.5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">When</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(selectedEvent.startDate)}
                    </p>
                    {selectedEvent.endDate !== selectedEvent.startDate && (
                      <p className="text-sm text-muted-foreground">
                        until {formatDateTime(selectedEvent.endDate)}
                      </p>
                    )}
                  </div>
                </div>
                {selectedEvent.description && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-4.5 h-4.5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Description</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedEvent.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
