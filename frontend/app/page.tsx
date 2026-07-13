"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import {
  Shield,
  Calendar,
  Layers,
  DollarSign,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Users,
  Briefcase,
  Clock,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  Zap,
  Activity,
  ArrowUpRight,
  Plus,
  HelpCircle,
  Check
} from "lucide-react";

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"HR" | "PM" | "EMPLOYEE">("HR");

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const features = [
    {
      title: "Role-Based Access Control",
      description: "Enforce company security with designated HR, PM, and Employee permissions and routes.",
      icon: Shield,
      tag: "Security"
    },
    {
      title: "Absence & Leave Workflows",
      description: "Submit leave requests with date ranges and categories. Handles PM and HR approval queues.",
      icon: Calendar,
      tag: "Operations"
    },
    {
      title: "Kanban Task Boards",
      description: "Create and track project tickets. Drag cards across stages and assign task owners.",
      icon: Layers,
      tag: "Collaboration"
    },
    {
      title: "Automated Salary Slips",
      description: "Generate monthly payslips based on base salary, check-in logs, and deduction formulas.",
      icon: DollarSign,
      tag: "Finance"
    },
    {
      title: "Project Chat Channels",
      description: "Collaborate via real-time WebSocket messaging restricted to assigned project team members.",
      icon: MessageSquare,
      tag: "Chat"
    },
    {
      title: "Performance Appraisals",
      description: "Track workforce performance reviews, dynamic ratings, and historical timelines.",
      icon: TrendingUp,
      tag: "Compliance"
    },
  ];

  const faqs = [
    {
      q: "Is NexaCore fully decoupled?",
      a: "Yes. The Next.js frontend runs entirely independently on port 3000 and communicates via REST API endpoints with the Express backend on port 5000."
    },
    {
      q: "How does the role-based middleware work?",
      a: "The Express API interceptors verify cookies sent with credentials. Requests are authenticated against Better Auth sessions and authorized against Prisma roles before hitting controllers."
    },
    {
      q: "Can employees register themselves?",
      a: "No. To maintain corporate compliance, public sign-ups are disabled. All employee accounts must be provisioned internally by an authorized HR administrator."
    }
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-150 ${
      darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      {/* Top Banner Control */}
      <div className={`w-full py-2.5 px-4 text-center text-xs font-semibold flex items-center justify-center gap-3 border-b transition-colors duration-150 ${
        darkMode ? "bg-slate-900 border-slate-800 text-slate-350" : "bg-slate-100 border-slate-200 text-slate-600"
      }`}>
        <span>Enterprise Portal Theme:</span>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded border shadow-xs text-xs font-bold transition-all ${
            darkMode 
              ? "bg-white border-slate-200 text-slate-950 hover:bg-slate-100" 
              : "bg-slate-900 border-slate-900 text-white hover:bg-slate-800"
          }`}
        >
          {darkMode ? (
            <>
              <Sun className="h-3 w-3 text-amber-500 fill-amber-500" />
              Light Mode
            </>
          ) : (
            <>
              <Moon className="h-3 w-3 text-indigo-400 fill-indigo-400" />
              Dark Mode
            </>
          )}
        </button>
      </div>

      <Navbar />

      <main className="flex-grow pt-16">
        
        {/* HERO SECTION */}
        <section className="py-20 md:py-28 border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              
              {/* Text Area */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  NexaCore Operating System v2.0
                </div>

                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight text-slate-900">
                  The central engine for <span className="text-slate-500">company operations.</span>
                </h1>

                <p className="text-sm sm:text-base leading-relaxed text-slate-550 max-w-xl">
                  A high-performance, decoupled SaaS platform designed to manage role authorizations, attendance logs, Kanban boards, chat channels, and monthly salary slip distributions.
                </p>

                {/* Dual CTAs */}
                <div className="flex flex-row items-center gap-3 pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 transition-colors duration-150 px-6 py-3 rounded-md shadow-xs gap-1"
                  >
                    Enter Workspace
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="#features"
                    className="inline-flex items-center justify-center text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors duration-150 px-6 py-3 rounded-md"
                  >
                    Explore Modules
                  </a>
                </div>

                {/* Symmetrical Badges */}
                <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-slate-550">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Better Auth Security
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Prisma Client Mappings
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Internal Provisioning
                  </div>
                </div>
              </div>

              {/* Symmetrical Mock UI Block (Right) */}
              <div className="lg:col-span-5 w-full max-w-lg mx-auto lg:max-w-none">
                <div className="rounded-xl border border-slate-200 p-6 bg-slate-50 text-slate-700 shadow-sm">
                  {/* Top bar header */}
                  <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200">
                    <div className="flex space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    </div>
                    <div className="px-2.5 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-mono tracking-wider font-bold text-slate-500">
                      LIVE WORKSPACE
                    </div>
                  </div>

                  {/* Mock content */}
                  <div className="space-y-4 font-sans">
                    {/* Live Metric Cards */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-white border border-slate-200 rounded-lg">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Staff</span>
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-1">
                          1,248
                          <span className="text-[8px] text-emerald-500 font-bold">+12%</span>
                        </div>
                      </div>

                      <div className="p-3 bg-white border border-slate-200 rounded-lg">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Projects</span>
                        <div className="text-sm font-bold text-slate-900">42</div>
                      </div>

                      <div className="p-3 bg-white border border-slate-200 rounded-lg">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Tasks</span>
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-1">
                          84
                          <span className="text-[8px] text-indigo-500 font-bold">65%</span>
                        </div>
                      </div>
                    </div>

                    {/* Attendance widget representation */}
                    <div className="p-3.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Attendance Log</p>
                          <p className="text-[9px] text-slate-400">Jane checked in at 09:12 AM</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-[9px] font-bold text-emerald-700">
                        Active
                      </span>
                    </div>

                    {/* Chat widget representation */}
                    <div className="p-3.5 bg-white border border-slate-200 rounded-lg flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200/50 flex items-center justify-center text-[9px] font-bold text-indigo-600 shrink-0">PM</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">Marcus Vance (PM)</p>
                        <p className="text-[10px] text-slate-500 truncate">Completed salary calculations checks.</p>
                      </div>
                      <span className="text-[8px] text-slate-400">Just now</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUSTED BY / SOCIAL PROOF */}
        <section className="py-10 border-b border-slate-200 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-6">
              Trusted by high-performance operations teams
            </span>
            <div className="flex flex-wrap items-center justify-center gap-12 grayscale opacity-55">
              <span className="text-sm font-extrabold text-slate-800 tracking-tight">APEX GLOBAL</span>
              <span className="text-sm font-extrabold text-slate-800 tracking-tight">MUNICH TECH</span>
              <span className="text-sm font-extrabold text-slate-800 tracking-tight">APEX CORP</span>
              <span className="text-sm font-extrabold text-slate-800 tracking-tight">WORKLY</span>
            </div>
          </div>
        </section>

        {/* INTERACTIVE WORKSPACE SHOWCASE */}
        <section id="solutions" className="py-20 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Interactive Showcase
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Adapts to every corporate role
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl mx-auto">
                Select a workspace role below to see how the dashboard dynamically adapts components and tools.
              </p>
            </div>

            {/* Selector Tabs */}
            <div className="flex justify-center mb-8">
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setActiveTab("HR")}
                  className={`px-6 py-2 rounded text-xs font-bold transition-all ${
                    activeTab === "HR" 
                      ? "bg-slate-900 text-white shadow-xs" 
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  HR Admin
                </button>
                <button
                  onClick={() => setActiveTab("PM")}
                  className={`px-6 py-2 rounded text-xs font-bold transition-all ${
                    activeTab === "PM" 
                      ? "bg-slate-900 text-white shadow-xs" 
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Project Manager
                </button>
                <button
                  onClick={() => setActiveTab("EMPLOYEE")}
                  className={`px-6 py-2 rounded text-xs font-bold transition-all ${
                    activeTab === "EMPLOYEE" 
                      ? "bg-slate-900 text-white shadow-xs" 
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Employee
                </button>
              </div>
            </div>

            {/* Showcase Cards */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 max-w-4xl mx-auto shadow-xs">
              {activeTab === "HR" && (
                <div className="grid md:grid-cols-2 gap-8 items-center animate-in fade-in duration-300">
                  <div className="space-y-4 text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      Core Administrator Control
                    </span>
                    <h3 className="text-xl font-bold text-slate-900">Provision & Audit Ledger</h3>
                    <p className="text-xs text-slate-550 leading-relaxed font-medium">
                      HR managers have full security clearance. Provision new employee logins via transactions, write global board alerts, process monthly payslips, and review loan advances.
                    </p>
                    <ul className="space-y-2 text-xs font-semibold text-slate-600">
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Onboard Employees</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Compile Salary PDF slips</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Resolve Grievances</li>
                    </ul>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span>Payroll Process Status</span>
                      <span className="text-emerald-600">Completed</span>
                    </div>
                    <div className="space-y-2.5">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-1.5 bg-slate-900 rounded-full" style={{ width: "100%" }} />
                      </div>
                      <p className="text-[10px] text-slate-400">1,248 accounts successfully processed.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "PM" && (
                <div className="grid md:grid-cols-2 gap-8 items-center animate-in fade-in duration-300">
                  <div className="space-y-4 text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-650 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      Manager Allocation console
                    </span>
                    <h3 className="text-xl font-bold text-slate-900">Task Boards & Appraisals</h3>
                    <p className="text-xs text-slate-550 leading-relaxed font-medium">
                      Project Managers organize localized team sprint workloads, drag tasks on the Kanban board, schedule booked meeting rooms, and execute stars evaluations.
                    </p>
                    <ul className="space-y-2 text-xs font-semibold text-slate-600">
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Project Allocations</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Drag-and-drop Kanban</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Team Performance Ratings</li>
                    </ul>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 text-left">
                    <h4 className="text-xs font-bold uppercase text-slate-400">Kanban Progress</h4>
                    <div className="space-y-3">
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold flex justify-between">
                        <span>Sprint Tasks Active</span>
                        <span className="text-indigo-600">84 Tickets</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold flex justify-between">
                        <span>Milestones Target</span>
                        <span className="text-slate-900">July 20</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "EMPLOYEE" && (
                <div className="grid md:grid-cols-2 gap-8 items-center animate-in fade-in duration-300">
                  <div className="space-y-4 text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-650 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                      Staff Self Service portal
                    </span>
                    <h3 className="text-xl font-bold text-slate-900">Check-in, Leaves & Loans</h3>
                    <p className="text-xs text-slate-550 leading-relaxed font-medium">
                      Employees clock in attendance daily, submit requests for WFH or annual leave, check monthly payslips, and collaborate on WebSocket project chat rooms.
                    </p>
                    <ul className="space-y-2 text-xs font-semibold text-slate-600">
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Daily Clock In/Out</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Submit WFH & Leaves</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Emergency Loan Applications</li>
                    </ul>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 text-left">
                    <h4 className="text-xs font-bold text-slate-900">My Leave Balance</h4>
                    <div className="flex justify-between items-baseline gap-2 pt-1">
                      <span className="text-2xl font-bold text-slate-900">14 Days</span>
                      <span className="text-[10px] text-slate-400 font-bold">Annual time off</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section id="features" className="py-20 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Platform Capabilities
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Engineered for corporate logistics
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl mx-auto">
                Explore the functional modules designed to handle resource coordination, financial workflows, and operational audits.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={idx}
                    className="p-8 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-slate-350 transition-all flex flex-col justify-between items-start"
                  >
                    <div>
                      <div className="p-2.5 rounded-lg bg-slate-100 text-slate-900 mb-6 w-fit">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
                        {feat.tag}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mb-2">
                        {feat.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        {feat.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3-TIER PRICING MATRIX */}
        <section id="pricing" className="py-20 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Corporate Plans
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Transparent packages for teams
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl mx-auto">
                Choose a plan tailored to your headcount requirements. Starter models feature full portal access.
              </p>
            </div>

            {/* Tiers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Tier 1 */}
              <div className="p-8 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between h-[420px]">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Starter</h3>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">For small growing offices</p>
                  </div>
                  <div className="text-3xl font-bold text-slate-900">
                    $49<span className="text-xs font-semibold text-slate-400"> / mo</span>
                  </div>
                  <ul className="space-y-2 text-xs font-medium text-slate-600">
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Up to 50 employees</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Basic check-in logs</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Leave applications</li>
                  </ul>
                </div>
                <button onClick={() => alert("Redirecting to starter checkout...")} className="w-full bg-white border border-slate-200 text-slate-900 font-bold py-2 rounded text-xs hover:bg-slate-50 transition-all cursor-pointer">
                  Get Started
                </button>
              </div>

              {/* Tier 2 (Highlighted) */}
              <div className="p-8 rounded-xl border border-slate-900 bg-slate-900 text-white flex flex-col justify-between h-[420px] relative shadow-md">
                <span className="absolute -top-3 right-6 bg-yellow-400 text-slate-900 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border border-yellow-300">
                  Popular
                </span>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Professional</h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">For mid-sized operations</p>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    $199<span className="text-xs font-semibold text-slate-400"> / mo</span>
                  </div>
                  <ul className="space-y-2 text-xs font-medium text-slate-300">
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-yellow-400" /> Up to 500 employees</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-yellow-400" /> Auto payroll PDF slips</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-yellow-400" /> Kanban board tracking</li>
                  </ul>
                </div>
                <button onClick={() => alert("Redirecting to professional checkout...")} className="w-full bg-yellow-400 text-slate-900 font-bold py-2 rounded text-xs hover:bg-yellow-500 transition-all cursor-pointer">
                  Choose Plan
                </button>
              </div>

              {/* Tier 3 */}
              <div className="p-8 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between h-[420px]">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Enterprise</h3>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">For large global corporations</p>
                  </div>
                  <div className="text-3xl font-bold text-slate-900">
                    $499<span className="text-xs font-semibold text-slate-400"> / mo</span>
                  </div>
                  <ul className="space-y-2 text-xs font-medium text-slate-600">
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Unlimited headcounts</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Audit financial loggers</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Dedicated support team</li>
                  </ul>
                </div>
                <button onClick={() => alert("Contacting sales team...")} className="w-full bg-white border border-slate-200 text-slate-900 font-bold py-2 rounded text-xs hover:bg-slate-50 transition-all cursor-pointer">
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* DETAILED FAQ ACCORDION */}
        <section className="py-20 bg-slate-50 border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">FAQ</span>
              <h2 className="text-2xl font-bold text-slate-900 mt-2">Common Queries</h2>
            </div>
            
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="p-5 bg-white border border-slate-200 rounded-lg text-left">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-slate-400 shrink-0" />
                    {faq.q}
                  </h4>
                  <p className="text-xs text-slate-550 mt-2 leading-relaxed font-medium pl-6">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION */}
        <section className="py-16 bg-white text-center space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Start Syncing Your Operations Today
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-medium pb-2">
            Provision staff profiles, process salary ledgers, and manage project workflows in a clean decoupled interface.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-8 rounded text-xs transition-all shadow-xs gap-1.5"
          >
            Access Portal
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

      </main>

      <Footer />
    </div>
  );
}
