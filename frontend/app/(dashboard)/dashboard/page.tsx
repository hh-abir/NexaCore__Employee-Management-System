"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingDown,
  Layers,
  ArrowRight,
  ShieldAlert,
  ChevronDown
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionLoading } = useSession();

  // Route security
  useEffect(() => {
    if (!sessionLoading && !sessionData) {
      router.push("/login");
    }
  }, [sessionData, sessionLoading, router]);

  if (sessionLoading) {
    return (
      <div className="flex-grow flex flex-col justify-center items-center bg-slate-50 dark:bg-zinc-950 font-sans min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-zinc-950 dark:border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-550 dark:text-zinc-400 font-semibold text-xs">Accessing NexaCore Vault...</p>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return null;
  }

  return (
    <div className="flex-grow flex flex-col space-y-6 animate-in fade-in duration-300 font-sans text-slate-900 dark:text-white transition-colors duration-150">
      
      {/* 1. Top Row (Hero & Stats) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Analytics Dashboard (Wide Hero Card) */}
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
              {/* Earnings */}
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

              {/* Expenses */}
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

          {/* Right: Flat Minimal Illustration Placeholder */}
          <div className="w-full sm:w-44 h-28 bg-slate-50 dark:bg-zinc-900/50 rounded-xl flex items-center justify-center border border-slate-100 dark:border-zinc-800 shrink-0">
            <svg className="w-20 h-20 text-slate-300 dark:text-zinc-700" viewBox="0 0 100 100" fill="currentColor">
              {/* Minimal desk and laptop shapes */}
              <rect x="15" y="65" width="70" height="4" rx="2" />
              <rect x="35" y="45" width="30" height="20" rx="1" />
              <line x1="50" y1="65" x2="50" y2="72" stroke="currentColor" strokeWidth="2" />
              <circle cx="50" cy="30" r="10" />
            </svg>
          </div>
        </div>

        {/* Right Stats: Two Square Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
          {/* Card 1: Weekly Sales */}
          <div className="bg-white dark:bg-zinc-900 border-none shadow-sm rounded-2xl p-5 flex flex-col justify-between h-[120px] relative text-left">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Weekly Sales</span>
                <h3 className="text-xl font-extrabold mt-1">$1,200.00</h3>
              </div>
              <div className="p-1.5 border border-slate-100 dark:border-zinc-800 rounded-full text-slate-400 dark:text-zinc-400 shrink-0">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className="inline-flex items-center text-[9px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                +12.4%
              </span>
              <button onClick={() => alert("Report loaded.")} className="text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-0.5 transition-colors cursor-pointer">
                See Report <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Card 2: Purchase Orders */}
          <div className="bg-white dark:bg-zinc-900 border-none shadow-sm rounded-2xl p-5 flex flex-col justify-between h-[120px] relative text-left">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Purchase Orders</span>
                <h3 className="text-xl font-extrabold mt-1">380</h3>
              </div>
              <div className="p-1.5 border border-slate-100 dark:border-zinc-800 rounded-full text-slate-400 dark:text-zinc-400 shrink-0">
                <Layers className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className="inline-flex items-center text-[9px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                +8.2%
              </span>
              <button onClick={() => alert("Report loaded.")} className="text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-0.5 transition-colors cursor-pointer">
                See Report <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Middle Row (Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Revenue Updates (Wide Bar Chart Card) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-950 rounded-2xl p-6 border-none shadow-sm flex flex-col justify-between h-[340px]">
          <div className="flex justify-between items-center pb-4 border-b border-slate-50 dark:border-zinc-900">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Revenue Updates</h3>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5">Yearly earnings comparison ledger</p>
            </div>

            {/* Timeframe dropdown select */}
            <button 
              onClick={() => alert("Filter reports time interval.")}
              className="flex items-center gap-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2 py-1.5 rounded-lg text-[9px] font-bold text-slate-500 dark:text-zinc-400 cursor-pointer"
            >
              <span>This year</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 flex-grow items-center">
            
            {/* Bar charts placeholder: alternating black and light gray bars (12 bars) */}
            <div className="md:col-span-3 h-48 flex items-end justify-between gap-2.5 px-2">
              {[70, 45, 90, 55, 80, 40, 95, 60, 85, 50, 75, 100].map((val, idx) => (
                <div 
                  key={idx} 
                  className={`w-full rounded-t-sm transition-opacity hover:opacity-85 ${
                    idx % 2 === 0 
                      ? "bg-zinc-950 dark:bg-white" 
                      : "bg-slate-200 dark:bg-zinc-800"
                  }`}
                  style={{ height: `${val}%` }} 
                />
              ))}
            </div>

            {/* Summary Legend (Right Side) */}
            <div className="md:col-span-1 space-y-4 pl-4 border-l border-slate-50 dark:border-zinc-900 text-left">
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">Direct Sales</span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">$8,450.00</span>
                <span className="text-[8px] font-bold text-slate-400 dark:text-zinc-500 block">60% Contribution</span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">Partner Channel</span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">$5,630.00</span>
                <span className="text-[8px] font-bold text-slate-400 dark:text-zinc-500 block">40% Contribution</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right: Monthly Earnings (Square Area Chart Card) */}
        <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border-none shadow-sm flex flex-col justify-between h-[340px] text-left">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Monthly Earnings</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-bold tracking-tight">$6,820.00</h3>
              <span className="inline-flex items-center text-[9px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 px-1.5 py-0.5 rounded-full">
                -2.1%
              </span>
            </div>
          </div>

          {/* Smooth wavy SVG path placeholder simulating area chart */}
          <div className="h-44 relative w-full pt-4 flex flex-col justify-between">
            <svg className="w-full h-36 overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
              <defs>
                <linearGradient id="zinc-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#18181b" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#18181b" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Fill area */}
              <path
                d="M0,35 C15,30 30,10 45,25 C60,40 75,5 100,20 L100,40 L0,40 Z"
                fill="url(#zinc-grad)"
              />
              {/* Wavy line */}
              <path
                d="M0,35 C15,30 30,10 45,25 C60,40 75,5 100,20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="text-zinc-950 dark:text-white"
              />
            </svg>
            <div className="flex justify-between text-[9px] font-bold text-slate-400 dark:text-zinc-500 border-t border-slate-100 dark:border-zinc-900 pt-2 px-1">
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
