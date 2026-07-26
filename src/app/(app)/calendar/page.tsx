"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { formatDate } from "@/lib/utils";
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

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add days of the month
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-500">Society events and important dates</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Event title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" placeholder="Event description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input id="color" type="color" defaultValue="#3b82f6" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsAddDialogOpen(false)}>Add Event</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigateMonth("prev")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-xl">
            {monthName} {year}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => navigateMonth("next")}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-sm font-medium text-gray-500"
                >
                  {day}
                </div>
              ))}

              {/* Calendar days */}
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
                            <div
                              key={event.id}
                              className="text-xs p-1 rounded truncate"
                              style={{
                                backgroundColor: event.color || "#3b82f6",
                                color: "white",
                              }}
                              title={event.title}
                            >
                              {event.title}
                            </div>
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
            {events
              .filter((e) => new Date(e.startDate) >= new Date())
              .slice(0, 5)
              .map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: event.color || "#3b82f6" }}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(event.startDate)}
                    </p>
                  </div>
                  {event.recurring && (
                    <Badge variant="outline" className="text-xs">
                      Recurring
                    </Badge>
                  )}
                </div>
              ))}
            {events.filter((e) => new Date(e.startDate) >= new Date()).length === 0 && (
              <p className="text-center text-gray-500 py-4">No upcoming events</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
