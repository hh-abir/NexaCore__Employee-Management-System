"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { 
  TrendingUp, 
  ArrowRight,
  ChevronDown,
  Calendar,
  Briefcase,
  Layers,
  Users,
  X
} from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    name: string;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function DashboardPage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionLoading } = useSession();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");

  const [clockedIn, setClockedIn] = useState(false);
  const [clockedOut, setClockedOut] = useState(false);
  const [attendanceRecord, setAttendanceRecord] = useState<any>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  
  useEffect(() => {
    if (!sessionLoading && !sessionData) {
      router.push("/login");
    }
  }, [sessionData, sessionLoading, router]);

  useEffect(() => {
    if (sessionData) {
      fetchAnnouncements();
      fetchAttendanceStatus();
    }
  }, [sessionData]);

  const fetchAnnouncements = async () => {
    setLoadingAnnouncements(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/announcements`, {
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        setAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: annTitle, content: annContent }),
        credentials: "include"
      });
      if (res.ok) {
        setAnnTitle("");
        setAnnContent("");
        setShowAddAnnouncement(false);
        fetchAnnouncements();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to post announcement.");
      }
    } catch (err) {
      console.error("Error posting announcement:", err);
    }
  };

  const fetchAttendanceStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/attendance/status`, {
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        setClockedIn(data.clockedIn);
        setClockedOut(data.clockedOut);
        setAttendanceRecord(data.record);
      }
    } catch (err) {
      console.error("Failed to fetch attendance status:", err);
    }
  };

  const getCoordinates = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      }
    });
  };

  const handleClockIn = async () => {
    setLoadingAttendance(true);
    try {
      const pos = await getCoordinates();
      const { latitude, longitude } = pos.coords;

      const res = await fetch(`${API_BASE_URL}/api/attendance/clock-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude }),
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        alert("Clock In Successful!");
        fetchAttendanceStatus();
      } else {
        alert(data.error || "Failed to clock in.");
      }
    } catch (err: any) {
      console.error("Clock In Error:", err);
      alert(err.message || "Could not retrieve GPS coordinates. Please enable location permissions.");
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleClockOut = async () => {
    setLoadingAttendance(true);
    try {
      const pos = await getCoordinates();
      const { latitude, longitude } = pos.coords;

      const res = await fetch(`${API_BASE_URL}/api/attendance/clock-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude }),
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        alert("Clock Out Successful!");
        fetchAttendanceStatus();
      } else {
        alert(data.error || "Failed to clock out.");
      }
    } catch (err: any) {
      console.error("Clock Out Error:", err);
      alert(err.message || "Could not retrieve GPS coordinates. Please enable location permissions.");
    } finally {
      setLoadingAttendance(false);
    }
  };

  if (sessionLoading || !sessionData) return null;

  return (
    <div className="flex-grow flex flex-col space-y-6 font-sans text-slate-900 dark:text-white transition-colors duration-150">
      
      {}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-left">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
            Unified workspace manager
          </p>
        </div>
      </div>

      {}
      {}
      {}
      <div className="space-y-6">
        {}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-950 rounded-2xl p-6 border-none shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="space-y-4 text-left">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                  Dashboard Overview
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  Analytics Dashboard
                </h2>
              </div>

              <div className="flex items-center gap-8 pt-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Earnings</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold">$14,248.00</span>
                    <span className="inline-flex items-center text-[9px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                      +3.3%
                    </span>
                  </div>
                </div>

                <div className="w-px h-10 bg-slate-100 dark:bg-zinc-900" />

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Expenses</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold">$4,102.50</span>
                    <span className="inline-flex items-center text-[9px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 px-1.5 py-0.5 rounded-full">
                      -1.5%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {}
            <div className="flex flex-col gap-2.5 w-full sm:w-auto">
              <button 
                onClick={() => router.push("/dashboard/active-projects")}
                className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-2.5 px-5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <span>View Workspace Directory</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              
              {sessionData.user.role === "HR" && (
                <button 
                  onClick={() => router.push("/dashboard/create-project")}
                  className="bg-slate-100 hover:bg-slate-150 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-900 dark:text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
                >
                  <span>Initialize New Workspace</span>
                </button>
              )}
            </div>
          </div>

          {}
          {/* Simple Clock In/Out card */}
          <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border-none shadow-sm flex flex-col justify-between text-left h-[180px]">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                Attendance Tracking
              </span>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
                  Clock Console
                </h3>
                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500">
                  {clockedOut ? (
                    <span className="text-rose-500">Shift Completed</span>
                  ) : clockedIn ? (
                    <span className="text-emerald-500">Active Shift</span>
                  ) : (
                    "Inactive"
                  )}
                </span>
              </div>
              <p className="text-[10px] text-slate-450 dark:text-zinc-400 font-medium">
                {clockedOut ? (
                  `Hours worked today: ${attendanceRecord?.hoursWorked || 0} hrs`
                ) : clockedIn && attendanceRecord ? (
                  `Clocked In at ${new Date(attendanceRecord.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${attendanceRecord.isLate ? " (Late)" : ""}`
                ) : (
                  "Please clock in inside the BRAC University campus."
                )}
              </p>
            </div>
            
            <div className="flex gap-3 mt-4">
              <button 
                onClick={handleClockIn}
                disabled={clockedIn || clockedOut || loadingAttendance}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-450 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-600 text-white font-bold py-2 px-3 rounded-lg text-xs cursor-pointer disabled:cursor-not-allowed shadow-xs transition-colors"
              >
                {loadingAttendance ? "Processing..." : "Clock In"}
              </button>
              <button 
                onClick={handleClockOut}
                disabled={!clockedIn || clockedOut || loadingAttendance}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 disabled:bg-slate-100 disabled:text-slate-450 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-600 text-slate-550 dark:text-zinc-400 font-bold py-2 px-3 rounded-lg text-xs cursor-pointer disabled:cursor-not-allowed transition-colors"
              >
                {loadingAttendance ? "Processing..." : "Clock Out"}
              </button>
            </div>
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {}
          <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border-none shadow-sm text-left flex flex-col justify-between h-[280px]">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-zinc-900">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                  Workspaces
                </h3>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">Overview</span>
              </div>
              <p className="text-xs text-slate-550 dark:text-zinc-400 leading-relaxed font-medium">
                Click on the Workspace Directory button to inspect active projects, view project task boards, and chat with team members inside communication channels.
              </p>
            </div>

            <button 
              onClick={() => router.push("/dashboard/active-projects")}
              className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold py-2 px-4 rounded-lg text-xs cursor-pointer transition-colors text-center"
            >
              Go to Workspace Directory
            </button>
          </div>

          {}
          <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border-none shadow-sm text-left flex flex-col justify-between h-[280px]">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-zinc-900">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                  Analytics
                </h3>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">Monthly</span>
              </div>
              <p className="text-xs text-slate-550 dark:text-zinc-400 leading-relaxed font-medium">
                Financial performance, monthly operations run-rate, and allocated project budgets statistics metrics.
              </p>
            </div>

            {}
            <div className="h-28 bg-slate-50/50 dark:bg-zinc-900/50 rounded-xl p-3 flex items-end justify-between relative overflow-hidden">
              <div className="w-8 bg-zinc-900/10 dark:bg-white/10 h-1/4 rounded-t-sm" />
              <div className="w-8 bg-zinc-900/10 dark:bg-white/10 h-2/5 rounded-t-sm" />
              <div className="w-8 bg-zinc-900/10 dark:bg-white/10 h-1/2 rounded-t-sm" />
              <div className="w-8 bg-zinc-900 dark:bg-white h-full rounded-t-sm" />
              <span className="absolute top-2 right-3 text-[8px] font-extrabold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active Run-rate Peak
              </span>
            </div>
          </div>

          {}
          {/* Notice Board / Announcements */}
          <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border-none shadow-sm text-left flex flex-col justify-between h-[280px]">
            <div className="space-y-4 flex flex-col h-full min-h-0">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-zinc-900 shrink-0">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  Notice Board
                </h3>
                {sessionData.user.role === "HR" && (
                  <button 
                    onClick={() => setShowAddAnnouncement(true)}
                    className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    Post Notice
                  </button>
                )}
              </div>

              <div className="space-y-3 overflow-y-auto flex-grow pr-1 min-h-0">
                {loadingAnnouncements ? (
                  <div className="text-[10px] text-slate-400 font-bold py-4 text-center">Loading notices...</div>
                ) : announcements.length > 0 ? (
                  announcements.map(ann => (
                    <div key={ann.id} className="text-[11px] font-semibold text-slate-550 dark:text-zinc-400 border-l-2 border-indigo-500 pl-2.5 py-1">
                      <p className="text-slate-950 dark:text-white font-bold leading-normal truncate" title={ann.title}>
                        {ann.title}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium leading-relaxed mt-0.5 whitespace-pre-line line-clamp-2">
                        {ann.content}
                      </p>
                      <span className="text-[8px] text-slate-400 dark:text-zinc-500 font-bold block mt-1">
                        By {ann.author.name} &bull; {new Date(ann.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-slate-400 font-bold py-8 text-center">No announcements posted.</div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Post Announcement Dialog Modal */}
      {showAddAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 dark:bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl shadow-xl max-w-md w-full p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-zinc-900">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                Post Company Announcement
              </h3>
              <button
                type="button"
                onClick={() => setShowAddAnnouncement(false)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Notice Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Office Closed on Eid Holiday"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-medium"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Announcement Message</label>
                <textarea 
                  rows={4}
                  placeholder="Type the full message details for company staff..."
                  required
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50 dark:border-zinc-900/60">
                <button
                  type="button"
                  onClick={() => setShowAddAnnouncement(false)}
                  className="bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-bold py-1.5 px-4 rounded-lg text-[10px] cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-1.5 px-4 rounded-lg text-[10px] cursor-pointer shadow-xs transition-colors"
                >
                  Post Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
