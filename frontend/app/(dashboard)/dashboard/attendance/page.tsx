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
  ShieldCheck,
  Plus,
  Download,
  Trash2,
  RotateCw,
  X
} from "lucide-react";
import { useToast } from "@/components/Toast";

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

interface EmployeeOption {
  id: string;
  name: string;
  email: string;
  role: string;
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
  const { toast } = useToast();

  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [allEmployees, setAllEmployees] = useState<EmployeeOption[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [punctualityFilter, setPunctualityFilter] = useState<"ALL" | "ON_TIME" | "LATE">("ALL");

  // HR Manual Entry Modal States
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [manualDate, setManualDate] = useState(new Date().toLocaleDateString("sv-SE"));
  const [manualClockInTime, setManualClockInTime] = useState("09:00");
  const [manualClockOutTime, setManualClockOutTime] = useState("17:00");
  const [manualIsLate, setManualIsLate] = useState(false);
  const [savingManual, setSavingManual] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !sessionData) {
      router.push("/login");
    }
  }, [sessionData, sessionLoading, router]);

  useEffect(() => {
    if (sessionData) {
      fetchAttendanceHistory();
      if (sessionData.user.role === "HR") {
        fetchEmployeesList();
      }
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

  const fetchEmployeesList = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/hr/employees`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
        setAllEmployees(data.employees || []);
        if (data.employees?.length > 0 && !selectedUserId) {
          setSelectedUserId(data.employees[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch employee list:", err);
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

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !manualDate || !manualClockInTime) {
      toast.error("Please select employee, date, and clock-in time.");
      return;
    }

    setSavingManual(true);
    try {
      const clockInIso = new Date(`${manualDate}T${manualClockInTime}:00`).toISOString();
      const clockOutIso = manualClockOutTime 
        ? new Date(`${manualDate}T${manualClockOutTime}:00`).toISOString() 
        : null;

      const res = await fetch(`${API_BASE_URL}/api/attendance/manual-entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          date: manualDate,
          clockIn: clockInIso,
          clockOut: clockOutIso,
          isLate: manualIsLate
        }),
        credentials: "include"
      });

      const data = await safeJson(res);
      if (res.ok) {
        toast.success("Attendance record successfully logged!");
        setShowManualModal(false);
        fetchAttendanceHistory();
      } else {
        toast.error(data.error || "Failed to log attendance.");
      }
    } catch (err) {
      console.error("Manual attendance submit error:", err);
      toast.error("Internal server error.");
    } finally {
      setSavingManual(false);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm("Are you sure you want to delete this attendance log?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/attendance/${recordId}`, {
        method: "DELETE",
        credentials: "include"
      });
      const data = await safeJson(res);
      if (res.ok) {
        toast.success("Attendance record deleted successfully.");
        fetchAttendanceHistory();
      } else {
        toast.error(data.error || "Failed to delete record.");
      }
    } catch (err) {
      console.error("Delete attendance error:", err);
      toast.error("Internal server error.");
    }
  };

  const exportToCSV = () => {
    if (filteredHistory.length === 0) {
      toast.error("No records to export.");
      return;
    }

    const headers = ["Employee Name", "Email", "Role", "Date", "Clock In", "Clock Out", "Hours Worked", "Punctuality"];
    const rows = filteredHistory.map(rec => [
      `"${rec.user?.name || "Staff"}"`,
      `"${rec.user?.email || ""}"`,
      `"${rec.user?.role || ""}"`,
      `"${rec.date}"`,
      `"${new Date(rec.clockIn).toLocaleTimeString()}"`,
      `"${rec.clockOut ? new Date(rec.clockOut).toLocaleTimeString() : "In Progress"}"`,
      rec.hoursWorked?.toFixed(2) || "0.00",
      rec.isLate ? "Late Arrival" : "On Time"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NexaCore_Attendance_${new Date().toLocaleDateString("sv-SE")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Attendance CSV report downloaded!");
  };

  if (sessionLoading || !sessionData) return null;

  // Summaries
  const totalDays = history.length;
  const totalHours = history.reduce((sum, rec) => sum + (rec.hoursWorked || 0), 0);
  const lateCount = history.filter(rec => rec.isLate).length;
  const onTimeCount = totalDays - lateCount;
  const averageHours = totalDays > 0 ? (totalHours / totalDays).toFixed(2) : "0.00";
  const onTimeRate = totalDays > 0 ? Math.round((onTimeCount / totalDays) * 100) : 100;

  return (
    <div className="flex-grow flex flex-col space-y-6 font-sans text-slate-900 dark:text-white transition-colors duration-150 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>{isHr ? "Company Attendance Ledger" : "My Attendance Records"}</span>
            {isHr && (
              <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                HR Workforce Management
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
            {isHr 
              ? "Comprehensive employee check-ins, geofence validations, punctuality metrics & manual override controls"
              : "Detailed personal check-in/out timestamps, daily working hours, and punctuality history"}
          </p>
        </div>

        {/* HR Action Buttons */}
        <div className="flex items-center gap-2">
          {isHr && (
            <>
              <button
                onClick={exportToCSV}
                className="bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-200 dark:border-zinc-800"
                title="Export Attendance to CSV Spreadsheet"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => setShowManualModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>+ Log Attendance (HR Override)</span>
              </button>
            </>
          )}

          <button
            onClick={fetchAttendanceHistory}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
            title="Refresh Attendance Logs"
          >
            <RotateCw className={`h-4 w-4 ${loading ? "animate-spin text-indigo-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
            {isHr ? "Total Workforce Shifts" : "Total Shifts Logged"}
          </span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-extrabold text-slate-950 dark:text-white">{totalDays}</span>
            <FileText className="h-6 w-6 text-slate-400 opacity-75" />
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">{totalHours.toFixed(1)} Lifetime Hours Logged</div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Average Daily Shift</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-extrabold text-slate-950 dark:text-white">{averageHours}h</span>
            <Clock className="h-6 w-6 text-indigo-500 opacity-75" />
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">Standard 8h Workday Target</div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Punctuality Score</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{onTimeRate}%</span>
            <UserCheck className="h-6 w-6 text-emerald-500 opacity-75" />
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">{onTimeCount} On-Time Check-Ins</div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Late Arrivals</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{lateCount}</span>
            <AlertCircle className="h-6 w-6 text-rose-500 opacity-75" />
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">Logged After 9:00 AM</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs">
        <div className="relative flex items-center w-full sm:w-80 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2">
          <Search className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder={isHr ? "Search employee, email, or date..." : "Search by date (YYYY-MM-DD)..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs outline-none text-zinc-900 dark:text-white w-full font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" />
            Filter:
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
        <div className="flex justify-between items-center border-b border-slate-50 dark:border-zinc-900 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-indigo-500" />
            <span>{isHr ? "Company-Wide Attendance Roster" : "My Attendance History"}</span>
          </h2>
          <span className="text-[11px] font-semibold text-slate-400">
            Showing {filteredHistory.length} of {history.length} records
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs font-bold">Loading attendance records...</div>
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
                  {isHr && <th className="py-3 px-3 font-bold text-right">Actions</th>}
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

                    {/* HR Row Action */}
                    {isHr && (
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Delete Attendance Record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
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

      {/* ======================================================== */}
      {/* MODAL: HR MANUAL ATTENDANCE OVERRIDE / ENTRY             */}
      {/* ======================================================== */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Manual Attendance Log</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">HR Executive Override & Shift Entry</p>
                </div>
              </div>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Select Staff Member
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-600 font-bold"
                >
                  {allEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.email}) - {emp.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Shift Date
                </label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-600 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    Clock In Time
                  </label>
                  <input
                    type="time"
                    value={manualClockInTime}
                    onChange={(e) => {
                      setManualClockInTime(e.target.value);
                      const [h] = e.target.value.split(":");
                      if (parseInt(h) >= 9) {
                        setManualIsLate(true);
                      } else {
                        setManualIsLate(false);
                      }
                    }}
                    required
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-600 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    Clock Out Time
                  </label>
                  <input
                    type="time"
                    value={manualClockOutTime}
                    onChange={(e) => setManualClockOutTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-600 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isLateCheck"
                  checked={manualIsLate}
                  onChange={(e) => setManualIsLate(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="isLateCheck" className="text-xs font-bold text-slate-700 dark:text-zinc-300 cursor-pointer">
                  Mark as Late Arrival (After 9:00 AM)
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 font-bold py-2 px-4 rounded-xl text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{savingManual ? "Saving Log..." : "Confirm & Save Shift"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
