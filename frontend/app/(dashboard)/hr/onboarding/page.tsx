"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";

export default function HrOnboardingPage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionLoading } = useSession();

  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  
  useEffect(() => {
    if (!sessionLoading) {
      if (!sessionData) {
        router.push("/login");
      } else if (sessionData.user.role !== "HR") {
        router.push("/"); 
      }
    }
  }, [sessionData, sessionLoading, router]);

  
  if (sessionLoading || !sessionData || sessionData.user.role !== "HR") {
    return (
      <div className="flex-grow flex flex-col justify-center items-center bg-slate-50 dark:bg-zinc-950 font-sans min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-zinc-950 dark:border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-zinc-400 font-semibold text-xs">Verifying HR Session...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    if (!name || !email || !role || !password) {
      setError("Please fill in all employee onboarding fields.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/hr/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, role, password }),
        credentials: "include", 
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to onboard employee.");
      }

      setSuccess(`Successfully onboarded employee ${data.user.name} (${data.user.email}) as a ${data.user.role}.`);
      // Reset form fields
      setName("");
      setEmail("");
      setRole("EMPLOYEE");
      setPassword("");
    } catch (err: any) {
      setError(err?.message || "An error occurred while creating the account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 dark:text-white transition-colors duration-150">
      <div className="w-full max-w-xl border border-slate-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 p-8 rounded-2xl text-left">
        
        {/* Header Block */}
        <div className="flex items-center gap-3.5 pb-6 border-b border-slate-100 dark:border-zinc-900">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white shrink-0 border border-slate-100 dark:border-zinc-800">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Onboard New Employee
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 font-bold uppercase tracking-wider">
              Provision starting credentials for a new staff member.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="pt-6 space-y-5">
          <div className="space-y-4">
            {success && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-500 rounded-lg flex items-start gap-2.5 text-xs animate-in fade-in duration-200 font-semibold">
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600 dark:text-emerald-500 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200/50 dark:border-rose-500/20 text-rose-800 dark:text-rose-500 rounded-lg flex items-start gap-2.5 text-xs animate-in fade-in duration-200 font-semibold">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600 dark:text-rose-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Full Name */}
            <div className="w-full">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 block">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Employee's Full Name"
                className="w-full border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 px-3.5 py-2 h-10 rounded-lg focus:bg-white dark:focus:bg-zinc-950 focus:border-zinc-950 dark:focus:border-white transition-all outline-none text-xs text-slate-900 dark:text-white font-semibold"
              />
            </div>

            {/* Email Address */}
            <div className="w-full">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 block">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employee.name@company.com"
                className="w-full border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 px-3.5 py-2 h-10 rounded-lg focus:bg-white dark:focus:bg-zinc-950 focus:border-zinc-950 dark:focus:border-white transition-all outline-none text-xs text-slate-900 dark:text-white font-semibold"
              />
            </div>

            {/* Default Password */}
            <div className="w-full">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 block">Default Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set starting secure password"
                className="w-full border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 px-3.5 py-2 h-10 rounded-lg focus:bg-white dark:focus:bg-zinc-950 focus:border-zinc-950 dark:focus:border-white transition-all outline-none text-xs text-slate-900 dark:text-white font-semibold"
              />
            </div>

            {/* Role Select Dropdown */}
            <div className="w-full">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 block">Organization Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-10 w-full border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 px-3.5 rounded-lg focus:bg-white dark:focus:bg-zinc-950 focus:border-zinc-950 dark:focus:border-white transition-all outline-none text-xs text-slate-900 dark:text-white font-bold cursor-pointer"
              >
                <option value="EMPLOYEE">Regular Employee</option>
                <option value="PROJECT_MANAGER">Project Manager</option>
                <option value="HR">HR / Administrator</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-6 border-t border-slate-100 dark:border-zinc-900">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-10 bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <div className="h-4 w-4 border-2 border-white dark:border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                "Onboard Employee"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
