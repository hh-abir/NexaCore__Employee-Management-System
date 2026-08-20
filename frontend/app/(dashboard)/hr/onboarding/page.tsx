"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { 
  UserPlus, 
  Users, 
  ShieldCheck, 
  Briefcase, 
  Building, 
  DollarSign, 
  Phone, 
  Key, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Mail, 
  User, 
  Layers, 
  ChevronRight,
  BadgeCheck
} from "lucide-react";
import { useToast } from "@/components/Toast";

interface EmployeeRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  designation?: string;
  phone?: string;
  createdAt: string;
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

export default function HrOnboardingPage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionLoading } = useSession();
  const { toast } = useToast();

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [password, setPassword] = useState("Password123");
  const [department, setDepartment] = useState("Engineering");
  const [designation, setDesignation] = useState("Software Engineer");
  const [phone, setPhone] = useState("");
  const [salary, setSalary] = useState("4500");

  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Directory filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  useEffect(() => {
    if (!sessionLoading) {
      if (!sessionData) {
        router.push("/login");
      } else if (sessionData.user.role !== "HR") {
        toast.error("Access restricted to HR Administrators.");
        router.push("/dashboard");
      }
    }
  }, [sessionData, sessionLoading, router]);

  useEffect(() => {
    if (sessionData && sessionData.user.role === "HR") {
      fetchEmployees();
    }
  }, [sessionData]);

  const fetchEmployees = async () => {
    setLoadingList(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/hr/employees`, {
        credentials: "include"
      });
      if (res.ok) {
        const json = await safeJson(res);
        setEmployees(json.employees || []);
      }
    } catch (err) {
      console.error("Fetch employees error:", err);
    } finally {
      setLoadingList(false);
    }
  };

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pwd);
    toast.success("Generated strong 12-character security password.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill in name, corporate email, and password.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/hr/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          role,
          password: password.trim(),
          department,
          designation: designation.trim(),
          phone: phone.trim() || undefined,
          salary: salary ? parseFloat(salary) : undefined
        }),
        credentials: "include",
      });

      const data = await safeJson(response);

      if (!response.ok) {
        throw new Error(data.error || "Failed to onboard employee.");
      }

      toast.success(`Successfully provisioned account for ${data.user.name}!`);
      
      // Reset fields
      setName("");
      setEmail("");
      setPhone("");
      setPassword("Password123");
      setSalary("4500");
      
      // Refresh directory
      fetchEmployees();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create employee account.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered staff list
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (roleFilter !== "ALL" && emp.role !== roleFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = emp.name?.toLowerCase().includes(q);
        const matchEmail = emp.email?.toLowerCase().includes(q);
        const matchDept = emp.department?.toLowerCase().includes(q);
        const matchDesig = emp.designation?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchDept && !matchDesig) return false;
      }
      return true;
    });
  }, [employees, roleFilter, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: employees.length,
      employees: employees.filter(e => e.role === "EMPLOYEE").length,
      managers: employees.filter(e => e.role === "PROJECT_MANAGER").length,
      hr: employees.filter(e => e.role === "HR").length,
    };
  }, [employees]);

  if (sessionLoading || !sessionData || sessionData.user.role !== "HR") return null;

  return (
    <div className="flex-grow flex flex-col space-y-6 font-sans text-slate-900 dark:text-white transition-colors duration-150 text-left">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Staff Provisioning & Onboarding Suite</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-indigo-500/20 flex items-center gap-1">
              <BadgeCheck className="h-3 w-3" />
              HR Portal
            </span>
          </h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
            Provision corporate logins, assign organizational hierarchy & baseline compensation
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchEmployees}
            disabled={loadingList}
            className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer shadow-xs transition-all"
            title="Refresh Directory"
          >
            <RefreshCw className={`h-4 w-4 ${loadingList ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Total Staff Roster</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats.total}</span>
            <Users className="h-6 w-6 text-indigo-500 opacity-75" />
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">Active Corporate Accounts</div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Software Engineers</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{stats.employees}</span>
            <Building className="h-6 w-6 text-blue-500 opacity-75" />
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">Developers & Designers</div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Project Managers</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{stats.managers}</span>
            <Briefcase className="h-6 w-6 text-amber-500 opacity-75" />
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">Sprint Leads & Scrum Masters</div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">HR Administrators</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.hr}</span>
            <ShieldCheck className="h-6 w-6 text-emerald-500 opacity-75" />
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">Governance & People Ops</div>
        </div>
      </div>

      {/* Main 2-Column Split: Provisioning Suite & Staff Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Onboarding Form (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-zinc-900">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                New Employee Provisioning Console
              </h2>
              <p className="text-[11px] text-slate-400 font-semibold">
                Set credentials, organization role, and compensation baseline
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Step 1: Personal & Account Identity */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                1. Account Credentials & Role
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                    Full Name *
                  </label>
                  <div className="relative flex items-center bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2">
                    <User className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Abir Hasan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-transparent text-xs outline-none text-slate-900 dark:text-white w-full font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                    Corporate Email *
                  </label>
                  <div className="relative flex items-center bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. abir.hasan@nexacore.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-transparent text-xs outline-none text-slate-900 dark:text-white w-full font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                    Organization Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold outline-none cursor-pointer"
                  >
                    <option value="EMPLOYEE">Software Engineer / Designer / QA (Employee)</option>
                    <option value="PROJECT_MANAGER">Project Manager (PM)</option>
                    <option value="HR">HR Administrator</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block">
                      Default Password *
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Sparkles className="h-2.5 w-2.5" /> Auto-Generate
                    </button>
                  </div>
                  <div className="relative flex items-center bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2">
                    <Key className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-transparent text-xs outline-none text-slate-900 dark:text-white w-full font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Department & Designation */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                2. Department & Designation
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                    Business Department *
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold outline-none cursor-pointer"
                  >
                    <option value="Engineering">Engineering & Development</option>
                    <option value="Product">Product Management</option>
                    <option value="Design">UI/UX & Product Design</option>
                    <option value="Infrastructure">Cloud Infrastructure & DevOps</option>
                    <option value="Quality Assurance">Quality Assurance (QA)</option>
                    <option value="Marketing">Growth & Marketing</option>
                    <option value="Human Resources">Human Resources & Governance</option>
                    <option value="Finance">Finance & Accounting</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                    Job Title / Designation *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Full-Stack Architect"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                    Contact Phone Number
                  </label>
                  <div className="relative flex items-center bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      placeholder="+880 1711-000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-transparent text-xs outline-none text-slate-900 dark:text-white w-full font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                    Starting Base Salary ($ USD / mo)
                  </label>
                  <div className="relative flex items-center bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2">
                    <DollarSign className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
                    <input
                      type="number"
                      step="100"
                      placeholder="e.g. 5200"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      className="bg-transparent text-xs outline-none text-slate-900 dark:text-white w-full font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-900 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-2.5 px-6 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Provision & Onboard Staff Member</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Right Column: Live Roster & Search Directory (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-4 flex flex-col justify-between">
          
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-500" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  Corporate Staff Directory
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">
                {filteredEmployees.length} Members
              </span>
            </div>

            {/* Search Input */}
            <div className="relative flex items-center bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2">
              <Search className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search staff by name, email, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs outline-none text-slate-900 dark:text-white w-full font-medium"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl gap-1 text-[10px] font-bold overflow-x-auto">
              {[
                { id: "ALL", label: "All Roles" },
                { id: "EMPLOYEE", label: "Engineers" },
                { id: "PROJECT_MANAGER", label: "Managers" },
                { id: "HR", label: "HR" },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setRoleFilter(f.id)}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    roleFilter === f.id
                      ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Directory List Scroll Area */}
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {loadingList ? (
                <div className="py-16 text-center text-xs text-slate-400 font-bold">Loading staff directory...</div>
              ) : filteredEmployees.length > 0 ? (
                filteredEmployees.map(emp => (
                  <div
                    key={emp.id}
                    className="p-3 bg-slate-50/70 dark:bg-zinc-900/40 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-850 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-400 shrink-0">
                        {emp.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{emp.name}</span>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded ${
                            emp.role === "HR" 
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                              : emp.role === "PROJECT_MANAGER"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400"
                          }`}>
                            {emp.role === "PROJECT_MANAGER" ? "PM" : emp.role}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{emp.email}</div>
                        <div className="text-[9px] text-slate-500 font-semibold">{emp.designation || emp.department || "Engineering"}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 font-bold">
                  No staff members matching search criteria.
                </div>
              )}
            </div>

          </div>

          <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 text-[10px] text-slate-400 font-semibold text-center">
            Accounts provisioned here receive immediate credential login access.
          </div>

        </div>

      </div>

    </div>
  );
}
