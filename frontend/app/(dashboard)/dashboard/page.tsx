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
  Users
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionLoading } = useSession();

  
  useEffect(() => {
    if (!sessionLoading && !sessionData) {
      router.push("/login");
    }
  }, [sessionData, sessionLoading, router]);

  if (sessionLoading || !sessionData) return null;

  return (
    <div className="flex-grow flex flex-col space-y-6 font-sans text-slate-900 dark:text-white transition-colors duration-150">
      
      {}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-left">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
            Unified workspace manager
          </p>
        </div>
      </div>

      {}
      {}
      {}
      <div className="space-y-6">
        {}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-950 rounded-2xl p-6 border-none shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="space-y-4 text-left">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                  Dashboard Overview
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  Analytics Dashboard
                </h2>
              </div>

              <div className="flex items-center gap-8 pt-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Earnings</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold">$14,248.00</span>
                    <span className="inline-flex items-center text-[9px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                      +3.3%
                    </span>
                  </div>
                </div>

                <div className="w-px h-10 bg-slate-100 dark:bg-zinc-900" />

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Expenses</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold">$4,102.50</span>
                    <span className="inline-flex items-center text-[9px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 px-1.5 py-0.5 rounded-full">
                      -1.5%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {}
            <div className="flex flex-col gap-2.5 w-full sm:w-auto">
              <button 
                onClick={() => router.push("/dashboard/active-projects")}
                className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-2.5 px-5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <span>View Workspace Directory</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              
              {sessionData.user.role === "HR" && (
                <button 
                  onClick={() => router.push("/dashboard/create-project")}
                  className="bg-slate-100 hover:bg-slate-150 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-900 dark:text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
                >
                  <span>Initialize New Workspace</span>
                </button>
              )}
            </div>
          </div>

          {}
          <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border-none shadow-sm flex flex-col justify-between text-left h-[180px]">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                Attendance Tracking
              </span>
              <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
                Clock Console
              </h3>
            </div>
            
            <div className="flex gap-3 mt-4">
              <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-xs cursor-pointer shadow-xs transition-colors">
                Clock In
              </button>
              <button className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-550 dark:text-zinc-400 font-bold py-2 px-3 rounded-lg text-xs cursor-pointer transition-colors">
                Clock Out
              </button>
            </div>
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {}
          <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border-none shadow-sm text-left flex flex-col justify-between h-[280px]">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-zinc-900">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                  Workspaces
                </h3>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">Overview</span>
              </div>
              <p className="text-xs text-slate-550 dark:text-zinc-400 leading-relaxed font-medium">
                Click on the Workspace Directory button to inspect active projects, view project task boards, and chat with team members inside communication channels.
              </p>
            </div>

            <button 
              onClick={() => router.push("/dashboard/active-projects")}
              className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold py-2 px-4 rounded-lg text-xs cursor-pointer transition-colors text-center"
            >
              Go to Workspace Directory
            </button>
          </div>

          {}
          <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border-none shadow-sm text-left flex flex-col justify-between h-[280px]">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-zinc-900">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                  Analytics
                </h3>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">Monthly</span>
              </div>
              <p className="text-xs text-slate-550 dark:text-zinc-400 leading-relaxed font-medium">
                Financial performance, monthly operations run-rate, and allocated project budgets statistics metrics.
              </p>
            </div>

            {}
            <div className="h-28 bg-slate-50/50 dark:bg-zinc-900/50 rounded-xl p-3 flex items-end justify-between relative overflow-hidden">
              <div className="w-8 bg-zinc-900/10 dark:bg-white/10 h-1/4 rounded-t-sm" />
              <div className="w-8 bg-zinc-900/10 dark:bg-white/10 h-2/5 rounded-t-sm" />
              <div className="w-8 bg-zinc-900/10 dark:bg-white/10 h-1/2 rounded-t-sm" />
              <div className="w-8 bg-zinc-900 dark:bg-white h-full rounded-t-sm" />
              <span className="absolute top-2 right-3 text-[8px] font-extrabold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active Run-rate Peak
              </span>
            </div>
          </div>

          {}
          <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border-none shadow-sm text-left flex flex-col justify-between h-[280px]">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-zinc-900">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  System Notifications
                </h3>
                <button className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Clear</button>
              </div>

              <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 border-l-2 border-indigo-500 pl-2 py-0.5">
                  <p className="text-slate-950 dark:text-white font-bold leading-normal">Welcome to NexaCore Dashboard!</p>
                  <span className="text-[9px] opacity-75 font-bold">1 minute ago</span>
                </div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 border-l-2 border-slate-200 dark:border-zinc-800 pl-2 py-0.5">
                  <p className="text-slate-950 dark:text-white font-bold leading-normal">System initialized and database connected.</p>
                  <span className="text-[9px] opacity-75 font-bold">1 hour ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
