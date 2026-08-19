"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Briefcase,
  User,
  Users,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Tag,
  Clock,
  ShieldCheck,
  Check
} from "lucide-react";
import { useToast } from "@/components/Toast";

interface UserCompact {
  id: string;
  name: string;
  email: string;
  activeProjectsCount: number;
}

interface ManagerCompact {
  id: string;
  name: string;
  email: string;
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

const CATEGORY_PRESETS = ["Web Development", "Mobile App", "UI/UX Design", "AI & Data Science", "Cloud Infrastructure", "Security Audit"];

export default function CreateProjectPage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionLoading } = useSession();
  const { toast } = useToast();

  // Form States
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projClient, setProjClient] = useState("");
  const [projCategory, setProjCategory] = useState("Web Development");
  const [projBudget, setProjBudget] = useState("");
  const [projPriority, setProjPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [projStart, setProjStart] = useState("");
  const [projEnd, setProjEnd] = useState("");

  // Allocation States
  const [managers, setManagers] = useState<ManagerCompact[]>([]);
  const [selectedManager, setSelectedManager] = useState("");
  const [freeEmployees, setFreeEmployees] = useState<UserCompact[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [loadingResources, setLoadingResources] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionLoading) {
      if (!sessionData) {
        router.push("/login");
      } else if (sessionData.user.role !== "HR") {
        router.push("/dashboard/active-projects");
      }
    }
  }, [sessionData, sessionLoading, router]);

  useEffect(() => {
    if (sessionData && sessionData.user.role === "HR") {
      fetchResources();
    }
  }, [sessionData]);

  const fetchResources = async () => {
    setLoadingResources(true);
    try {
      const [empRes, mgrRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/projects/free-employees`, { credentials: "include" }),
        fetch(`${API_BASE_URL}/api/projects/managers`, { credentials: "include" })
      ]);

      if (empRes.ok) {
        const empData = await safeJson(empRes);
        setFreeEmployees(empData.employees || []);
      }
      if (mgrRes.ok) {
        const mgrData = await safeJson(mgrRes);
        const mgrList = mgrData.managers || [];
        setManagers(mgrList);
        if (mgrList.length > 0 && !selectedManager) {
          setSelectedManager(mgrList[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load workforce resources:", err);
    } finally {
      setLoadingResources(false);
    }
  };

  const toggleEmployeeSelection = (empId: string) => {
    setSelectedEmployees(prev => {
      if (prev.includes(empId)) {
        return prev.filter(id => id !== empId);
      }
      if (prev.length >= 5) {
        toast.error("Maximum 5 team members can be assigned per project.");
        return prev;
      }
      return [...prev, empId];
    });
  };

  const handleBudgetPreset = (amount: number) => {
    setProjBudget(amount.toString());
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim() || !selectedManager) {
      toast.error("Project name and assigned Project Manager are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projName.trim(),
          description: projDesc.trim() || undefined,
          managerId: selectedManager,
          employeeIds: selectedEmployees,
          budget: projBudget ? parseFloat(projBudget) : undefined,
          client: projClient.trim() || undefined,
          startDate: projStart || undefined,
          endDate: projEnd || undefined,
          priority: projPriority,
          category: projCategory || undefined
        }),
        credentials: "include"
      });

      const data = await safeJson(res);
      if (res.ok) {
        toast.success("Project workspace initialized successfully!");
        router.push("/dashboard/active-projects");
      } else {
        toast.error(data.error || "Failed to create project.");
      }
    } catch (err) {
      console.error("Create project error:", err);
      toast.error("Internal server error.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter unassigned & search query matching employees
  const filteredEmployees = useMemo(() => {
    const q = employeeSearchQuery.trim().toLowerCase();
    return freeEmployees.filter(emp => {
      if (selectedEmployees.includes(emp.id)) return false;
      if (!q) return true;
      return emp.name.toLowerCase().includes(q) || emp.email.toLowerCase().includes(q);
    });
  }, [freeEmployees, selectedEmployees, employeeSearchQuery]);

  const assignedManagerObj = managers.find(m => m.id === selectedManager);

  // Calculate estimated days
  const timelineDays = useMemo(() => {
    if (!projStart || !projEnd) return null;
    const s = new Date(projStart).getTime();
    const e = new Date(projEnd).getTime();
    if (e <= s) return null;
    return Math.round((e - s) / (1000 * 60 * 60 * 24));
  }, [projStart, projEnd]);

  if (sessionLoading || !sessionData || sessionData.user.role !== "HR") return null;

  return (
    <div className="flex-grow flex flex-col space-y-6 font-sans text-slate-900 dark:text-white transition-colors duration-150 text-left">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => router.push("/dashboard/active-projects")}
            className="p-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer shadow-xs bg-white dark:bg-zinc-950"
            title="Back to Active Projects"
          >
            <ArrowLeft className="h-4 w-4 text-slate-500" />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>Initialize Project</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                HR Creator
              </span>
            </h1>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
              Set project budget boundaries, delivery timeline, manager and staff allocations
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* ======================================================== */}
        {/* LEFT 2 COLUMNS: PROJECT CREATION FORM                    */}
        {/* ======================================================== */}
        <div className="xl:col-span-2 space-y-6">
          <form onSubmit={handleCreateProject} className="space-y-6">
            
            {/* Section 1: Identity & Scope */}
            <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl p-7 shadow-xs space-y-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-2 border-b border-slate-50 dark:border-zinc-900 pb-3">
                <Briefcase className="h-4 w-4 text-indigo-500" />
                1. Project Scope & Deliverables
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Enterprise Cloud Migration & Mobile App"
                    value={projName}
                    onChange={(e) => setProjName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-semibold transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                      Client / Stakeholder
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. NexaCore Internal, Apex Global Corp"
                      value={projClient}
                      onChange={(e) => setProjClient(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-semibold transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                      Domain Category
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Web Development"
                      value={projCategory}
                      onChange={(e) => setProjCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-semibold transition-all"
                    />
                  </div>
                </div>

                {/* Category Preset Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {CATEGORY_PRESETS.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setProjCategory(cat)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        projCategory === cat 
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-xs" 
                          : "border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-zinc-900"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    Project Overview & Objectives
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Document functional deliverables, architectural milestones, and expected outcomes..."
                    value={projDesc}
                    onChange={(e) => setProjDesc(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-medium resize-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Financials & Timeline Parameters */}
            <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl p-7 shadow-xs space-y-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-2 border-b border-slate-50 dark:border-zinc-900 pb-3">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                2. Budget Boundaries & Delivery Schedule
              </h2>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block">
                      Allocated Budget ($)
                    </label>
                    <div className="flex items-center gap-1">
                      {[15000, 35000, 60000, 100000].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleBudgetPreset(val)}
                          className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white cursor-pointer"
                        >
                          ${(val / 1000)}k
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    value={projBudget}
                    onChange={(e) => setProjBudget(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-semibold transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                      Priority Level
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {(["LOW", "MEDIUM", "HIGH"] as const).map(pri => (
                        <button
                          key={pri}
                          type="button"
                          onClick={() => setProjPriority(pri)}
                          className={`py-2 rounded-xl text-[10px] font-extrabold cursor-pointer transition-all ${
                            projPriority === pri
                              ? pri === "HIGH" 
                                ? "bg-rose-600 text-white shadow-xs" 
                                : pri === "MEDIUM" 
                                ? "bg-amber-600 text-white shadow-xs" 
                                : "bg-emerald-600 text-white shadow-xs"
                              : "bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800"
                          }`}
                        >
                          {pri}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                      Kickoff Start Date
                    </label>
                    <input
                      type="date"
                      value={projStart}
                      onChange={(e) => setProjStart(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                      Target Delivery Deadline
                    </label>
                    <input
                      type="date"
                      value={projEnd}
                      onChange={(e) => setProjEnd(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-semibold"
                    />
                  </div>
                </div>

                {timelineDays && (
                  <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-700 dark:text-indigo-400 font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Estimated Sprint Duration: {timelineDays} days</span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Manager & Staff Allocation */}
            <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl p-7 shadow-xs space-y-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-2 border-b border-slate-50 dark:border-zinc-900 pb-3">
                <Users className="h-4 w-4 text-blue-500" />
                3. Lead Manager & Team Allocation
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    Assign Project Manager *
                  </label>
                  <select
                    required
                    value={selectedManager}
                    onChange={(e) => setSelectedManager(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-bold cursor-pointer"
                  >
                    <option value="">-- Choose Project Manager --</option>
                    {managers.map(mgr => (
                      <option key={mgr.id} value={mgr.id}>
                        {mgr.name} ({mgr.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assigned Member Chips */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block">
                      Assigned Team Members ({selectedEmployees.length}/5)
                    </label>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      Click chips to unassign
                    </span>
                  </div>

                  {selectedEmployees.length > 0 ? (
                    <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 mb-3">
                      {selectedEmployees.map(empId => {
                        const emp = freeEmployees.find(e => e.id === empId);
                        if (!emp) return null;
                        return (
                          <div 
                            key={empId} 
                            onClick={() => toggleEmployeeSelection(empId)}
                            className="flex items-center gap-2 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold pl-3 pr-2 py-1.5 rounded-xl shadow-xs cursor-pointer hover:scale-105 transition-all"
                            title="Click to remove"
                          >
                            <span>{emp.name}</span>
                            <span className="w-4 h-4 rounded-full bg-white/20 dark:bg-black/10 flex items-center justify-center text-[10px]">
                              &times;
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl mb-3">
                      No staff assigned yet. Select up to 5 members from the registry below.
                    </div>
                  )}
                </div>

                {/* Search & Available Employee List */}
                <div className="space-y-2">
                  <div className="relative flex items-center bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2">
                    <Search className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search available engineers by name or email..."
                      value={employeeSearchQuery}
                      onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                      className="bg-transparent text-xs outline-none text-zinc-900 dark:text-white w-full font-medium"
                    />
                  </div>

                  {loadingResources ? (
                    <div className="text-center py-6 text-xs text-slate-400 font-semibold">Loading workforce registry...</div>
                  ) : filteredEmployees.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1">
                      {filteredEmployees.map(emp => (
                        <div
                          key={emp.id}
                          onClick={() => toggleEmployeeSelection(emp.id)}
                          className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-zinc-850 bg-slate-50/60 dark:bg-zinc-900/40 hover:bg-slate-100 dark:hover:bg-zinc-900 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-extrabold text-[10px] flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              {emp.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{emp.name}</div>
                              <div className="text-[10px] text-slate-400 truncate">{emp.email}</div>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 shrink-0 ml-2">
                            {emp.activeProjectsCount}/2 active
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs text-slate-400 font-medium">
                      {employeeSearchQuery ? "No matching employees found." : "All available employees assigned."}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Submit Action Bar */}
            <div className="flex justify-end items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard/active-projects")}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-bold py-2.5 px-6 rounded-2xl text-xs cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-2.5 px-8 rounded-2xl text-xs cursor-pointer shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>{submitting ? "Initializing..." : "Launch Project Workspace"}</span>
              </button>
            </div>

          </form>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: LIVE INTERACTIVE PREVIEW CARD              */}
        {/* ======================================================== */}
        <div className="xl:col-span-1 space-y-6">
          <div className="sticky top-6 space-y-4">
            
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 block">
                Live Card Preview
              </span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-2.5 w-2.5" />
                Real-Time
              </span>
            </div>

            {/* Preview Card */}
            <div className="bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-start">
                <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
                  projPriority === "HIGH" 
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400" 
                    : projPriority === "MEDIUM" 
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400" 
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400"
                }`}>
                  {projPriority} Priority
                </span>

                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded-lg">
                  {projCategory || "General"}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
                  {projName || "Untitled Project Workspace"}
                </h3>
                {projClient && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                    Client: {projClient}
                  </p>
                )}
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium line-clamp-3 leading-relaxed mt-2">
                  {projDesc || "Project scope description will appear here as you type."}
                </p>
              </div>

              {/* Budget & Timeline Metrics */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800/80">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Total Budget</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    ${projBudget ? parseFloat(projBudget).toLocaleString() : "0"}
                  </span>
                </div>
                <div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Timeline</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {projStart ? new Date(projStart).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBD"}
                    {" → "}
                    {projEnd ? new Date(projEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBD"}
                  </span>
                </div>
              </div>

              {/* Manager & Staffing Preview */}
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-900 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Manager:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {assignedManagerObj ? assignedManagerObj.name : "Unassigned"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Team Size:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {selectedEmployees.length} Developers Assigned
                  </span>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
