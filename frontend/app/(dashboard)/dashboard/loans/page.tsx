"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { 
  Wallet, 
  Plus, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  X,
  DollarSign,
  TrendingDown,
  Percent,
  Search,
  Filter,
  Users,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/components/Toast";

interface LoanRecord {
  id: string;
  amount: number;
  installments: number;
  installmentsPaid: number;
  monthlyRepayment: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE" | "REPAID";
  comment?: string;
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

export default function LoansPage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionLoading } = useSession();
  const { toast } = useToast();

  // Employee States
  const [myLoans, setMyLoans] = useState<LoanRecord[]>([]);
  const [loadingMyLoans, setLoadingMyLoans] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [installmentsInput, setInstallmentsInput] = useState("12");
  const [reasonInput, setReasonInput] = useState("");
  const [submittingLoan, setSubmittingLoan] = useState(false);

  // HR States
  const [allCompanyLoans, setAllCompanyLoans] = useState<LoanRecord[]>([]);
  const [loadingAllLoans, setLoadingAllLoans] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Review Modal States
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
      fetchMyLoans();
      if (sessionData.user.role === "HR") {
        fetchAllCompanyLoans();
      }
    }
  }, [sessionData]);

  const fetchMyLoans = async () => {
    setLoadingMyLoans(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/loans/my-loans`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
        setMyLoans(data.loans || []);
      }
    } catch (err) {
      console.error("Failed to fetch personal loans:", err);
    } finally {
      setLoadingMyLoans(false);
    }
  };

  const fetchAllCompanyLoans = async () => {
    setLoadingAllLoans(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/loans/all`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
        setAllCompanyLoans(data.loans || []);
      }
    } catch (err) {
      console.error("Failed to fetch all company loans:", err);
    } finally {
      setLoadingAllLoans(false);
    }
  };

  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountInput || !installmentsInput || !reasonInput.trim()) {
      toast.error("Please fill in all loan application fields.");
      return;
    }

    setSubmittingLoan(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/loans/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountInput,
          installments: installmentsInput,
          reason: reasonInput
        }),
        credentials: "include"
      });
      const data = await safeJson(res);
      if (res.ok) {
        toast.success("Loan application submitted successfully!");
        setAmountInput("");
        setInstallmentsInput("12");
        setReasonInput("");
        setShowApplyModal(false);
        fetchMyLoans();
        if (sessionData?.user?.role === "HR") {
          fetchAllCompanyLoans();
        }
      } else {
        toast.error(data.error || "Failed to submit loan application.");
      }
    } catch (err) {
      console.error("Submit loan error:", err);
      toast.error("Internal server error.");
    } finally {
      setSubmittingLoan(false);
    }
  };

  const handleReviewLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewId || !reviewAction) return;

    setProcessingReview(true);
    const actionPath = reviewAction === "APPROVE" ? "approve" : "reject";
    try {
      const res = await fetch(`${API_BASE_URL}/api/loans/${reviewId}/${actionPath}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: reviewerComment }),
        credentials: "include"
      });
      const data = await safeJson(res);
      if (res.ok) {
        toast.success(`Loan application ${reviewAction === "APPROVE" ? "Approved" : "Rejected"} successfully.`);
        setReviewId(null);
        setReviewAction(null);
        setReviewerComment("");
        fetchAllCompanyLoans();
      } else {
        toast.error(data.error || "Failed to review loan.");
      }
    } catch (err) {
      console.error("Review loan error:", err);
      toast.error("Internal server error.");
    } finally {
      setProcessingReview(false);
    }
  };

  const isHr = sessionData?.user?.role === "HR";

  // HR Filtered Loans
  const filteredCompanyLoans = useMemo(() => {
    return allCompanyLoans.filter(loan => {
      // Status filter
      if (statusFilter === "PENDING" && loan.status !== "PENDING") return false;
      if (statusFilter === "APPROVED" && (loan.status !== "APPROVED" && loan.status !== "ACTIVE" && loan.status !== "REPAID")) return false;
      if (statusFilter === "REJECTED" && loan.status !== "REJECTED") return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const empName = loan.user?.name?.toLowerCase() || "";
        const empEmail = loan.user?.email?.toLowerCase() || "";
        const reason = loan.reason.toLowerCase();
        if (!empName.includes(q) && !empEmail.includes(q) && !reason.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [allCompanyLoans, statusFilter, searchQuery]);

  if (sessionLoading || !sessionData) return null;

  // HR Metrics Calculations
  const totalCompanyLoanAmount = allCompanyLoans.reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalApprovedAmount = allCompanyLoans
    .filter(l => l.status === "APPROVED" || l.status === "ACTIVE" || l.status === "REPAID")
    .reduce((sum, l) => sum + (l.amount || 0), 0);
  const pendingCount = allCompanyLoans.filter(l => l.status === "PENDING").length;
  const approvedCount = allCompanyLoans.filter(l => l.status === "APPROVED" || l.status === "ACTIVE" || l.status === "REPAID").length;
  const rejectedCount = allCompanyLoans.filter(l => l.status === "REJECTED").length;

  return (
    <div className="flex-grow flex flex-col space-y-6 font-sans text-slate-900 dark:text-white transition-colors duration-150 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>{isHr ? "Company Loan Management" : "Loan Application & Tracker"}</span>
            {isHr && (
              <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                HR Finance Control
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
            {isHr 
              ? "Review staff advance requests, monitor active installments & manage approved and rejected loans" 
              : "Apply for company advance loans and track monthly repayment installments"}
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Apply for Loan</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* HR OVERVIEW STATS (When user is HR)                      */}
      {/* ======================================================== */}
      {isHr && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Total Disbursed / Active</span>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">${totalApprovedAmount.toLocaleString()}</span>
              <DollarSign className="h-6 w-6 text-emerald-500 opacity-75" />
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">{approvedCount} Approved Loans</div>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Pending Review</span>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{pendingCount}</span>
              <Clock className="h-6 w-6 text-amber-500 opacity-75" />
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">Requires HR Decision</div>
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
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Total Loan Volume</span>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-extrabold text-slate-950 dark:text-white">${totalCompanyLoanAmount.toLocaleString()}</span>
              <Wallet className="h-6 w-6 text-indigo-500 opacity-75" />
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">{allCompanyLoans.length} Lifetime Submissions</div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* HR ALL COMPANY LOANS TABLE (With Filter Tabs & Search)   */}
      {/* ======================================================== */}
      {isHr ? (
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

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" />
                Status:
              </span>
              <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl gap-1 text-[11px] font-bold">
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === "ALL" 
                      ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs" 
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  All ({allCompanyLoans.length})
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
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5 border-b border-slate-50 dark:border-zinc-900 pb-3">
              <Wallet className="h-4 w-4 text-indigo-500" />
              Company Loan Records & Applications
            </h2>

            {loadingAllLoans ? (
              <div className="py-8 text-center text-slate-400 text-xs font-bold">Loading loan applications...</div>
            ) : filteredCompanyLoans.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-medium text-slate-600 dark:text-zinc-400">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-zinc-900 text-[10px] uppercase text-slate-400 dark:text-zinc-500 text-left">
                      <th className="py-3 px-3 font-bold">Employee</th>
                      <th className="py-3 px-3 font-bold">Amount</th>
                      <th className="py-3 px-3 font-bold">Monthly Obligation</th>
                      <th className="py-3 px-3 font-bold">Tenure (Months)</th>
                      <th className="py-3 px-3 font-bold">Reason & Feedback</th>
                      <th className="py-3 px-3 font-bold">Status</th>
                      <th className="py-3 px-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-zinc-900/60">
                    {filteredCompanyLoans.map(loan => {
                      const isPending = loan.status === "PENDING";
                      const isApproved = loan.status === "APPROVED" || loan.status === "ACTIVE" || loan.status === "REPAID";
                      const statusClass = isApproved
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : isPending
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 animate-pulse"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400";

                      return (
                        <tr key={loan.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                                {loan.user?.name ? loan.user.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() : "U"}
                              </div>
                              <div>
                                <div className="text-slate-950 dark:text-white font-extrabold text-xs">{loan.user?.name || "Employee"}</div>
                                <div className="text-[10px] text-slate-400">{loan.user?.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-slate-950 dark:text-white font-bold text-sm">
                            ${loan.amount.toFixed(2)}
                          </td>

                          <td className="py-3.5 px-3 text-slate-700 dark:text-zinc-300 font-semibold">
                            ${loan.monthlyRepayment.toFixed(2)}/mo
                          </td>

                          <td className="py-3.5 px-3 text-slate-700 dark:text-zinc-300">
                            {loan.installments} Months
                          </td>

                          <td className="py-3.5 px-3 max-w-xs">
                            <div className="text-slate-800 dark:text-zinc-200 font-medium truncate" title={loan.reason}>
                              "{loan.reason}"
                            </div>
                            {loan.comment && (
                              <div className="text-[10px] text-slate-400 italic mt-0.5">
                                HR Note: {loan.comment}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-3">
                            <span className={`inline-flex items-center text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${statusClass}`}>
                              {loan.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            {isPending ? (
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setReviewId(loan.id);
                                    setReviewAction("APPROVE");
                                    setReviewerComment("");
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2.5 rounded-lg text-[10px] cursor-pointer transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setReviewId(loan.id);
                                    setReviewAction("REJECT");
                                    setReviewerComment("");
                                  }}
                                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-1 px-2.5 rounded-lg text-[10px] cursor-pointer transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold">
                                {new Date(loan.createdAt).toLocaleDateString()}
                              </span>
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
                No loan applications found matching your criteria.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* EMPLOYEE PERSONAL LOANS VIEW                             */
        /* ======================================================== */
        <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5 border-b border-slate-50 dark:border-zinc-900 pb-3">
            <Wallet className="h-4 w-4 text-slate-400" />
            My Active Loans & History
          </h2>

          {loadingMyLoans ? (
            <div className="py-8 text-center text-slate-400 text-xs font-bold">Loading my loans...</div>
          ) : myLoans.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-medium text-slate-600 dark:text-zinc-400">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-900 text-[10px] uppercase text-slate-400 dark:text-zinc-500 text-left">
                    <th className="py-3 px-3 font-bold">Applied Date</th>
                    <th className="py-3 px-3 font-bold">Loan Amount</th>
                    <th className="py-3 px-3 font-bold">Monthly Deduction</th>
                    <th className="py-3 px-3 font-bold">Repayment Tenure</th>
                    <th className="py-3 px-3 font-bold">Reason</th>
                    <th className="py-3 px-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-zinc-900/60">
                  {myLoans.map(loan => {
                    const isApproved = loan.status === "APPROVED" || loan.status === "ACTIVE" || loan.status === "REPAID";
                    const statusClass = isApproved
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : loan.status === "PENDING"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400";

                    return (
                      <tr key={loan.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                        <td className="py-3.5 px-3 text-slate-950 dark:text-white font-bold">
                          {new Date(loan.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-3 font-extrabold text-slate-950 dark:text-white">
                          ${loan.amount.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3 text-slate-700 dark:text-zinc-300 font-semibold">
                          ${loan.monthlyRepayment.toFixed(2)} / month
                        </td>
                        <td className="py-3.5 px-3 text-slate-700 dark:text-zinc-300">
                          {loan.installments} Months
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 dark:text-zinc-400 max-w-xs truncate">
                          "{loan.reason}"
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${statusClass}`}>
                            {loan.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 dark:border-zinc-900 rounded-2xl">
              You have no active loans or past applications.
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: APPLY FOR LOAN                                    */}
      {/* ======================================================== */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl shadow-xl max-w-md w-full p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-zinc-900">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-500" />
                Apply for Company Advance Loan
              </h3>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleApplyLoan} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Loan Principal Amount ($)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 3000"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Repayment Tenure (Months)</label>
                <select
                  value={installmentsInput}
                  onChange={(e) => setInstallmentsInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                >
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                  <option value="12">12 Months (1 Year)</option>
                  <option value="24">24 Months (2 Years)</option>
                </select>
              </div>

              {amountInput && installmentsInput && (
                <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl text-xs text-slate-600 dark:text-zinc-400 flex justify-between items-center">
                  <span>Monthly Payroll Deduction:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    ${(parseFloat(amountInput) / parseInt(installmentsInput)).toFixed(2)}/month
                  </span>
                </div>
              )}

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Purpose / Reason</label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the reason for this advance loan request..."
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50 dark:border-zinc-900/60">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLoan}
                  className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
                >
                  {submittingLoan ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: HR REVIEW APPLICATION                             */}
      {/* ======================================================== */}
      {reviewId && reviewAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl shadow-xl max-w-md w-full p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-zinc-900">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {reviewAction === "APPROVE" ? "Approve Loan Application" : "Reject Loan Application"}
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

            <form onSubmit={handleReviewLoan} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  HR Reviewer Note / Decision Comment
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional comment sent directly to the applicant..."
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
