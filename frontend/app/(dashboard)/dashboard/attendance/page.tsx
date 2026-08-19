"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { 
  Clock, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  TrendingUp, 
  UserCheck,
  Search,
  Filter,
  Users,
  ShieldCheck
} from "lucide-react";

interface AttendanceRecord {
  id: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  hoursWorked: number;
  isLate: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
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

export default function AttendanceLogsPage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionLoading } = useSession();

  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [punctualityFilter, setPunctualityFilter] = useState<"ALL" | "ON_TIME" | "LATE">("ALL");

  useEffect(() => {
    if (!sessionLoading && !sessionData) {
      router.push("/login");
    }
  }, [sessionData, sessionLoading, router]);

  useEffect(() => {
    if (sessionData) {
      fetchAttendanceHistory();
    }
  }, [sessionData]);

  const fetchAttendanceHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/attendance/history`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Failed to fetch attendance history:", err);
    } finally {
      setLoading(false);
    }
  };

  const isHr = sessionData?.user?.role === "HR";

  // Filtered List
  const filteredHistory = useMemo(() => {
    return history.filter(rec => {
      // Punctuality filter
      if (punctualityFilter === "ON_TIME" && rec.isLate) return false;
      if (punctualityFilter === "LATE" && !rec.isLate) return false;

      // Search query (matches employee name, email, or date)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const empName = rec.user?.name?.toLowerCase() || "";
        const empEmail = rec.user?.email?.toLowerCase() || "";
        const dateStr = rec.date.toLowerCase();
        if (!empName.includes(q) && !empEmail.includes(q) && !dateStr.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [history, searchQuery, punctualityFilter]);

  if (sessionLoading || !sessionData) return null;

  // Summaries
  const totalDays = history.length;
  const totalHours = history.reduce((sum, rec) => sum + (rec.hoursWorked || 0), 0);
  const lateCount = history.filter(rec => rec.isLate).length;
  const onTimeCount = totalDays - lateCount;
  const averageHours = totalDays > 0 ? (totalHours / totalDays).toFixed(2) : "0.00";

  return (
    <div className="flex-grow flex flex-col space-y-6 font-sans text-slate-900 dark:text-white transition-colors duration-150 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>{isHr ? "Company Attendance Logs" : "Attendance Logs"}</span>
            {isHr && (
              <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                Workforce View
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
            {isHr 
              ? "All employee check-ins, geofence validations, punctuality metrics & shift duration logs"
              : "Detailed personal check-in/out timestamps and shift hours record"}
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
            {isHr ? "Total Shifts Recorded" : "Total Shifts Logged"}
          </span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-extrabold text-slate-950 dark:text-white">{totalDays}</span>
            <UserCheck className="h-6 w-6 text-indigo-500 opacity-75" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
            {isHr ? "Total Hours Logged" : "My Hours Worked"}
          </span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-extrabold text-slate-950 dark:text-white">{totalHours.toFixed(2)} hrs</span>
            <Clock className="h-6 w-6 text-emerald-500 opacity-75" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">On-Time Arrivals</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{onTimeCount}</span>
            <CheckCircle className="h-6 w-6 text-emerald-500 opacity-75" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Late Arrivals (&gt;9 AM)</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{lateCount}</span>
            <AlertCircle className="h-6 w-6 text-rose-500 opacity-75" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs">
        <div className="relative flex items-center w-full sm:w-80 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2">
          <Search className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder={isHr ? "Search by employee, email or date..." : "Search by date..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs outline-none text-zinc-900 dark:text-white w-full font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" />
            Punctuality:
          </span>
          <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl gap-1 text-[11px] font-bold">
            <button
              onClick={() => setPunctualityFilter("ALL")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                punctualityFilter === "ALL" 
                  ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs" 
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All ({history.length})
            </button>
            <button
              onClick={() => setPunctualityFilter("ON_TIME")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                punctualityFilter === "ON_TIME" 
                  ? "bg-emerald-600 text-white shadow-xs" 
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              On Time ({onTimeCount})
            </button>
            <button
              onClick={() => setPunctualityFilter("LATE")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                punctualityFilter === "LATE" 
                  ? "bg-rose-600 text-white shadow-xs" 
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Late ({lateCount})
            </button>
          </div>
        </div>
      </div>

      {/* History Log Table */}
      <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5 border-b border-slate-50 dark:border-zinc-900 pb-3">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span>{isHr ? "All Employee Attendance Records" : "My Attendance History"}</span>
        </h2>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs font-bold">Loading history logs...</div>
        ) : filteredHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-medium text-slate-600 dark:text-zinc-400">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-900 text-[10px] uppercase text-slate-400 dark:text-zinc-500 text-left">
                  {isHr && <th className="py-3 px-3 font-bold">Employee</th>}
                  <th className="py-3 px-3 font-bold">Date</th>
                  <th className="py-3 px-3 font-bold">Clock In</th>
                  <th className="py-3 px-3 font-bold">Clock Out</th>
                  <th className="py-3 px-3 font-bold">Hours Worked</th>
                  <th className="py-3 px-3 font-bold">Punctuality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-900/60">
                {filteredHistory.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                    
                    {/* Employee Info for HR */}
                    {isHr && (
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                            {rec.user?.name ? rec.user.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() : "U"}
                          </div>
                          <div>
                            <div className="text-slate-950 dark:text-white font-extrabold text-xs">{rec.user?.name || "Unknown User"}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{rec.user?.email}</div>
                          </div>
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-md">
                            {rec.user?.role}
                          </span>
                        </div>
                      </td>
                    )}

                    <td className="py-3.5 px-3 text-slate-950 dark:text-white font-bold">
                      {new Date(rec.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                    </td>

                    <td className="py-3.5 px-3 text-slate-700 dark:text-zinc-300 font-semibold">
                      {new Date(rec.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3.5 px-3 text-slate-700 dark:text-zinc-300 font-semibold">
                      {rec.clockOut ? (
                        new Date(rec.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          Active Shift
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-slate-700 dark:text-zinc-300 font-bold">
                      {rec.clockOut ? `${rec.hoursWorked.toFixed(2)} hrs` : "-"}
                    </td>

                    <td className="py-3.5 px-3">
                      {rec.isLate ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 px-2.5 py-0.5 rounded-full">
                          <AlertCircle className="h-3 w-3" />
                          Late Arrival
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">
                          <CheckCircle className="h-3 w-3" />
                          On Time
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 dark:border-zinc-900 rounded-2xl">
            {searchQuery || punctualityFilter !== "ALL"
              ? "No attendance records matched your filter criteria."
              : "No attendance records found."}
          </div>
        )}
      </div>

    </div>
  );
}
