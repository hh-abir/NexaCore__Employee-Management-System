"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Briefcase
} from "lucide-react";

interface UserCompact {
  id: string;
  name: string;
  email: string;
  activeProjectsCount: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function CreateProjectPage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionLoading } = useSession();

  
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [loadingFree, setLoadingFree] = useState(false);
  const [freeEmployees, setFreeEmployees] = useState<UserCompact[]>([]);

  
  const [projBudget, setProjBudget] = useState("");
  const [projClient, setProjClient] = useState("");
  const [projStart, setProjStart] = useState("");
  const [projEnd, setProjEnd] = useState("");
  const [projPriority, setProjPriority] = useState("MEDIUM");
  const [projCategory, setProjCategory] = useState("");
  const [managers, setManagers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selectedManager, setSelectedManager] = useState("");
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");

  
  interface Toast {
    id: string;
    message: string;
    type: "success" | "error" | "info";
  }
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  
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
      fetchFreeEmployees();
      fetchManagers();
    }
  }, [sessionData]);

  const fetchFreeEmployees = async () => {
    setLoadingFree(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/free-employees`, {
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        setFreeEmployees(data.employees || []);
      }
    } catch (err) {
      console.error("Failed to fetch free employees:", err);
    } finally {
      setLoadingFree(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/managers`, {
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        setManagers(data.managers || []);
      }
    } catch (err) {
      console.error("Failed to fetch managers:", err);
    }
  };

  const toggleEmployeeSelection = (empId: string) => {
    setSelectedEmployees(prev => {
      if (prev.includes(empId)) {
        return prev.filter(id => id !== empId);
      }
      if (prev.length >= 5) {
        showToast("Maximum of 5 assigned employees allowed.", "error");
        return prev;
      }
      return [...prev, empId];
    });
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projName,
          description: projDesc,
          managerId: selectedManager,
          employeeIds: selectedEmployees,
          budget: projBudget || undefined,
          client: projClient || undefined,
          startDate: projStart || undefined,
          endDate: projEnd || undefined,
          priority: projPriority,
          category: projCategory || undefined
        }),
        credentials: "include"
      });

      if (res.ok) {
        // Redirect on success
        router.push("/dashboard/active-projects");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to create project.", "error");
      }
    } catch (err) {
      console.error("Error creating project:", err);
      showToast("Server communication error.", "error");
    }
  };

  if (sessionLoading || !sessionData || sessionData.user.role !== "HR") return null;

  return (
    <div className="flex-grow flex flex-col space-y-6 font-sans text-slate-900 dark:text-white transition-colors duration-150">
      
      {/* Header Panel */}
      <div className="bg-white dark:bg-zinc-950 border-none shadow-xs rounded-2xl p-6 text-left space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-50 dark:border-zinc-900">
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={() => router.push("/dashboard/active-projects")}
              className="p-2 border border-slate-200 dark:border-zinc-800 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="h-4.5 w-4.5 text-slate-400" />
                Initialize New Project Workspace
              </h2>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                Set budget parameter boundaries, timelines, and staff project managers
              </p>
            </div>
          </div>
        </div>

        {/* Create Project Form */}
        <form onSubmit={handleCreateProject} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Metadata */}
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1.5">Project Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Website Overhaul"
                  required
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 h-10 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-semibold transition-all"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1.5">Description (Optional)</label>
                <textarea 
                  placeholder="Describe project scope and target deliverables..."
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-medium transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1.5">Client Name</label>
                  <input 
                    type="text"
                    placeholder="Acme Corp"
                    value={projClient}
                    onChange={(e) => setProjClient(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 h-10 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-semibold transition-all"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1.5">Category</label>
                  <input 
                    type="text"
                    placeholder="e.g. Design, Web App"
                    value={projCategory}
                    onChange={(e) => setProjCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 h-10 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-semibold transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Financial & Timelines */}
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1.5">Assign Project Manager</label>
                <select
                  required
                  value={selectedManager}
                  onChange={(e) => setSelectedManager(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 h-10 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-bold cursor-pointer transition-all"
                >
                  <option value="">-- Select Project Manager --</option>
                  {managers.map(mgr => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.name} ({mgr.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1.5">Project Budget ($)</label>
                  <input 
                    type="number"
                    placeholder="50000"
                    value={projBudget}
                    onChange={(e) => setProjBudget(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 h-10 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-semibold transition-all"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1.5">Priority</label>
                  <select
                    value={projPriority}
                    onChange={(e) => setProjPriority(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 h-10 text-xs text-slate-950 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-bold cursor-pointer transition-all"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1.5">Start Date</label>
                  <input 
                    type="date"
                    value={projStart}
                    onChange={(e) => setProjStart(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 h-10 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-semibold transition-all"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1.5">End Date</label>
                  <input 
                    type="date"
                    value={projEnd}
                    onChange={(e) => setProjEnd(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 h-10 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-semibold transition-all"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Employee checklist selector - full width search & list */}
          <div className="pt-2">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block">
                Assign Employees (Search and select up to 5)
              </label>
              <span className="text-[10px] font-bold text-slate-400">
                {selectedEmployees.length}/5 Assigned
              </span>
            </div>

            {/* Selected employee chips */}
            {selectedEmployees.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedEmployees.map(empId => {
                  const emp = freeEmployees.find(e => e.id === empId);
                  if (!emp) return null;
                  return (
                    <div key={empId} className="flex items-center gap-1.5 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold pl-3 pr-2 py-1.5 rounded-full shadow-xs">
                      <span>{emp.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleEmployeeSelection(empId)}
                        className="w-4 h-4 rounded-full flex items-center justify-center bg-white/20 dark:bg-black/10 hover:bg-white/40 dark:hover:bg-black/25 text-[10px] text-white dark:text-zinc-950 cursor-pointer"
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Search Box */}
            <input 
              type="text"
              placeholder="Search employees by name or email..."
              value={employeeSearchQuery}
              onChange={(e) => setEmployeeSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 h-10 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-medium mb-3"
            />

            {loadingFree ? (
              <div className="text-center py-6 text-xs font-semibold text-slate-400">Loading free employee registry...</div>
            ) : (
              (() => {
                const query = employeeSearchQuery.trim().toLowerCase();
                const filtered = freeEmployees.filter(emp =>
                  emp.name.toLowerCase().includes(query) ||
                  emp.email.toLowerCase().includes(query)
                );
                const unselectedFiltered = filtered.filter(emp => !selectedEmployees.includes(emp.id));

                if (unselectedFiltered.length > 0) {
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 p-1 max-h-48 overflow-y-auto">
                      {unselectedFiltered.map(emp => (
                        <div 
                          key={emp.id}
                          onClick={() => toggleEmployeeSelection(emp.id)}
                          className="flex items-center justify-between p-3.5 rounded-xl cursor-pointer text-xs font-bold border transition-all bg-slate-50 dark:bg-zinc-900 border-slate-200/50 dark:border-zinc-800 hover:bg-slate-100/50 dark:hover:bg-zinc-900"
                        >
                          <div className="flex flex-col min-w-0 text-left">
                            <span className="truncate">{emp.name}</span>
                            <span className="text-[8px] opacity-60 font-semibold truncate mt-0.5">{emp.email}</span>
                          </div>
                          <span className="text-[8px] border rounded-full px-1.5 py-0.5 shrink-0 opacity-70 ml-2">
                            {emp.activeProjectsCount}/2 active
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                } else if (query && filtered.length === 0) {
                  return (
                    <div className="text-center py-4 text-xs font-semibold text-slate-400">
                      No matching free employees found.
                    </div>
                  );
                } else {
                  const defaultList = freeEmployees.filter(emp => !selectedEmployees.includes(emp.id)).slice(0, 8);
                  if (defaultList.length > 0) {
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 p-1 max-h-48 overflow-y-auto">
                        {defaultList.map(emp => (
                          <div 
                            key={emp.id}
                            onClick={() => toggleEmployeeSelection(emp.id)}
                            className="flex items-center justify-between p-3.5 rounded-xl cursor-pointer text-xs font-bold border transition-all bg-slate-50 dark:bg-zinc-900 border-slate-200/50 dark:border-zinc-800 hover:bg-slate-100/50 dark:hover:bg-zinc-900"
                          >
                            <div className="flex flex-col min-w-0 text-left">
                              <span className="truncate">{emp.name}</span>
                              <span className="text-[8px] opacity-60 font-semibold truncate mt-0.5">{emp.email}</span>
                            </div>
                            <span className="text-[8px] border rounded-full px-1.5 py-0.5 shrink-0 opacity-70 ml-2">
                              {emp.activeProjectsCount}/2 active
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  } else {
                    return (
                      <div className="text-center py-6 text-[10px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                        No more free employees available.
                      </div>
                    );
                  }
                }
              })()
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-50 dark:border-zinc-900">
            <button 
              type="button" 
              onClick={() => router.push("/dashboard/active-projects")}
              className="bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-bold py-2 px-6 rounded-lg text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-2 px-6 rounded-lg text-xs cursor-pointer shadow-xs transition-colors"
            >
              Initialize Workspace
            </button>
          </div>
        </form>
      </div>

      {/* Floating Toast Notification Center */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 px-4.5 py-3.5 rounded-xl shadow-lg border text-xs font-bold animate-in slide-in-from-bottom-5 duration-200 transition-all ${
              t.type === "success"
                ? "bg-zinc-950 border-zinc-800 text-white dark:bg-white dark:border-slate-200 dark:text-zinc-950"
                : t.type === "error"
                ? "bg-rose-50 border-rose-250 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400"
                : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-400"
            }`}
          >
            <span>{t.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
