"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Shield,
  Layers,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Users,
  Briefcase,
  MapPin,
  Medal,
  Activity,
  Database,
  Lock,
  Copy,
  Check,
  Sparkles,
  Server,
  RotateCw,
  AlertTriangle,
  X
} from "lucide-react";
import { useToast } from "@/components/Toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Home() {
  const { toast } = useToast();
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    // Landing page is strictly white light mode
    document.documentElement.classList.remove("dark");
  }, []);

  const handleCopy = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    toast.success(`Copied "${email}" to clipboard.`);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleResetAndSeed = async () => {
    setIsResetting(true);
    setShowConfirmModal(false);
    try {
      const res = await fetch(`${API_BASE_URL}/api/seed/reset-and-seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        toast.success("Database cleanly purged and re-seeded with Bangladeshi enterprise data!");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to reset and seed database.");
      }
    } catch (err) {
      console.error("Seed error:", err);
      toast.error("Could not reach backend API server. Make sure it is running.");
    } finally {
      setIsResetting(false);
    }
  };

  const demoAccounts = [
    {
      role: "HR Administrator",
      name: "Abir Hasan",
      email: "abir@nexacore.com",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: "Employee registration & Drive docs, BDT payroll, financial settlements, OpEx runway, labor compliance & notices."
    },
    {
      role: "Project Manager",
      name: "Arefin Ahmed",
      email: "arefin@nexacore.com",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      description: "PM Command Center, Dhaka Metro & Chaldal Kanban boards, split team chat, room bookings, star reviews & polls."
    },
    {
      role: "Lead Developer",
      name: "Abdullah Al Mamun",
      email: "mamun@nexacore.com",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      description: "BRAC University geofenced GPS check-in, sprint tickets, project chat, payslips, leaves, loans & diplomas."
    }
  ];

  const highlights = [
    {
      title: "Geofenced GPS Check-In",
      description: "Mathematical Haversine formula calculates coordinates against BRAC University campus (200m radius threshold).",
      icon: MapPin
    },
    {
      title: "Markdown Sprint Kanban",
      description: "Agile task pipeline with drag-and-drop stages, rich Markdown descriptions, and right-side flyout drawer.",
      icon: Layers
    },
    {
      title: "Digital Certificate Generator",
      description: "Automatic issuance of verifiable cryptographic certificates upon project settlement with printable diplomas.",
      icon: Medal
    },
    {
      title: "Automated Payroll & Slips",
      description: "Calculates monthly gross-to-net salaries with bonuses and deductions, rendering print-ready A4 payslips.",
      icon: DollarSign
    },
    {
      title: "HR OpEx & Financial Runway",
      description: "Confidential corporate expenditure ledger tracking Cloud, SaaS, Hardware, and Capital Runway.",
      icon: Activity
    },
    {
      title: "Slack-Style Project Chat",
      description: "Real-time communication channels (#general, #sprint-updates, #deployments) scoped to assigned team members.",
      icon: Users
    }
  ];

  const techStack = [
    { name: "Next.js 16 (App Router)", tag: "Frontend" },
    { name: "Node.js & Express (TypeScript)", tag: "Backend API" },
    { name: "Prisma ORM & MongoDB Atlas", tag: "Database" },
    { name: "Better-Auth (RBAC)", tag: "Authentication" },
    { name: "Tailwind CSS v4", tag: "Styling" },
    { name: "Lucide Icons", tag: "Assets" }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans transition-colors duration-150">
      <Navbar />

      <main className="flex-grow pt-20">
        {/* Hero Section */}
        <section className="py-16 sm:py-24 border-b border-slate-100 bg-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
              NexaCore <span className="text-slate-400">&bull;</span> Employee Management System
            </h1>

            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              A full-stack, decoupled enterprise operations and workforce platform built with <strong>Next.js</strong>, <strong>Express TypeScript</strong>, <strong>Prisma ORM</strong>, and <strong>Better-Auth</strong>.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl text-xs transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Enter Portal / Login</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#demo-accounts"
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold px-5 py-3 rounded-xl text-xs transition-all cursor-pointer"
              >
                View Test Credentials
              </a>
            </div>

          </div>
        </section>

        {/* Demo Test Accounts */}
        <section id="demo-accounts" className="py-16 border-b border-slate-100 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Presentation Access</span>
              <h2 className="text-2xl font-bold text-slate-900">Role-Based Test Accounts</h2>
              <p className="text-xs text-slate-500">
                Universal password for all accounts: <strong className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-900">Password123</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {demoAccounts.map((acc, idx) => (
                <div 
                  key={idx} 
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${acc.badgeClass}`}>
                        {acc.role}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">{acc.name}</h3>
                      <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100 mt-1">
                        <span className="text-xs font-mono font-bold text-slate-600 truncate">
                          {acc.email}
                        </span>
                        <button
                          onClick={() => handleCopy(acc.email)}
                          className="p-1 text-slate-400 hover:text-slate-900 cursor-pointer"
                          title="Copy email"
                        >
                          {copiedEmail === acc.email ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {acc.description}
                    </p>
                  </div>

                  <Link
                    href="/login"
                    className="w-full text-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Sign In as {acc.role.split(" ")[0]}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Key Functional Modules */}
        <section className="py-16 border-b border-slate-100 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Core Architecture</span>
              <h2 className="text-2xl font-bold text-slate-900">Key Functional Modules</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-left">
              {highlights.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={idx} 
                    className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2.5 shadow-xs hover:border-slate-300 transition-all"
                  >
                    <div className="p-2 rounded-xl bg-slate-50 text-indigo-600 w-fit border border-slate-100 shadow-xs">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-extrabold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* Tech Stack */}
        <section className="py-14 bg-white text-center border-b border-slate-100">
          <div className="max-w-4xl mx-auto px-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-6">
              Implemented Tech Stack
            </span>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {techStack.map((tech, idx) => (
                <div 
                  key={idx}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-xs flex items-center gap-2"
                >
                  <span>{tech.name}</span>
                  <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                    {tech.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Database Quick Reset & Seeder Section */}
        <section className="py-16 bg-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xs space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Database className="h-3.5 w-3.5" />
                <span>One-Click Database Management</span>
              </div>

              <div className="space-y-2 max-w-2xl mx-auto">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Reset & Load Bangladeshi Demo Data
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Instantly purge all collections and populate all 16 modules with comprehensive Bangladeshi context data: Dhaka Metro RapidPass API, bKash & Nagad MFS, Chaldal Cold-Chain Logistics, BRAC Microfinance, BRAC University GPS check-ins, BDT payroll, and Provident Fund loans.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isResetting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-2xl text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {isResetting ? (
                    <>
                      <RotateCw className="h-4 w-4 animate-spin" />
                      <span>Purging & Seeding Database...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Reset Database & Load Bangladeshi Demo Data</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-[11px] text-slate-400 font-semibold">
                Provisioned Users: <strong>abir@nexacore.com</strong> (HR) &bull; <strong>arefin@nexacore.com</strong> (PM) &bull; <strong>mamun@nexacore.com</strong> (Dev) &bull; Password: <strong>Password123</strong>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Confirmation Safety Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">Confirm Database Reset</h3>
              </div>
              <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              This will completely wipe all current database collections and re-seed the system with fresh Bangladeshi context projects, Kanban tasks, geofenced attendance logs, leaves, BDT payroll, and demo accounts.
            </p>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="bg-slate-100 text-slate-600 font-bold py-2 px-4 rounded-xl text-xs cursor-pointer hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetAndSeed}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95"
              >
                <Database className="h-4 w-4" />
                <span>Confirm & Reset Database</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
