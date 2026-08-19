"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Briefcase, 
  CheckSquare, 
  Plane, 
  Home, 
  Sparkles, 
  Trash2, 
  Clock, 
  Layers, 
  User, 
  Building,
  Flag,
  Globe
} from "lucide-react";
import { useToast } from "@/components/Toast";

interface CalendarEventItem {
  id: string;
  title: string;
  description?: string;
  type: "HOLIDAY" | "COMPANY_EVENT" | "MEETING" | "PROJECT_DEADLINE" | "TASK_DUE" | "LEAVE" | "WFH";
  startDate: string;
  endDate: string;
  isGlobal?: boolean;
  meta?: Record<string, any>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function safeJson(res: Response) {
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return {};
    }
  }
  return {};
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionLoading } = useSession();
  const { toast } = useToast();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Filter Toggles
  const [filterHolidays, setFilterHolidays] = useState(true);
  const [filterCompanyEvents, setFilterCompanyEvents] = useState(true);
  const [filterProjects, setFilterProjects] = useState(true);
  const [filterTasks, setFilterTasks] = useState(true);
  const [filterLeaves, setFilterLeaves] = useState(true);

  // Create Event Modal States
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState<string>("COMPANY_EVENT");
  const [eventStart, setEventStart] = useState(new Date().toISOString().slice(0, 10));
  const [eventEnd, setEventEnd] = useState(new Date().toISOString().slice(0, 10));
  const [eventDesc, setEventDesc] = useState("");
  const [isGlobalEvent, setIsGlobalEvent] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !sessionData) {
      router.push("/login");
    }
  }, [sessionData, sessionLoading, router]);

  useEffect(() => {
    if (sessionData) {
      fetchEvents();
    }
  }, [sessionData]);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/calendar/events`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error("Fetch calendar events error:", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventStart || !eventEnd) {
      toast.error("Please provide title and valid dates.");
      return;
    }

    setCreatingEvent(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/calendar/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventTitle.trim(),
          type: eventType,
          startDate: eventStart,
          endDate: eventEnd,
          description: eventDesc.trim() || undefined,
          isGlobal: isGlobalEvent
        }),
        credentials: "include"
      });
      const data = await safeJson(res);
      if (res.ok) {
        toast.success("Calendar event scheduled successfully!");
        setShowAddEventModal(false);
        setEventTitle("");
        setEventDesc("");
        setIsGlobalEvent(false);
        fetchEvents();
      } else {
        toast.error(data.error || "Failed to schedule event.");
      }
    } catch (err) {
      console.error("Create event error:", err);
      toast.error("Internal server error.");
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/calendar/events/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        toast.success("Event removed from calendar.");
        fetchEvents();
      } else {
        const data = await safeJson(res);
        toast.error(data.error || "Failed to delete event.");
      }
    } catch (err) {
      toast.error("Internal server error.");
    }
  };

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Calendar Grid Calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Next month padding to fill 35 or 42 grid cells
    const remaining = 35 - days.length;
    if (remaining > 0) {
      for (let i = 1; i <= remaining; i++) {
        days.push({
          date: new Date(year, month + 1, i),
          isCurrentMonth: false
        });
      }
    } else if (days.length > 35) {
      const extraRemaining = 42 - days.length;
      for (let i = 1; i <= extraRemaining; i++) {
        days.push({
          date: new Date(year, month + 1, i),
          isCurrentMonth: false
        });
      }
    }

    return days;
  }, [year, month]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (e.type === "HOLIDAY" && !filterHolidays) return false;
      if (e.type === "COMPANY_EVENT" && !filterCompanyEvents) return false;
      if (e.type === "PROJECT_DEADLINE" && !filterProjects) return false;
      if (e.type === "TASK_DUE" && !filterTasks) return false;
      if ((e.type === "LEAVE" || e.type === "WFH") && !filterLeaves) return false;
      return true;
    });
  }, [events, filterHolidays, filterCompanyEvents, filterProjects, filterTasks, filterLeaves]);

  // Get events on a specific date
  const getEventsForDate = (date: Date) => {
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

    return filteredEvents.filter(e => {
      const s = new Date(e.startDate);
      const eDate = new Date(e.endDate);
      const start = new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime();
      const end = new Date(eDate.getFullYear(), eDate.getMonth(), eDate.getDate()).getTime();

      return target >= start && target <= end;
    });
  };

  const isToday = (date: Date) => {
    const now = new Date();
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  };

  const isSameSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const getEventBadgeStyling = (type: string) => {
    switch (type) {
      case "HOLIDAY":
        return "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20";
      case "COMPANY_EVENT":
        return "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/20";
      case "PROJECT_DEADLINE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20";
      case "TASK_DUE":
        return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20";
      case "LEAVE":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20";
      case "WFH":
        return "bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-400 border border-teal-500/20";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-700/30";
    }
  };

  const selectedDayEvents = getEventsForDate(selectedDate);
  const isHr = sessionData?.user?.role === "HR";

  if (sessionLoading || !sessionData) return null;

  return (
    <div className="flex-grow flex flex-col space-y-6 font-sans text-slate-900 dark:text-white transition-colors duration-150 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Corporate Calendar</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-extrabold uppercase px-2.5 py-0.5 rounded-full">
              Personalized
            </span>
          </h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
            Unified schedule aggregating project deadlines, Kanban task due dates, corporate holidays & approved leaves
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddEventModal(true)}
            className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>{isHr ? "Schedule Event / Holiday" : "Schedule Meeting"}</span>
          </button>
        </div>
      </div>

      {/* Filter Category Chips */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-zinc-950 p-3 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">
          Event Filters:
        </span>

        <button
          onClick={() => setFilterHolidays(!filterHolidays)}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterHolidays ? "bg-rose-500 text-white shadow-xs" : "bg-slate-100 text-slate-400 dark:bg-zinc-900"
          }`}
        >
          <Flag className="h-3 w-3" />
          <span>Holidays</span>
        </button>

        <button
          onClick={() => setFilterCompanyEvents(!filterCompanyEvents)}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterCompanyEvents ? "bg-purple-600 text-white shadow-xs" : "bg-slate-100 text-slate-400 dark:bg-zinc-900"
          }`}
        >
          <Sparkles className="h-3 w-3" />
          <span>Events</span>
        </button>

        <button
          onClick={() => setFilterProjects(!filterProjects)}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterProjects ? "bg-blue-600 text-white shadow-xs" : "bg-slate-100 text-slate-400 dark:bg-zinc-900"
          }`}
        >
          <Briefcase className="h-3 w-3" />
          <span>Project Deadlines</span>
        </button>

        <button
          onClick={() => setFilterTasks(!filterTasks)}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterTasks ? "bg-amber-600 text-white shadow-xs" : "bg-slate-100 text-slate-400 dark:bg-zinc-900"
          }`}
        >
          <CheckSquare className="h-3 w-3" />
          <span>Kanban Tasks</span>
        </button>

        <button
          onClick={() => setFilterLeaves(!filterLeaves)}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterLeaves ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-100 text-slate-400 dark:bg-zinc-900"
          }`}
        >
          <Plane className="h-3 w-3" />
          <span>Leaves & WFH</span>
        </button>
      </div>

      {/* Main Calendar View: Grid & Selected Day Agenda */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Calendar Month Grid (3 Columns) */}
        <div className="xl:col-span-3 bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl p-6 shadow-xs space-y-4">
          
          {/* Navigation Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100 dark:border-zinc-900">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h2>
              <button
                onClick={handleToday}
                className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 text-center text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 py-1">
            {DAYS_OF_WEEK.map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* 7-Column Day Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarDays.map((item, idx) => {
              const dayEvents = getEventsForDate(item.date);
              const isCurrentDay = isToday(item.date);
              const isSelected = isSameSelected(item.date);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(item.date)}
                  className={`min-h-[105px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between text-left ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 ring-2 ring-indigo-600/30"
                      : isCurrentDay
                      ? "border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/10"
                      : item.isCurrentMonth
                      ? "bg-slate-50/40 dark:bg-zinc-900/30 border-slate-100 dark:border-zinc-850 hover:bg-slate-100/60 dark:hover:bg-zinc-900/60"
                      : "bg-transparent border-transparent opacity-30"
                  }`}
                >
                  {/* Date Number Header */}
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-black rounded-full w-6 h-6 flex items-center justify-center ${
                      isCurrentDay
                        ? "bg-emerald-600 text-white font-extrabold shadow-xs"
                        : isSelected
                        ? "bg-indigo-600 text-white font-extrabold"
                        : item.isCurrentMonth
                        ? "text-slate-800 dark:text-zinc-200"
                        : "text-slate-400 dark:text-zinc-600"
                    }`}>
                      {item.date.getDate()}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[9px] font-black text-slate-400">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event Badges in Cell */}
                  <div className="space-y-1 my-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev, evIdx) => (
                      <div
                        key={evIdx}
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md truncate leading-tight ${getEventBadgeStyling(ev.type)}`}
                        title={`${ev.title} (${ev.type})`}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[8px] font-bold text-slate-400 pl-1">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Selected Day Agenda Focus (1 Column) */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 dark:border-zinc-900 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Agenda Focus
                </h3>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
              <CalendarIcon className="h-5 w-5 text-indigo-500" />
            </div>

            {/* List of Events on Selected Day */}
            {selectedDayEvents.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {selectedDayEvents.map(ev => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-2xl border border-slate-100 dark:border-zinc-900 bg-slate-50/60 dark:bg-zinc-900/40 space-y-2 text-left"
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${getEventBadgeStyling(ev.type)}`}>
                        {ev.type.replace("_", " ")}
                      </span>
                      {ev.isGlobal && (
                        <span className="text-[9px] font-extrabold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          Global
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {ev.title}
                      </h4>
                      {ev.description && (
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                          {ev.description}
                        </p>
                      )}
                    </div>

                    {/* Metadata details */}
                    <div className="text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-100 dark:border-zinc-850 flex justify-between items-center">
                      <span>
                        {new Date(ev.startDate).toLocaleDateString()}
                      </span>
                      {/* Delete button if custom event */}
                      {!ev.id.startsWith("proj-") && !ev.id.startsWith("task-") && !ev.id.startsWith("leave-") && (
                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer p-1 rounded"
                          title="Delete Event"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 dark:border-zinc-900 rounded-2xl text-xs">
                No events or deadlines scheduled on this date.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* MODAL: SCHEDULE CALENDAR EVENT / HOLIDAY                 */}
      {/* ======================================================== */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl shadow-xl max-w-md w-full p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {isHr ? "Schedule Corporate Event / Holiday" : "Schedule Meeting / Note"}
                </h3>
              </div>
              <button
                onClick={() => setShowAddEventModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Independence Day, Annual Hackathon, or Client Sprint Review"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Event Category
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                >
                  <option value="COMPANY_EVENT">Company Event / Gathering</option>
                  {isHr && <option value="HOLIDAY">Public / Corporate Holiday</option>}
                  <option value="MEETING">Internal Team Meeting</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  />
                </div>
              </div>

              {isHr && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="globalCheck"
                    checked={isGlobalEvent}
                    onChange={(e) => setIsGlobalEvent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                  />
                  <label htmlFor="globalCheck" className="text-xs text-slate-700 dark:text-zinc-300 font-medium cursor-pointer">
                    <span className="font-extrabold text-slate-950 dark:text-white block">Publish Company-Wide</span>
                    <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
                      Broadcasts this event to all employee calendars across the company.
                    </span>
                  </label>
                </div>
              )}

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Event Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Meeting agenda, holiday details, or location..."
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingEvent}
                  className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  {creatingEvent ? "Scheduling..." : "Save Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
