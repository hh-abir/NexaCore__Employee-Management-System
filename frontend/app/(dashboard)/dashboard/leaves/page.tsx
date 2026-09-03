"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { 
  FileText, 
  Calendar, 
  Check, 
  X, 
  Plus, 
  Clock, 
  User, 
  MessageSquare,
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Laptop,
  Palmtree,
  Trash2,
  RotateCw
} from "lucide-react";
import { useToast } from "@/components/Toast";

interface LeaveRequest {
  id: string;
  type: "LEAVE" | "WFH";
  startDate: string;
  endDate: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  comment?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  reviewer?: {
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

export default function LeavesPage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionLoading } = useSession();
  const { toast } = useToast();

  // Employee states
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [loadingMyRequests, setLoadingMyRequests] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [reqType, setReqType] = useState<"LEAVE" | "WFH">("LEAVE");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reviewer/PM/HR states
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [loadingAllRequests, setLoadingAllRequests] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED" | "WFH" | "LEAVE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [reviewerComment, setReviewerComment] = useState("");
  const [processingReview, setProcessingReview] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !sessionData) {
      router.push("/login");
    }
  }, [sessionData, sessionLoading, router]);

  useEffect(() => {
    if (sessionData) {
      fetchMyRequests();
      if (sessionData.user.role === "HR" || sessionData.user.role === "PROJECT_MANAGER") {
        fetchAllRequests();
      }
    }
  }, [sessionData]);

  const fetchMyRequests = async () => {
    setLoadingMyRequests(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/leaves/my-requests`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
        setMyRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Fetch personal requests error:", err);
    } finally {
      setLoadingMyRequests(false);
    }
  };

  const fetchAllRequests = async () => {
    setLoadingAllRequests(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/leaves/all`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
        setAllRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Fetch all requests error:", err);
    } finally {
      setLoadingAllRequests(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/leaves/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: reqType, startDate, endDate, reason }),
        credentials: "include"
      });
      const data = await safeJson(res);
      if (res.ok) {
        toast.success("Request submitted successfully!");
        setStartDate("");
        setEndDate("");
        setReason("");
        setShowSubmitForm(false);
        fetchMyRequests();
        if (sessionData?.user?.role === "HR" || sessionData?.user?.role === "PROJECT_MANAGER") {
          fetchAllRequests();
        }
      } else {
        toast.error(data.error || "Failed to submit request.");
      }
    } catch (err) {
      console.error("Submit request error:", err);
      toast.error("Internal server error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewId || !reviewAction) return;

    setProcessingReview(true);
    const endpoint = `${API_BASE_URL}/api/leaves/${reviewId}/${reviewAction.toLowerCase()}`;
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: reviewerComment }),
        credentials: "include"
      });
      const data = await safeJson(res);
      if (res.ok) {
        toast.success(`Request ${reviewAction === "APPROVE" ? "Approved" : "Rejected"} successfully.`);
        setReviewId(null);
        setReviewAction(null);
        setReviewerComment("");
        fetchAllRequests();
      } else {
        toast.error(data.error || "Failed to review request.");
      }
    } catch (err) {
      console.error("Review request error:", err);
      toast.error("Internal server error.");
    } finally {
      setProcessingReview(false);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/leaves/${requestId}`, {
        method: "DELETE",
        credentials: "include"
      });
      const data = await safeJson(res);
      if (res.ok) {
        toast.success("Request cancelled successfully.");
        fetchMyRequests();
        if (sessionData?.user?.role === "HR" || sessionData?.user?.role === "PROJECT_MANAGER") {
          fetchAllRequests();
        }
      } else {
        toast.error(data.error || "Failed to cancel request.");
      }
    } catch (err) {
      console.error("Delete request error:", err);
      toast.error("Internal server error.");
    }
  };

  const isReviewer = sessionData?.user?.role === "HR" || sessionData?.user?.role === "PROJECT_MANAGER";
  const isHr = sessionData?.user?.role === "HR";

  // Filtered Review List
  const filteredAllRequests = useMemo(() => {
    return allRequests.filter(req => {
      // Status / Type filters
      if (statusFilter === "PENDING" && req.status !== "PENDING") return false;
      if (statusFilter === "APPROVED" && req.status !== "APPROVED") return false;
      if (statusFilter === "REJECTED" && req.status !== "REJECTED") return false;
      if (statusFilter === "WFH" && req.type !== "WFH") return false;
      if (statusFilter === "LEAVE" && req.type !== "LEAVE") return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const empName = req.user?.name?.toLowerCase() || "";
        const empEmail = req.user?.email?.toLowerCase() || "";
        const reason = req.reason.toLowerCase();
        if (!empName.includes(q) && !empEmail.includes(q) && !reason.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [allRequests, statusFilter, searchQuery]);

  if (sessionLoading || !sessionData) return null;

  // Review KPI calculations
  const totalCount = allRequests.length;
  const pendingCount = allRequests.filter(r => r.status === "PENDING").length;
  const approvedCount = allRequests.filter(r => r.status === "APPROVED").length;
  const rejectedCount = allRequests.filter(r => r.status === "REJECTED").length;

  return (
    <div className="flex-grow flex flex-col space-y-6 font-sans text-slate-900 dark:text-white transition-colors duration-150 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>{isHr ? "Company Leave & WFH Management" : isReviewer ? "Team Leave & WFH Approvals" : "Leave & WFH Portal"}</span>
            {isReviewer && (
              <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                {isHr ? "HR Full Ledger" : "PM Review"}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
            {isReviewer 
              ? "Review pending applications, inspect approved & rejected history, and manage staff time-off"
              : "Submit time-off or remote work applications and track approval statuses"}
          </p>
        </div>

        <button
          onClick={() => setShowSubmitForm(true)}
          className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Application</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* REVIEWER SUMMARY CARDS (When HR or PM)                   */}
      {/* ======================================================== */}
      {isReviewer && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Pending Decision</span>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{pendingCount}</span>
              <Clock className="h-6 w-6 text-amber-500 opacity-75" />
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">Awaiting Review</div>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Approved History</span>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{approvedCount}</span>
              <CheckCircle2 className="h-6 w-6 text-emerald-500 opacity-75" />
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">Granted Time-off / WFH</div>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Rejected Applications</span>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{rejectedCount}</span>
              <XCircle className="h-6 w-6 text-rose-500 opacity-75" />
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">Declined Requests</div>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Total Submissions</span>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-extrabold text-slate-950 dark:text-white">{totalCount}</span>
              <FileText className="h-6 w-6 text-indigo-500 opacity-75" />
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">Lifetime Requests</div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* REVIEWER ALL COMPANY REQUESTS TABLE (Filters & Search)   */}
      {/* ======================================================== */}
      {isReviewer && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs">
            <div className="relative flex items-center w-full sm:w-80 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2">
              <Search className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search employee, email, reason..."
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
                  All ({allRequests.length})
                </button>
                <button
                  onClick={() => setStatusFilter("PENDING")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === "PENDING" 
                      ? "bg-amber-600 text-white shadow-xs" 
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  onClick={() => setStatusFilter("APPROVED")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === "APPROVED" 
                      ? "bg-emerald-600 text-white shadow-xs" 
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Approved ({approvedCount})
                </button>
                <button
                  onClick={() => setStatusFilter("REJECTED")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === "REJECTED" 
                      ? "bg-rose-600 text-white shadow-xs" 
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Rejected ({rejectedCount})
                </button>
                <button
                  onClick={() => setStatusFilter("WFH")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === "WFH" 
                      ? "bg-indigo-600 text-white shadow-xs" 
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  WFH
                </button>
                <button
                  onClick={() => setStatusFilter("LEAVE")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === "LEAVE" 
                      ? "bg-indigo-600 text-white shadow-xs" 
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Leave
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 dark:border-zinc-900 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-indigo-500" />
                <span>{isHr ? "Company-Wide Leave & Remote Requests" : "Team Leave & Remote Requests"}</span>
              </h2>
              <button
                onClick={() => {
                  fetchAllRequests();
                  fetchMyRequests();
                }}
                disabled={loadingAllRequests}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh Ledger"
              >
                <RotateCw className={`h-3.5 w-3.5 ${loadingAllRequests ? "animate-spin text-indigo-500" : ""}`} />
              </button>
            </div>

            {loadingAllRequests ? (
              <div className="py-8 text-center text-slate-400 text-xs font-bold">Loading leave applications...</div>
            ) : filteredAllRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-medium text-slate-600 dark:text-zinc-400">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-zinc-900 text-[10px] uppercase text-slate-400 dark:text-zinc-500 text-left">
                      <th className="py-3 px-3 font-bold">Employee</th>
                      <th className="py-3 px-3 font-bold">Type</th>
                      <th className="py-3 px-3 font-bold">Date Range</th>
                      <th className="py-3 px-3 font-bold">Reason & Feedback</th>
                      <th className="py-3 px-3 font-bold">Status</th>
                      <th className="py-3 px-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-zinc-900/60">
                    {filteredAllRequests.map(req => {
                      const isPending = req.status === "PENDING";
                      const isApproved = req.status === "APPROVED";
                      const statusClass = isApproved
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : isPending
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 animate-pulse"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400";

                      return (
                        <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                                {req.user?.name ? req.user.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() : "U"}
                              </div>
                              <div>
                                <div className="text-slate-950 dark:text-white font-extrabold text-xs">{req.user?.name || "Employee"}</div>
                                <div className="text-[10px] text-slate-400">{req.user?.email}</div>
                              </div>
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-md ml-1">
                                {req.user?.role}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                              req.type === "WFH" 
                                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400" 
                                : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                            }`}>
                              {req.type === "WFH" ? <Laptop className="h-3 w-3" /> : <Palmtree className="h-3 w-3" />}
                              {req.type === "WFH" ? "Work From Home" : "Leave / Vacation"}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-slate-950 dark:text-white font-semibold">
                            {new Date(req.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            {" → "}
                            {new Date(req.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </td>

                          <td className="py-3.5 px-3 max-w-xs">
                            <div className="text-slate-800 dark:text-zinc-200 font-medium truncate" title={req.reason}>
                              "{req.reason}"
                            </div>
                            {req.comment && (
                              <div className="text-[10px] text-slate-400 italic mt-0.5">
                                Review Note: {req.comment}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-3">
                            <span className={`inline-flex items-center text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${statusClass}`}>
                              {req.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            {isPending ? (
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setReviewId(req.id);
                                    setReviewAction("APPROVE");
                                    setReviewerComment("");
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2.5 rounded-lg text-[10px] cursor-pointer transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setReviewId(req.id);
                                    setReviewAction("REJECT");
                                    setReviewerComment("");
                                  }}
                                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-1 px-2.5 rounded-lg text-[10px] cursor-pointer transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400 font-semibold">
                                Reviewed: {new Date(req.createdAt).toLocaleDateString()}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 dark:border-zinc-900 rounded-2xl">
                No leave applications matched your filter criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EMPLOYEE PERSONAL REQUESTS VIEW                          */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5 border-b border-slate-50 dark:border-zinc-900 pb-3">
          <FileText className="h-4 w-4 text-slate-400" />
          My Personal Leave & WFH History
        </h2>

          {loadingMyRequests ? (
            <div className="py-8 text-center text-slate-400 text-xs font-bold">Loading your applications...</div>
          ) : myRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-medium text-slate-600 dark:text-zinc-400">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-900 text-[10px] uppercase text-slate-400 dark:text-zinc-500 text-left">
                    <th className="py-3 px-3 font-bold">Type</th>
                    <th className="py-3 px-3 font-bold">Dates</th>
                    <th className="py-3 px-3 font-bold">Reason</th>
                    <th className="py-3 px-3 font-bold">Status</th>
                    <th className="py-3 px-3 font-bold">Reviewer Note</th>
                    <th className="py-3 px-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-zinc-900/60">
                  {myRequests.map(req => {
                    const isPending = req.status === "PENDING";
                    const isApproved = req.status === "APPROVED";
                    const statusClass = isApproved
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : isPending
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400";

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                            req.type === "WFH" 
                              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400" 
                              : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                          }`}>
                            {req.type === "WFH" ? <Laptop className="h-3 w-3" /> : <Palmtree className="h-3 w-3" />}
                            {req.type}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-slate-950 dark:text-white font-semibold">
                          {new Date(req.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {" → "}
                          {new Date(req.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>

                        <td className="py-3.5 px-3 text-slate-600 dark:text-zinc-400 max-w-xs truncate">
                          "{req.reason}"
                        </td>

                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${statusClass}`}>
                            {req.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-slate-500 italic text-[11px]">
                          {req.comment ? `"${req.comment}"` : "-"}
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          {isPending && (
                            <button
                              onClick={() => handleDeleteRequest(req.id)}
                              className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Cancel Request"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 dark:border-zinc-900 rounded-2xl">
              You haven't submitted any leave or WFH requests yet.
            </div>
          )}
        </div>

      {/* ======================================================== */}
      {/* MODAL: SUBMIT LEAVE / WFH APPLICATION                    */}
      {/* ======================================================== */}
      {showSubmitForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl shadow-xl max-w-md w-full p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-zinc-900">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-500" />
                Submit Application
              </h3>
              <button
                type="button"
                onClick={() => setShowSubmitForm(false)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Request Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReqType("LEAVE")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      reqType === "LEAVE"
                        ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400"
                        : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50"
                    }`}
                  >
                    <Palmtree className="h-3.5 w-3.5" />
                    Leave / Day-Off
                  </button>
                  <button
                    type="button"
                    onClick={() => setReqType("WFH")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      reqType === "WFH"
                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                        : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50"
                    }`}
                  >
                    <Laptop className="h-3.5 w-3.5" />
                    Work From Home
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Reason / Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the reason for your time-off or remote work..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50 dark:border-zinc-900/60">
                <button
                  type="button"
                  onClick={() => setShowSubmitForm(false)}
                  className="bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REVIEW APPLICATION                                */}
      {/* ======================================================== */}
      {reviewId && reviewAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl shadow-xl max-w-md w-full p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-zinc-900">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {reviewAction === "APPROVE" ? "Approve Application" : "Reject Application"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setReviewId(null);
                  setReviewAction(null);
                }}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleReviewRequest} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Reviewer Feedback / Note (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional comment sent directly to employee..."
                  value={reviewerComment}
                  onChange={(e) => setReviewerComment(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50 dark:border-zinc-900/60">
                <button
                  type="button"
                  onClick={() => {
                    setReviewId(null);
                    setReviewAction(null);
                  }}
                  className="bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingReview}
                  className={`font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer shadow-xs transition-colors text-white ${
                    reviewAction === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {processingReview ? "Processing..." : `Confirm ${reviewAction === "APPROVE" ? "Approval" : "Rejection"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
