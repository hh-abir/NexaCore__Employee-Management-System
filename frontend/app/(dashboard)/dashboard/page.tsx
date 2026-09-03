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
  X, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  FileSpreadsheet, 
  AlertCircle, 
  Sparkles, 
  Wallet, 
  Clock, 
  ExternalLink, 
  ShieldCheck,
  CheckCircle,
  FolderKanban,
  FileText,
  Activity,
  Award,
  ShieldAlert,
  Search,
  MessageSquare,
  BookOpen,
  Trash2,
  FileCode
} from "lucide-react";
import { useToast } from "@/components/Toast";

interface KnowledgeDocument {
  id: string;
  title: string;
  description?: string;
  category: string;
  fileUrl: string;
  createdAt: string;
  author: {
    name: string;
    role: string;
  };
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    name: string;
  };
}

interface HRMetrics {
  totalEmployees: number;
  totalProjects: number;
  activeProjectsCount: number;
  pendingLeavesCount: number;
  pendingLoansCount: number;
  totalDisbursed: number;
  totalPendingPayroll: number;
}

interface PMMetrics {
  totalProjects: number;
  activeProjectsCount: number;
  pendingProjectsCount: number;
  completedProjectsCount: number;
  teamMembersCount: number;
  totalTasksCount: number;
  todoTasks: number;
  inProgressTasks: number;
  testingTasks: number;
  completedTasks: number;
  pendingTeamLeavesCount: number;
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

export default function DashboardPage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionLoading } = useSession();
  const { toast } = useToast();

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");

  // Centralized Knowledge Base states
  const [boardTab, setBoardTab] = useState<"ANNOUNCEMENTS" | "KNOWLEDGE">("ANNOUNCEMENTS");
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDocument[]>([]);
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);
  const [knowledgeCategory, setKnowledgeCategory] = useState("ALL");
  const [knowledgeSearch, setKnowledgeSearch] = useState("");

  // Post Knowledge Doc Modal (HR)
  const [showAddKnowledge, setShowAddKnowledge] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docDescription, setDocDescription] = useState("");
  const [docCategory, setDocCategory] = useState("POLICY");
  const [docFileUrl, setDocFileUrl] = useState("");
  const [savingDoc, setSavingDoc] = useState(false);

  // Attendance state
  const [clockedIn, setClockedIn] = useState(false);
  const [clockedOut, setClockedOut] = useState(false);
  const [attendanceRecord, setAttendanceRecord] = useState<any>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // HR Specific States
  const [hrMetrics, setHrMetrics] = useState<HRMetrics | null>(null);
  const [pendingSettlements, setPendingSettlements] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [pendingLoans, setPendingLoans] = useState<any[]>([]);
  const [loadingHRData, setLoadingHRData] = useState(false);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);

  // Project Settlement Modal State
  const [settlementProject, setSettlementProject] = useState<any>(null);
  const [bonusPercentage, setBonusPercentage] = useState("10");
  const [customBonusAmount, setCustomBonusAmount] = useState("");
  const [processingSettlement, setProcessingSettlement] = useState(false);

  // Quick Generate Payslip Modal State
  const [showGeneratePayslip, setShowGeneratePayslip] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0, 7));
  const [baseSalary, setBaseSalary] = useState("");
  const [bonusAmount, setBonusAmount] = useState("");
  const [deductionsAmount, setDeductionsAmount] = useState("");
  const [generatingPayslip, setGeneratingPayslip] = useState(false);

  // Project Manager Specific States
  const [pmMetrics, setPmMetrics] = useState<PMMetrics | null>(null);
  const [pmProjects, setPmProjects] = useState<any[]>([]);
  const [pmPendingProjects, setPmPendingProjects] = useState<any[]>([]);
  const [pmPendingTeamLeaves, setPmPendingTeamLeaves] = useState<any[]>([]);
  const [loadingPMData, setLoadingPMData] = useState(false);
  const [approvingProjectId, setApprovingProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLoading && !sessionData) {
      router.push("/login");
    }
  }, [sessionData, sessionLoading, router]);

  useEffect(() => {
    if (sessionData) {
      fetchAnnouncements();
      fetchKnowledgeDocs();
      fetchAttendanceStatus();
      if (sessionData.user.role === "HR") {
        fetchHRSummary();
        fetchEmployeesList();
      } else if (sessionData.user.role === "PROJECT_MANAGER") {
        fetchPMSummary();
      }
    }
  }, [sessionData]);

  useEffect(() => {
    if (sessionData) {
      fetchKnowledgeDocs();
    }
  }, [knowledgeCategory, knowledgeSearch]);

  const fetchHRSummary = async () => {
    setLoadingHRData(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/hr/summary`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
        setHrMetrics(data.metrics);
        setPendingSettlements(data.pendingSettlements || []);
        setPendingLeaves(data.pendingLeaves || []);
        setPendingLoans(data.pendingLoans || []);
      }
    } catch (err) {
      console.error("Failed to fetch HR summary:", err);
    } finally {
      setLoadingHRData(false);
    }
  };

  const fetchPMSummary = async () => {
    setLoadingPMData(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/pm-summary`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
        setPmMetrics(data.metrics || null);
        setPmProjects(data.projects || []);
        setPmPendingProjects(data.pendingProjects || []);
        setPmPendingTeamLeaves(data.pendingTeamLeaves || []);
      }
    } catch (err) {
      console.error("Failed to fetch PM summary:", err);
    } finally {
      setLoadingPMData(false);
    }
  };

  const handleApproveProject = async (projectId: string) => {
    setApprovingProjectId(projectId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/approve`, {
        method: "PATCH",
        credentials: "include"
      });
      const data = await safeJson(res);
      if (res.ok) {
        toast.success("Project approved! Team workspace and chat channels are now live.");
        fetchPMSummary();
      } else {
        toast.error(data.error || "Failed to approve project.");
      }
    } catch (err) {
      console.error("Approve project error:", err);
      toast.error("Internal server error.");
    } finally {
      setApprovingProjectId(null);
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
        if (data.employees?.length > 0 && !selectedEmpId) {
          setSelectedEmpId(data.employees[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch employee list:", err);
    }
  };

  const fetchAnnouncements = async () => {
    setLoadingAnnouncements(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/announcements`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
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
        toast.success("Company notice broadcasted successfully!");
        setAnnTitle("");
        setAnnContent("");
        setShowAddAnnouncement(false);
        fetchAnnouncements();
      } else {
        const data = await safeJson(res);
        toast.error(data.error || "Failed to post announcement.");
      }
    } catch (err) {
      console.error("Error posting announcement:", err);
      toast.error("Internal server error.");
    }
  };

  const fetchKnowledgeDocs = async () => {
    setLoadingKnowledge(true);
    try {
      const query = new URLSearchParams();
      if (knowledgeCategory !== "ALL") query.append("category", knowledgeCategory);
      if (knowledgeSearch.trim()) query.append("search", knowledgeSearch.trim());
      const res = await fetch(`${API_BASE_URL}/api/knowledge?${query.toString()}`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
        setKnowledgeDocs(data.documents || []);
      }
    } catch (err) {
      console.error("Failed to fetch knowledge docs:", err);
    } finally {
      setLoadingKnowledge(false);
    }
  };

  const handlePostKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docFileUrl.trim()) {
      toast.error("Title and Google Drive / PDF Link are required.");
      return;
    }
    setSavingDoc(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/knowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: docTitle,
          description: docDescription,
          category: docCategory,
          fileUrl: docFileUrl
        }),
        credentials: "include"
      });
      const data = await safeJson(res);
      if (res.ok) {
        toast.success("Knowledge base resource published successfully!");
        setDocTitle("");
        setDocDescription("");
        setDocFileUrl("");
        setShowAddKnowledge(false);
        fetchKnowledgeDocs();
      } else {
        toast.error(data.error || "Failed to publish resource.");
      }
    } catch (err) {
      console.error("Post knowledge error:", err);
      toast.error("Internal server error.");
    } finally {
      setSavingDoc(false);
    }
  };

  const handleDeleteKnowledge = async (docId: string) => {
    if (!confirm("Are you sure you want to remove this resource from the knowledge base?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/knowledge/${docId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        toast.success("Resource removed from knowledge base.");
        fetchKnowledgeDocs();
      } else {
        const data = await safeJson(res);
        toast.error(data.error || "Failed to remove document.");
      }
    } catch (err) {
      console.error("Delete knowledge error:", err);
    }
  };

  const fetchAttendanceStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/attendance/status`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
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
          timeout: 10000,
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
      const data = await safeJson(res);

      if (res.ok) {
        toast.success(data.message || "Clock In verified!");
        fetchAttendanceStatus();
      } else {
        toast.error(data.error || "Failed to clock in.");
      }
    } catch (err: any) {
      toast.error(err.message || "Could not retrieve GPS coordinates. Please enable location permissions.");
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
      const data = await safeJson(res);

      if (res.ok) {
        toast.success(data.message || "Clock Out recorded successfully!");
        fetchAttendanceStatus();
      } else {
        toast.error(data.error || "Failed to clock out.");
      }
    } catch (err: any) {
      toast.error(err.message || "Could not retrieve GPS coordinates.");
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleSettleProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlementProject) return;

    setProcessingSettlement(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${settlementProject.id}/settle-payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bonusPercentage: customBonusAmount ? undefined : bonusPercentage,
          bonusAmountPerMember: customBonusAmount || undefined
        }),
        credentials: "include"
      });
      const data = await safeJson(res);
      if (res.ok) {
        toast.success("Project payout settled! Budget transferred & bonus allocated.");
        setSettlementProject(null);
        setCustomBonusAmount("");
        fetchHRSummary();
      } else {
        toast.error(data.error || "Failed to settle project.");
      }
    } catch (err) {
      console.error("Settlement error:", err);
      toast.error("Internal server error.");
    } finally {
      setProcessingSettlement(false);
    }
  };

  const handleQuickPayslip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !baseSalary) {
      toast.error("Employee and Base Salary are required.");
      return;
    }

    setGeneratingPayslip(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payroll/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedEmpId,
          month: payrollMonth,
          baseSalary: parseFloat(baseSalary),
          bonus: bonusAmount ? parseFloat(bonusAmount) : 0,
          deductions: deductionsAmount ? parseFloat(deductionsAmount) : 0
        }),
        credentials: "include"
      });
      const data = await safeJson(res);
      if (res.ok) {
        toast.success("Payslip issued successfully!");
        setShowGeneratePayslip(false);
        setBaseSalary("");
        setBonusAmount("");
        setDeductionsAmount("");
        fetchHRSummary();
      } else {
        toast.error(data.error || "Failed to generate payslip.");
      }
    } catch (err) {
      console.error("Generate payslip error:", err);
      toast.error("Internal server error.");
    } finally {
      setGeneratingPayslip(false);
    }
  };

  const handleQuickReviewLeave = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/leaves/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include"
      });
      if (res.ok) {
        toast.success(`Leave request ${status.toLowerCase()}!`);
        if (sessionData?.user.role === "HR") fetchHRSummary();
        if (sessionData?.user.role === "PROJECT_MANAGER") fetchPMSummary();
      } else {
        const data = await safeJson(res);
        toast.error(data.error || "Failed to update leave.");
      }
    } catch (err) {
      toast.error("Internal server error.");
    }
  };

  const isHr = sessionData?.user?.role === "HR";
  const isPm = sessionData?.user?.role === "PROJECT_MANAGER";

  if (sessionLoading || !sessionData) return null;

  return (
    <div className="flex-grow flex flex-col space-y-6 font-sans text-slate-900 dark:text-white transition-colors duration-150 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>{isHr ? "Executive Operations" : isPm ? "Project Manager Console" : "Workspace Hub"}</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-extrabold uppercase px-2.5 py-0.5 rounded-full">
              {sessionData.user.role}
            </span>
          </h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
            {isHr 
              ? "Organization workforce metrics, pending approvals & financial settlement" 
              : isPm
              ? "Managed workspace velocity, task boards, team capacity & sprint delivery"
              : "Overview of your company activity, notices, and shift records"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {isHr && (
            <>
              <button
                onClick={() => setShowGeneratePayslip(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95"
              >
                <DollarSign className="h-3.5 w-3.5" />
                <span>Issue Payslip</span>
              </button>

              <button
                onClick={() => router.push("/dashboard/create-project")}
                className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Project</span>
              </button>
            </>
          )}

          {isPm && (
            <button
              onClick={() => router.push("/dashboard/active-projects")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95"
            >
              <FolderKanban className="h-4 w-4" />
              <span>Open Kanban Workspaces</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* PROJECT MANAGER EXECUTIVE DASHBOARD                      */}
      {/* ======================================================== */}
      {isPm && (
        <div className="space-y-6">
          
          {/* PM KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Active Workspaces</span>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {pmMetrics?.activeProjectsCount || 0}
                </span>
                <Briefcase className="h-6 w-6 text-indigo-500 opacity-75" />
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                {pmMetrics?.totalProjects || 0} Total Managed Projects
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Managed Engineers</span>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {pmMetrics?.teamMembersCount || 0}
                </span>
                <Users className="h-6 w-6 text-blue-500 opacity-75" />
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">Across Active Teams</div>
            </div>

            <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Sprint Tasks Progress</span>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {pmMetrics?.completedTasks || 0} / {pmMetrics?.totalTasksCount || 0}
                </span>
                <CheckCircle2 className="h-6 w-6 text-emerald-500 opacity-75" />
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                {pmMetrics?.inProgressTasks || 0} In Progress &bull; {pmMetrics?.todoTasks || 0} To Do
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Pending Actions</span>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                  {(pmMetrics?.pendingProjectsCount || 0) + (pmMetrics?.pendingTeamLeavesCount || 0)}
                </span>
                <Clock className="h-6 w-6 text-amber-500 opacity-75" />
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                {pmMetrics?.pendingProjectsCount || 0} New Projects &bull; {pmMetrics?.pendingTeamLeavesCount || 0} Leave Reviews
              </div>
            </div>
          </div>

          {/* PM Pending Project Approvals Banner */}
          {pmPendingProjects.length > 0 && (
            <div className="bg-gradient-to-r from-indigo-900/90 to-zinc-900 text-white p-6 rounded-3xl shadow-lg border border-indigo-500/30 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider">
                  New Projects Assigned by HR (Approval Required)
                </h3>
              </div>
              <p className="text-xs text-indigo-200 font-medium">
                HR has allocated you as Project Manager for the following workspaces. Review and approve to activate Kanban boards and team channels.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {pmPendingProjects.map(proj => (
                  <div key={proj.id} className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-black text-white">{proj.name}</span>
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 font-extrabold uppercase px-2 py-0.5 rounded-full border border-amber-500/30">
                          {proj.priority} Priority
                        </span>
                      </div>
                      <div className="text-[11px] text-indigo-200 mt-1">
                        Budget: ${proj.budget?.toLocaleString()} &bull; Team: {proj.employees?.length || 0} Developers
                      </div>
                      {proj.description && (
                        <p className="text-[11px] text-slate-300 mt-2 line-clamp-2 italic">
                          "{proj.description}"
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                      <button
                        onClick={() => handleApproveProject(proj.id)}
                        disabled={approvingProjectId === proj.id}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95"
                      >
                        {approvingProjectId === proj.id ? "Activating..." : "Approve & Activate Workspace"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Managed Projects Overview Grid */}
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl p-7 shadow-xs space-y-5">
            <div className="flex justify-between items-center border-b border-slate-50 dark:border-zinc-900 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-indigo-500" />
                Managed Project Workspaces
              </h2>
              <button
                onClick={() => router.push("/dashboard/active-projects")}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Kanban & Channels</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {loadingPMData ? (
              <div className="text-center py-8 text-xs text-slate-400 font-bold">Loading your projects...</div>
            ) : pmProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {pmProjects.map(proj => {
                  const totalTasks = proj.tasks?.length || 0;
                  const doneTasks = proj.tasks?.filter((t: any) => t.column === "COMPLETED").length || 0;
                  const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

                  return (
                    <div 
                      key={proj.id}
                      onClick={() => router.push(`/dashboard/active-projects?projectId=${proj.id}`)}
                      className="p-5 rounded-2xl border border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/30 hover:border-indigo-500/50 dark:hover:border-indigo-500/40 transition-all cursor-pointer space-y-4 group"
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          proj.status === "ACTIVE" 
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400"
                            : proj.status === "COMPLETED"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400"
                        }`}>
                          {proj.status}
                        </span>

                        <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-zinc-950 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-zinc-800">
                          {proj.category || "General"}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {proj.name}
                        </h3>
                        {proj.client && (
                          <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                            Client: {proj.client}
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400">
                          <span>Sprint Progress</span>
                          <span className="text-slate-900 dark:text-white">{progressPct}% ({doneTasks}/{totalTasks} Tasks)</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Team Avatars & Action */}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-zinc-900">
                        <div className="flex items-center -space-x-1.5">
                          {proj.employees?.slice(0, 4).map((emp: any) => (
                            <div 
                              key={emp.id}
                              title={emp.name}
                              className="w-6 h-6 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-[9px] flex items-center justify-center border-2 border-white dark:border-zinc-950"
                            >
                              {emp.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                            </div>
                          ))}
                          {(proj.employees?.length || 0) > 4 && (
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-zinc-950">
                              +{(proj.employees?.length || 0) - 4}
                            </div>
                          )}
                        </div>

                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          <span>Open</span>
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 dark:border-zinc-900 rounded-2xl">
                No managed projects found.
              </div>
            )}
          </div>

          {/* Team Leave Review Queue */}
          {pmPendingTeamLeaves.length > 0 && (
            <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl p-7 shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-2 border-b border-slate-50 dark:border-zinc-900 pb-3">
                <FileText className="h-4 w-4 text-amber-500" />
                Team Leave & Remote Work (WFH) Queue
              </h2>

              <div className="space-y-3">
                {pmPendingTeamLeaves.map(leave => (
                  <div key={leave.id} className="p-4 rounded-2xl border border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">{leave.user?.name}</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          leave.type === "WFH" ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400" : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                        }`}>
                          {leave.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(leave.startDate).toLocaleDateString()} &rarr; {new Date(leave.endDate).toLocaleDateString()} &bull; Reason: "{leave.reason}"
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleQuickReviewLeave(leave.id, "APPROVED")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-3 rounded-lg text-xs cursor-pointer transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleQuickReviewLeave(leave.id, "REJECTED")}
                        className="bg-slate-200 dark:bg-zinc-800 hover:bg-rose-600 hover:text-white text-slate-700 dark:text-zinc-300 font-bold py-1 px-3 rounded-lg text-xs cursor-pointer transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* HR EXECUTIVE METRICS OVERVIEW (For HR Role)              */}
      {/* ======================================================== */}
      {isHr && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Total Workforce</span>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{hrMetrics?.totalEmployees || 0}</span>
              <Users className="h-6 w-6 text-indigo-500 opacity-75" />
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">Staff Members Provisioned</div>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Active Projects</span>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{hrMetrics?.activeProjectsCount || 0}</span>
              <Briefcase className="h-6 w-6 text-blue-500 opacity-75" />
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">{hrMetrics?.totalProjects || 0} Total Projects</div>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Settlement Queue</span>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{pendingSettlements.length}</span>
              <CheckCircle2 className="h-6 w-6 text-amber-500 opacity-75" />
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">Completed Projects Awaiting Payout</div>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Pending Reviews</span>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                {(hrMetrics?.pendingLeavesCount || 0) + (hrMetrics?.pendingLoansCount || 0)}
              </span>
              <Clock className="h-6 w-6 text-rose-500 opacity-75" />
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">{hrMetrics?.pendingLeavesCount || 0} Leaves &bull; {hrMetrics?.pendingLoansCount || 0} Loans</div>
          </div>
        </div>

        {/* HR Pending Project Settlements Queue */}
        {pendingSettlements.length > 0 && (
          <div className="bg-gradient-to-r from-amber-950/40 via-zinc-950 to-zinc-950 border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    Project Completion & Payout Settlement Queue ({pendingSettlements.length})
                  </h3>
                  <p className="text-xs text-amber-200/70 font-medium">
                    The following workspaces were marked as completed by their Project Managers and await HR financial settlement.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {pendingSettlements.map((proj: any) => (
                <div
                  key={proj.id}
                  className="bg-black/40 border border-amber-500/20 rounded-2xl p-4 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-white">{proj.name}</span>
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 font-extrabold uppercase px-2 py-0.5 rounded-full border border-amber-500/30">
                        Pending Payout
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-300 mt-1">
                      Budget: ${proj.budget?.toLocaleString()} &bull; Lead: {proj.manager?.name} &bull; {proj.employees?.length || 0} Engineers
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-white/5">
                    <button
                      onClick={() => setSettlementProject(proj)}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Review & Settle Payout</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      )}

      {/* ======================================================== */}
      {/* STANDARD / GENERAL EMPLOYEE KPI CARDS                    */}
      {/* ======================================================== */}
      {!isHr && !isPm && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Assigned Role</span>
            <div className="flex justify-between items-end">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">{sessionData.user.role}</span>
              <Users className="h-6 w-6 text-indigo-500 opacity-75" />
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">Active Member</div>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Today's Shift</span>
            <div className="flex justify-between items-end">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                {clockedIn ? (clockedOut ? "Completed" : "Clocked In") : "Not Started"}
              </span>
              <Clock className="h-6 w-6 text-emerald-500 opacity-75" />
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">
              {attendanceRecord?.isLate ? "Late Flagged" : "Standard Shift"}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Announcements</span>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{announcements.length}</span>
              <Sparkles className="h-6 w-6 text-amber-500 opacity-75" />
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">Company Bulletins</div>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Workplace Radius</span>
            <div className="flex justify-between items-end">
              <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">200m Hub</span>
              <ShieldCheck className="h-6 w-6 text-emerald-500 opacity-75" />
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">BRAC University Campus</div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CLOCK CONSOLE & NOTICE BOARD                             */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Clock Console */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5 border-b border-slate-50 dark:border-zinc-900 pb-3">
              <Clock className="h-4 w-4 text-indigo-500" />
              Daily Attendance Check-In
            </h2>

            <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Shift Date:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Campus Hub:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">BRAC University (200m)</span>
              </div>

              {attendanceRecord && (
                <div className="pt-2 border-t border-slate-200/50 dark:border-zinc-800 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Clock In:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {new Date(attendanceRecord.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {attendanceRecord.clockOut && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Clock Out:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {new Date(attendanceRecord.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              {!clockedIn ? (
                <button
                  onClick={handleClockIn}
                  disabled={loadingAttendance}
                  className="w-full bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
                >
                  {loadingAttendance ? "Verifying GPS Perimeter..." : "Clock In (Geofenced)"}
                </button>
              ) : !clockedOut ? (
                <button
                  onClick={handleClockOut}
                  disabled={loadingAttendance}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
                >
                  {loadingAttendance ? "Recording Departure..." : "Clock Out"}
                </button>
              ) : (
                <div className="py-2.5 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                  ✓ Today's Shift Completed
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Company Notice Board & Knowledge Base Hub */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl p-6 shadow-xs space-y-4">
            
            {/* Header with Switcher Tabs and HR Action Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-50 dark:border-zinc-900 pb-3">
              
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-900 p-1 rounded-2xl">
                <button
                  onClick={() => setBoardTab("ANNOUNCEMENTS")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    boardTab === "ANNOUNCEMENTS"
                      ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Notice Board</span>
                  <span className="text-[10px] opacity-70">({announcements.length})</span>
                </button>

                <button
                  onClick={() => setBoardTab("KNOWLEDGE")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    boardTab === "KNOWLEDGE"
                      ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Knowledge Base & Docs</span>
                  <span className="text-[10px] opacity-70">({knowledgeDocs.length})</span>
                </button>
              </div>

              {isHr && (
                boardTab === "ANNOUNCEMENTS" ? (
                  <button
                    onClick={() => setShowAddAnnouncement(true)}
                    className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-1.5 px-3.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Post Notice</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowAddKnowledge(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Publish Resource</span>
                  </button>
                )
              )}
            </div>

            {/* TAB 1: ANNOUNCEMENTS */}
            {boardTab === "ANNOUNCEMENTS" && (
              <>
                {loadingAnnouncements ? (
                  <div className="py-8 text-center text-slate-400 text-xs font-bold">Loading notices...</div>
                ) : announcements.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {announcements.map(ann => (
                      <div key={ann.id} className="p-4 rounded-2xl border border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/30 space-y-1.5">
                        <div className="flex justify-between items-start">
                          <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">{ann.title}</h3>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {new Date(ann.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-medium">
                          {ann.content}
                        </p>
                        <div className="text-[9px] text-slate-400 font-bold uppercase pt-1">
                          Posted by: {ann.author?.name || "HR Admin"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 dark:border-zinc-900 rounded-2xl">
                    No active announcements posted.
                  </div>
                )}
              </>
            )}

            {/* TAB 2: CENTRALIZED KNOWLEDGE BASE & DRIVE DOCS */}
            {boardTab === "KNOWLEDGE" && (
              <div className="space-y-3">
                {/* Search & Category Filter */}
                <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-bold">
                    {[
                      { id: "ALL", label: "All Docs" },
                      { id: "POLICY", label: "Policies" },
                      { id: "CODING_GUIDELINES", label: "Coding Standards" },
                      { id: "PROJECT_DOCS", label: "Project Specs" },
                      { id: "ONBOARDING", label: "Onboarding" }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setKnowledgeCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                          knowledgeCategory === cat.id
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-slate-100 dark:bg-zinc-900 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative flex items-center bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-2.5 py-1 w-full sm:w-48 shrink-0">
                    <Search className="h-3 w-3 text-slate-400 mr-1.5 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search docs..."
                      value={knowledgeSearch}
                      onChange={(e) => setKnowledgeSearch(e.target.value)}
                      className="bg-transparent text-[11px] outline-none text-slate-900 dark:text-white w-full font-medium"
                    />
                  </div>
                </div>

                {/* Knowledge Documents List */}
                {loadingKnowledge ? (
                  <div className="py-8 text-center text-slate-400 text-xs font-bold">Loading knowledge base...</div>
                ) : knowledgeDocs.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {knowledgeDocs.map(doc => (
                      <div
                        key={doc.id}
                        className="p-4 rounded-2xl border border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/30 flex flex-col justify-between space-y-2.5 hover:border-indigo-500/30 transition-colors"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">{doc.title}</h3>
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400">
                                {doc.category.replace("_", " ")}
                              </span>
                            </div>

                            <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {doc.description && (
                            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-medium mt-1">
                              {doc.description}
                            </p>
                          )}
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-200/50 dark:border-zinc-800/60 text-[11px]">
                          <div className="text-[9px] text-slate-400 font-bold uppercase">
                            Published by: {doc.author?.name || "HR Admin"}
                          </div>

                          <div className="flex items-center gap-3">
                            {isHr && (
                              <button
                                onClick={() => handleDeleteKnowledge(doc.id)}
                                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                title="Remove Document"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}

                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-200 dark:border-indigo-500/20 transition-all hover:scale-105"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Drive Link (PDF / Docs)</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 dark:border-zinc-900 rounded-2xl space-y-1">
                    <BookOpen className="h-6 w-6 text-slate-300 dark:text-zinc-700 mx-auto" />
                    <div>No knowledge base resources found.</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      HR administrators can publish policy documents, coding guidelines, and onboarding drive links.
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* MODAL: POST ANNOUNCEMENT (HR ONLY)                       */}
      {/* ======================================================== */}
      {showAddAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl shadow-xl max-w-lg w-full p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-zinc-900">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Broadcast Company Notice</h3>
              <button onClick={() => setShowAddAnnouncement(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Upcoming Public Holiday or Company Policy Update"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Notice Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type the full announcement content..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium resize-none"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowAddAnnouncement(false)}
                  className="bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PUBLISH KNOWLEDGE BASE RESOURCE (HR ONLY)         */}
      {/* ======================================================== */}
      {showAddKnowledge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Publish Knowledge Resource</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Central repository for company docs & standards</p>
                </div>
              </div>
              <button onClick={() => setShowAddKnowledge(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePostKnowledge} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Document / Resource Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NexaCore Employee Handbook, React & Node Coding Standards, Sprint Deliverable Guide"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    Resource Category
                  </label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-600 font-bold"
                  >
                    <option value="POLICY">Company Policy (HR / Leave / WFH)</option>
                    <option value="CODING_GUIDELINES">Engineering & Coding Guidelines</option>
                    <option value="PROJECT_DOCS">Project Specifications & Architecture</option>
                    <option value="ONBOARDING">New Employee Onboarding Resources</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    Google Drive Link (PDF / Docs)
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/... or PDF URL"
                    value={docFileUrl}
                    onChange={(e) => setDocFileUrl(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-600 font-medium font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Summary / Overview Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide a quick summary or key takeaways for staff members reading this resource..."
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-600 font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowAddKnowledge(false)}
                  className="bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 font-bold py-2 px-4 rounded-xl text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDoc}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>{savingDoc ? "Publishing..." : "Publish to Knowledge Base"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: QUICK ISSUE PAYSLIP (HR ONLY)                     */}
      {/* ======================================================== */}
      {showGeneratePayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl shadow-xl max-w-md w-full p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-zinc-900">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Issue Employee Payslip</h3>
              <button onClick={() => setShowGeneratePayslip(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleQuickPayslip} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Select Employee</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                >
                  {allEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Month (YYYY-MM)</label>
                  <input
                    type="month"
                    required
                    value={payrollMonth}
                    onChange={(e) => setPayrollMonth(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Base Salary ($)</label>
                  <input
                    type="number"
                    required
                    placeholder="4500"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Bonus ($)</label>
                  <input
                    type="number"
                    placeholder="500"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Deductions ($)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={deductionsAmount}
                    onChange={(e) => setDeductionsAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowGeneratePayslip(false)}
                  className="bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingPayslip}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  {generatingPayslip ? "Issuing..." : "Generate Payslip"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: HR PROJECT FINANCIAL SETTLEMENT                   */}
      {/* ======================================================== */}
      {settlementProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 text-left space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Project Financial Settlement</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">{settlementProject.name}</p>
                </div>
              </div>
              <button onClick={() => setSettlementProject(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-zinc-900/60 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Total Approved Budget:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">${settlementProject.budget?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Project Lead (PM):</span>
                <span className="font-bold text-slate-900 dark:text-white">{settlementProject.manager?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Allocated Team:</span>
                <span className="font-bold text-slate-900 dark:text-white">{settlementProject.employees?.length || 1} Engineers</span>
              </div>
            </div>

            <form onSubmit={handleSettleProject} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  Team Performance Bonus Pool (% of Budget)
                </label>
                <select
                  value={bonusPercentage}
                  onChange={(e) => {
                    setBonusPercentage(e.target.value);
                    setCustomBonusAmount("");
                  }}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none font-bold cursor-pointer"
                >
                  <option value="0">0% — No Additional Team Bonus</option>
                  <option value="5">5% — Standard Delivery Bonus (${((settlementProject.budget * 0.05) / (settlementProject.employees?.length || 1)).toFixed(0)}/member)</option>
                  <option value="10">10% — Exceptional Milestone Bonus (${((settlementProject.budget * 0.10) / (settlementProject.employees?.length || 1)).toFixed(0)}/member)</option>
                  <option value="15">15% — High Velocity Sprint Bonus (${((settlementProject.budget * 0.15) / (settlementProject.employees?.length || 1)).toFixed(0)}/member)</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  Or Fixed Bonus Amount Per Team Member ($ USD)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={customBonusAmount}
                  onChange={(e) => setCustomBonusAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none font-mono font-bold"
                />
              </div>

              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 text-[10px] text-emerald-800 dark:text-emerald-300 font-medium">
                ✓ Approving settlement marks the project as <strong>COMPLETED</strong>, records financial ledger payouts, and automatically issues cryptographic digital achievement certificates to all team members.
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => setSettlementProject(null)}
                  className="bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 font-bold py-2 px-4 rounded-xl text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingSettlement}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {processingSettlement ? (
                    <span>Settling & Issuing Certificates...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Approve Settlement & Finalize</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
