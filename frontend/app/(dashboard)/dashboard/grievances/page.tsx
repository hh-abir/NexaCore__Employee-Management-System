"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  EyeOff, 
  MessageSquare, 
  X, 
  FileText, 
  User, 
  Activity,
  ChevronRight,
  ShieldCheck,
  Building
} from "lucide-react";
import { useToast } from "@/components/Toast";

interface GrievanceRecord {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: "HARASSMENT" | "WORKPLACE_SAFETY" | "COMPENSATION" | "MANAGER_CONFLICT" | "DISCRIMINATION" | "ETHICS_VIOLATION" | "OTHER";
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  isAnonymous: boolean;
  status: "OPEN" | "UNDER_INVESTIGATION" | "RESOLVED" | "DISMISSED";
  resolutionNote?: string;
  resolvedAt?: string;
  createdAt: string;
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

const CATEGORY_LABELS: Record<string, string> = {
  HARASSMENT: "Harassment / Misconduct",
  WORKPLACE_SAFETY: "Workplace Safety & Health",
  COMPENSATION: "Compensation & Payroll",
  MANAGER_CONFLICT: "Management & Leadership",
  DISCRIMINATION: "Bias & Discrimination",
  ETHICS_VIOLATION: "Ethics & Compliance",
  OTHER: "General Workplace Issue"
};

export default function GrievancePage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionLoading } = useSession();
  const { toast } = useToast();

  // Employee States
  const [myGrievances, setMyGrievances] = useState<GrievanceRecord[]>([]);
  const [loadingMyGrievances, setLoadingMyGrievances] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  
  // Submit Form States
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("OTHER");
  const [urgency, setUrgency] = useState<string>("MEDIUM");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // HR States
  const [allGrievances, setAllGrievances] = useState<GrievanceRecord[]>([]);
  const [loadingAllGrievances, setLoadingAllGrievances] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "UNDER_INVESTIGATION" | "RESOLVED" | "CRITICAL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // HR Action Modal
  const [selectedTicket, setSelectedTicket] = useState<GrievanceRecord | null>(null);
  const [newStatus, setNewStatus] = useState<string>("OPEN");
  const [resolutionNote, setResolutionNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !sessionData) {
      router.push("/login");
    }
  }, [sessionData, sessionLoading, router]);

  useEffect(() => {
    if (sessionData) {
      fetchMyGrievances();
      if (sessionData.user.role === "HR") {
        fetchAllGrievances();
      }
    }
  }, [sessionData]);

  const fetchMyGrievances = async () => {
    setLoadingMyGrievances(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/grievances/my-grievances`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
        setMyGrievances(data.grievances || []);
      }
    } catch (err) {
      console.error("Fetch personal grievances error:", err);
    } finally {
      setLoadingMyGrievances(false);
    }
  };

  const fetchAllGrievances = async () => {
    setLoadingAllGrievances(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/grievances/all`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
        setAllGrievances(data.grievances || []);
      }
    } catch (err) {
      console.error("Fetch all grievances error:", err);
    } finally {
      setLoadingAllGrievances(false);
    }
  };

  const handleSubmitGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in the incident title and details.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/grievances/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          urgency,
          isAnonymous
        }),
        credentials: "include"
      });
      const data = await safeJson(res);
      if (res.ok) {
        toast.success("Grievance report submitted confidentially to HR.");
        setTitle("");
        setDescription("");
        setCategory("OTHER");
        setUrgency("MEDIUM");
        setIsAnonymous(false);
        setShowSubmitModal(false);
        fetchMyGrievances();
        if (sessionData?.user?.role === "HR") {
          fetchAllGrievances();
        }
      } else {
        toast.error(data.error || "Failed to submit report.");
      }
    } catch (err) {
      console.error("Submit grievance error:", err);
      toast.error("Internal server error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setUpdatingStatus(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/grievances/${selectedTicket.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          resolutionNote
        }),
        credentials: "include"
      });
      const data = await safeJson(res);
      if (res.ok) {
        toast.success(`Case status updated to ${newStatus}.`);
        setSelectedTicket(null);
        setResolutionNote("");
        fetchAllGrievances();
      } else {
        toast.error(data.error || "Failed to update case.");
      }
    } catch (err) {
      console.error("Update status error:", err);
      toast.error("Internal server error.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const isHr = sessionData?.user?.role === "HR";

  // HR Filtered List
  const filteredAllGrievances = useMemo(() => {
    return allGrievances.filter(g => {
      // Status Filter
      if (statusFilter === "OPEN" && g.status !== "OPEN") return false;
      if (statusFilter === "UNDER_INVESTIGATION" && g.status !== "UNDER_INVESTIGATION") return false;
      if (statusFilter === "RESOLVED" && (g.status !== "RESOLVED" && g.status !== "DISMISSED")) return false;
      if (statusFilter === "CRITICAL" && g.urgency !== "CRITICAL") return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const empName = g.user?.name?.toLowerCase() || "";
        const titleMatch = g.title.toLowerCase();
        const descMatch = g.description.toLowerCase();
        const idMatch = g.id.toLowerCase();
        if (!empName.includes(q) && !titleMatch.includes(q) && !descMatch.includes(q) && !idMatch.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [allGrievances, statusFilter, searchQuery]);

  if (sessionLoading || !sessionData) return null;

  // HR Stats
  const openCount = allGrievances.filter(g => g.status === "OPEN").length;
  const investigationCount = allGrievances.filter(g => g.status === "UNDER_INVESTIGATION").length;
  const resolvedCount = allGrievances.filter(g => g.status === "RESOLVED").length;
  const criticalCount = allGrievances.filter(g => g.urgency === "CRITICAL" && g.status !== "RESOLVED" && g.status !== "DISMISSED").length;

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL":
        return "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400 animate-pulse";
      case "HIGH":
        return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400";
      case "MEDIUM":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400";
      case "UNDER_INVESTIGATION":
        return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400";
      case "DISMISSED":
        return "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400";
      default:
        return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400";
    }
  };

  return (
    <div className="flex-grow flex flex-col space-y-6 font-sans text-slate-900 dark:text-white transition-colors duration-150 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>{isHr ? "Confidential Grievance Ledger" : "Workplace Grievance & Support"}</span>
            {isHr && (
              <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                HR Strict Confidentiality
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
            {isHr 
              ? "Confidential employee reports, workplace investigations & HR action resolutions" 
              : "Report workplace concerns, incidents or disputes with optional anonymity guarantee"}
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>File a Grievance</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* HR CONFIDENTIAL KPI OVERVIEW                             */}
      {/* ======================================================== */}
      {isHr && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Open Tickets</span>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{openCount}</span>
              <Clock className="h-6 w-6 text-amber-500 opacity-75" />
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">Awaiting Initial Review</div>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Under Investigation</span>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{investigationCount}</span>
              <Activity className="h-6 w-6 text-blue-500 opacity-75" />
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">Active Inquiry Cases</div>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Resolved Cases</span>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{resolvedCount}</span>
              <CheckCircle2 className="h-6 w-6 text-emerald-500 opacity-75" />
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">Settled & Closed</div>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Critical Urgency</span>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{criticalCount}</span>
              <AlertTriangle className="h-6 w-6 text-rose-500 opacity-75" />
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">Immediate Priority</div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* HR CONFIDENTIAL TICKETS TABLE (With Tabs & Search)       */}
      {/* ======================================================== */}
      {isHr ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs">
            <div className="relative flex items-center w-full sm:w-80 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2">
              <Search className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search ticket, title, employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs outline-none text-zinc-900 dark:text-white w-full font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0">
                <Filter className="h-3.5 w-3.5" />
                Filter:
              </span>
              <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl gap-1 text-[11px] font-bold shrink-0">
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === "ALL" 
                      ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs" 
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  All ({allGrievances.length})
                </button>
                <button
                  onClick={() => setStatusFilter("OPEN")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === "OPEN" 
                      ? "bg-amber-600 text-white shadow-xs" 
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Open ({openCount})
                </button>
                <button
                  onClick={() => setStatusFilter("UNDER_INVESTIGATION")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === "UNDER_INVESTIGATION" 
                      ? "bg-blue-600 text-white shadow-xs" 
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Investigating ({investigationCount})
                </button>
                <button
                  onClick={() => setStatusFilter("RESOLVED")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === "RESOLVED" 
                      ? "bg-emerald-600 text-white shadow-xs" 
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Resolved ({resolvedCount})
                </button>
                <button
                  onClick={() => setStatusFilter("CRITICAL")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === "CRITICAL" 
                      ? "bg-rose-600 text-white shadow-xs" 
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Critical ({criticalCount})
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5 border-b border-slate-50 dark:border-zinc-900 pb-3">
              <ShieldAlert className="h-4 w-4 text-indigo-500" />
              Confidential Incident Reports & Investigations
            </h2>

            {loadingAllGrievances ? (
              <div className="py-8 text-center text-slate-400 text-xs font-bold">Loading incident records...</div>
            ) : filteredAllGrievances.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-medium text-slate-600 dark:text-zinc-400">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-zinc-900 text-[10px] uppercase text-slate-400 dark:text-zinc-500 text-left">
                      <th className="py-3 px-3 font-bold">Complainant</th>
                      <th className="py-3 px-3 font-bold">Incident Title & Category</th>
                      <th className="py-3 px-3 font-bold">Urgency</th>
                      <th className="py-3 px-3 font-bold">Status</th>
                      <th className="py-3 px-3 font-bold">Submitted Date</th>
                      <th className="py-3 px-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-zinc-900/60">
                    {filteredAllGrievances.map(ticket => (
                      <tr key={ticket.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                        <td className="py-3.5 px-3">
                          {ticket.isAnonymous ? (
                            <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                              <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center">
                                <EyeOff className="h-3.5 w-3.5 text-slate-500" />
                              </div>
                              <div>
                                <div className="font-extrabold text-xs text-slate-700 dark:text-zinc-300">Anonymous Reporter</div>
                                <div className="text-[10px] text-slate-400">Identity Shielded</div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                                {ticket.user?.name ? ticket.user.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() : "U"}
                              </div>
                              <div>
                                <div className="text-slate-950 dark:text-white font-extrabold text-xs">{ticket.user?.name || "Employee"}</div>
                                <div className="text-[10px] text-slate-400">{ticket.user?.email}</div>
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-3 max-w-sm">
                          <div className="text-slate-950 dark:text-white font-extrabold text-xs truncate" title={ticket.title}>
                            {ticket.title}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                            {CATEGORY_LABELS[ticket.category] || ticket.category}
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-zinc-400 line-clamp-1 mt-1">
                            "{ticket.description}"
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${getUrgencyBadge(ticket.urgency)}`}>
                            {ticket.urgency}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${getStatusBadge(ticket.status)}`}>
                            {ticket.status.replace("_", " ")}
                          </span>
                          {ticket.resolutionNote && (
                            <div className="text-[10px] text-slate-400 italic mt-1 line-clamp-1">
                              Note: {ticket.resolutionNote}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-slate-500 font-semibold text-[11px]">
                          {new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setNewStatus(ticket.status);
                              setResolutionNote(ticket.resolutionNote || "");
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded-lg text-[10px] cursor-pointer transition-colors"
                          >
                            Manage Case
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 dark:border-zinc-900 rounded-2xl">
                No grievance reports match your criteria.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* EMPLOYEE PERSONAL GRIEVANCES TRACKER                     */
        /* ======================================================== */
        <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5 border-b border-slate-50 dark:border-zinc-900 pb-3">
            <ShieldAlert className="h-4 w-4 text-slate-400" />
            My Submitted Grievance Reports
          </h2>

          {loadingMyGrievances ? (
            <div className="py-8 text-center text-slate-400 text-xs font-bold">Loading your reports...</div>
          ) : myGrievances.length > 0 ? (
            <div className="space-y-4">
              {myGrievances.map(ticket => (
                <div 
                  key={ticket.id}
                  className="p-5 rounded-2xl border border-slate-100 dark:border-zinc-900 bg-slate-50/40 dark:bg-zinc-900/30 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">#{ticket.id.slice(-6).toUpperCase()}</span>
                        <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">{ticket.title}</h3>
                        {ticket.isAnonymous && (
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-md flex items-center gap-1">
                            <EyeOff className="h-2.5 w-2.5" />
                            Anonymous
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-2">
                        <span>Category: {CATEGORY_LABELS[ticket.category] || ticket.category}</span>
                        <span>&bull;</span>
                        <span>Filed: {new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${getUrgencyBadge(ticket.urgency)}`}>
                        {ticket.urgency} Urgency
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${getStatusBadge(ticket.status)}`}>
                        {ticket.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-zinc-300 font-medium leading-relaxed bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-850">
                    {ticket.description}
                  </p>

                  {ticket.resolutionNote && (
                    <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                      <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest block flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        HR Resolution & Findings
                      </span>
                      <p className="text-xs text-slate-800 dark:text-zinc-200 font-medium">
                        "{ticket.resolutionNote}"
                      </p>
                      {ticket.resolvedAt && (
                        <div className="text-[10px] text-slate-400 pt-1">
                          Resolved on {new Date(ticket.resolvedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 dark:border-zinc-900 rounded-2xl">
              You haven't filed any workplace grievances or incident reports.
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SUBMIT GRIEVANCE                                  */}
      {/* ======================================================== */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl shadow-xl max-w-lg w-full p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-500" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  File Confidential Grievance
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitGrievance} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Incident Title / Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unfair overtime distribution or workplace conduct issue"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  >
                    <option value="HARASSMENT">Harassment / Misconduct</option>
                    <option value="WORKPLACE_SAFETY">Workplace Safety & Health</option>
                    <option value="COMPENSATION">Compensation & Payroll</option>
                    <option value="MANAGER_CONFLICT">Management & Leadership</option>
                    <option value="DISCRIMINATION">Bias & Discrimination</option>
                    <option value="ETHICS_VIOLATION">Ethics & Compliance</option>
                    <option value="OTHER">General Issue</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    Severity / Urgency
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  >
                    <option value="LOW">Low - Routine Concern</option>
                    <option value="MEDIUM">Medium - Needs Attention</option>
                    <option value="HIGH">High - Significant Impact</option>
                    <option value="CRITICAL">Critical - Urgent Intervention</option>
                  </select>
                </div>
              </div>

              {/* Anonymity Shield Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="anonymousCheck"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                />
                <label htmlFor="anonymousCheck" className="text-xs text-slate-700 dark:text-zinc-300 font-medium cursor-pointer">
                  <span className="font-extrabold text-slate-950 dark:text-white block">Submit as Anonymous Complaint</span>
                  <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
                    Your name and email will not be disclosed on this ticket. HR will review the details strictly anonymously.
                  </span>
                </label>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Detailed Statement / Description
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide an objective description of the incident, dates, people involved, and any actions taken..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50 dark:border-zinc-900/60">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
                >
                  {submitting ? "Submitting..." : "Submit Confidential Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: HR MANAGE CASE & RESOLUTION                      */}
      {/* ======================================================== */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl shadow-xl max-w-lg w-full p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Case Management: #{selectedTicket.id.slice(-6).toUpperCase()}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Case Details Box */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-xl space-y-2 text-xs">
              <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                {selectedTicket.title}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                Category: {CATEGORY_LABELS[selectedTicket.category] || selectedTicket.category} &bull; Urgency: {selectedTicket.urgency}
              </div>
              <p className="text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 p-3 rounded-lg border border-slate-100 dark:border-zinc-800">
                "{selectedTicket.description}"
              </p>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Investigation & Resolution Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                >
                  <option value="OPEN">OPEN - Review Pending</option>
                  <option value="UNDER_INVESTIGATION">UNDER INVESTIGATION - Active Inquiry</option>
                  <option value="RESOLVED">RESOLVED - Settlement & Action Complete</option>
                  <option value="DISMISSED">DISMISSED - No Policy Violation Found</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  HR Action Plan & Resolution Findings
                </label>
                <textarea
                  rows={4}
                  placeholder="Document resolution findings, remedial actions taken, or counseling provided..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50 dark:border-zinc-900/60">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
                >
                  {updatingStatus ? "Saving..." : "Save Findings & Update Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
