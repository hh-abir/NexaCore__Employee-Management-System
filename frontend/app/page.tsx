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
  Check,
  Medal,
  CreditCard,
  Building,
  Vote,
  DoorOpen,
  ShieldCheck,
  FileText,
  Search,
  Lock,
  ChevronDown,
  MapPin
} from "lucide-react";

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"HR" | "PM" | "EMPLOYEE">("HR");
  const [featureCategory, setFeatureCategory] = useState<string>("ALL");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [simCertCode, setSimCertCode] = useState("NEXA-CERT-2026-8812");
  const [certVerified, setCertVerified] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const allModules = [
    {
      id: 1,
      category: "OPERATIONS",
      title: "Account Security & 2FA Suite",
      description: "Profile customization, password management, session monitoring, and 2FA authentication controls.",
      icon: Shield,
      tag: "Security"
    },
    {
      id: 2,
      category: "OPERATIONS",
      title: "Role-Based Access Control",
      description: "Strict RBAC security across HR, Project Manager, and Software Engineer roles via Better-Auth sessions.",
      icon: Lock,
      tag: "RBAC"
    },
    {
      id: 3,
      category: "OPERATIONS",
      title: "Employee Onboarding Hub",
      description: "Fast-track staff provisioning, department allocation, designation hierarchy, and base compensation setup.",
      icon: Users,
      tag: "HR Suite"
    },
    {
      id: 4,
      category: "ATTENDANCE",
      title: "Leave Management Ledger",
      description: "Vacation, sick, and emergency leave requests with automated multi-tier approval queues.",
      icon: Calendar,
      tag: "Leave"
    },
    {
      id: 5,
      category: "ATTENDANCE",
      title: "Remote Work (WFH) Planner",
      description: "Single-day and recurring work-from-home tracking with live company calendar synchronization.",
      icon: Building,
      tag: "Remote"
    },
    {
      id: 6,
      category: "ATTENDANCE",
      title: "Geofenced Check-In Radar",
      description: "200m Haversine radius validation at BRAC University campus with precision punctuality logs.",
      icon: MapPin,
      tag: "Geofencing"
    },
    {
      id: 7,
      category: "FINANCE",
      title: "Payroll & Payslip PDF Engine",
      description: "Monthly compensation calculations, milestone bonus payouts, deductions, and print-ready A4 slips.",
      icon: DollarSign,
      tag: "Payroll"
    },
    {
      id: 8,
      category: "FINANCE",
      title: "Company Loan Assistance",
      description: "Emergency loan applications, monthly installment calculators, and HR approval governance.",
      icon: CreditCard,
      tag: "Relief"
    },
    {
      id: 9,
      category: "OPERATIONS",
      title: "360° Performance Appraisals",
      description: "Quarterly review scorecards (1 to 5 rating), structured manager feedback, and rating analytics.",
      icon: TrendingUp,
      tag: "Reviews"
    },
    {
      id: 10,
      category: "OPERATIONS",
      title: "Confidential Grievance Portal",
      description: "Anonymous incident reporting, urgency classification, and HR resolution documentation.",
      icon: ShieldCheck,
      tag: "Compliance"
    },
    {
      id: 11,
      category: "SPRINTS",
      title: "Project Workspace & Budgeting",
      description: "Multi-category project initialization, budget allocations, and automated PM activation alerts.",
      icon: Briefcase,
      tag: "Projects"
    },
    {
      id: 12,
      category: "SPRINTS",
      title: "Markdown Sprint Kanban Board",
      description: "Drag-and-drop task pipeline, rich Markdown specifications, and right-side interactive task drawer.",
      icon: Layers,
      tag: "Kanban"
    },
    {
      id: 13,
      category: "SPRINTS",
      title: "Slack-Style Project Channels",
      description: "Real-time communication channels (#general, #announcements, #technical) with persistent chat streams.",
      icon: MessageSquare,
      tag: "Chat"
    },
    {
      id: 14,
      category: "OPERATIONS",
      title: "Meeting Room Reservations",
      description: "Corporate suites catalog with single-booking concurrency limits and calendar hooks.",
      icon: DoorOpen,
      tag: "Facilities"
    },
    {
      id: 15,
      category: "OPERATIONS",
      title: "Personalized Company Calendar",
      description: "Unified view of Holidays, Project Deadlines, Task Due Dates, Leaves/WFH, and Room Meetings.",
      icon: Calendar,
      tag: "Schedule"
    },
    {
      id: 16,
      category: "OPERATIONS",
      title: "Pulse Polls & Surveys",
      description: "Company-wide & project-sprint live voting with real-time percentage distribution bars.",
      icon: Vote,
      tag: "Surveys"
    },
    {
      id: 17,
      category: "OPERATIONS",
      title: "Real-Time Notification Center",
      description: "Role-based and user-targeted notifications for project assignments, approvals, and payouts.",
      icon: Sparkles,
      tag: "Alerts"
    },
    {
      id: 18,
      category: "SPRINTS",
      title: "Digital Certificate Generator",
      description: "Verifiable credentials (NEXA-CERT-XXXX), automatic project completion issuance, and printable diplomas.",
      icon: Medal,
      tag: "Credentials"
    },
    {
      id: 19,
      category: "FINANCE",
      title: "Corporate OpEx & Runway Ledger",
      description: "HR-confidential expenditure tracker (Cloud, SaaS, Hardware, Facilities), burn rate, and runway metrics.",
      icon: FileText,
      tag: "OpEx"
    },
    {
      id: 20,
      category: "FINANCE",
      title: "Visual Analytics Dashboard",
      description: "Chart.js interactive BI charts for 6-month payroll, 7-day attendance heatmap, and sprint velocity.",
      icon: Activity,
      tag: "Analytics"
    }
  ];

  const filteredModules = featureCategory === "ALL" 
    ? allModules 
    : allModules.filter(m => m.category === featureCategory);

  const faqs = [
    {
      q: "How does NexaCore enforce Role-Based Access Control (RBAC)?",
      a: "NexaCore utilizes Better-Auth with custom role schema hooks and Express roleGuard middlewares. Users are categorized as HR, Project Manager, or Software Engineer, with strict route protection on both backend controllers and Next.js frontend pages."
    },
    {
      q: "How does Geofenced Attendance work?",
      a: "The attendance module queries the device's HTML5 Geolocation coordinates and computes the exact distance against the corporate campus (BRAC University: Lat 23.7749, Lng 90.4255) using the mathematical Haversine formula. Check-in is granted only within the 200-meter radius."
    },
    {
      q: "Are corporate financial and OpEx ledgers protected?",
      a: "Yes. Company Finance Management and Visual Analytics are strictly restricted to HR administrators with backend 403 authorization gates and frontend client-side redirects."
    },
    {
      q: "How does automated Project Certificate generation function?",
      a: "When an HR administrator approves the final project settlement, cryptographic verifiable certificates (e.g. NEXA-CERT-XXXX) are automatically generated for all team members, complete with landscape printable diploma formats."
    }
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-150 ${
      darkMode ? "bg-zinc-950 text-white" : "bg-slate-50 text-slate-900"
    }`}>
      
      {/* Top Banner Control */}
      <div className={`w-full py-2 px-4 text-center text-xs font-semibold flex items-center justify-between sm:justify-center gap-3 border-b transition-colors duration-150 ${
        darkMode ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-slate-100 border-slate-200 text-slate-600"
      }`}>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold">NexaCore Enterprise System v3.0 — 20 Production Modules Live</span>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shadow-xs text-[11px] font-bold transition-all cursor-pointer ${
            darkMode 
              ? "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700" 
              : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"
          }`}
        >
          {darkMode ? (
            <>
              <Sun className="h-3 w-3 text-amber-400 fill-amber-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="h-3 w-3 text-indigo-500 fill-indigo-500" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      <Navbar />

      <main className="flex-grow pt-16">
        
        {/* ======================================================== */}
        {/* HERO SECTION WITH GLOWING ACCENTS & LIVE DASHBOARD MOCKUP */}
        {/* ======================================================== */}
        <section className={`relative py-20 md:py-32 border-b overflow-hidden ${
          darkMode ? "bg-zinc-950 border-zinc-900" : "bg-white border-slate-200"
        }`}>
          {/* Ambient Glow Gradients */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-500/10 via-blue-500/15 to-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Next-Gen Enterprise Workforce & Sprint Platform</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-white">
                Where high-velocity teams <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  coordinate, execute & scale.
                </span>
              </h1>

              <p className="text-sm sm:text-lg leading-relaxed text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto font-normal">
                A unified operating system combining Geofenced Attendance, Markdown Kanban Sprints, Automated Payroll Slips, HR OpEx Management, and Cryptographic Digital Credentials.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition-all px-7 py-3.5 rounded-xl shadow-md gap-2 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>Launch Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#modules"
                  className="w-full sm:w-auto inline-flex items-center justify-center text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 transition-all px-6 py-3.5 rounded-xl cursor-pointer"
                >
                  Explore 20 Modules
                </a>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-bold text-slate-550 dark:text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Better-Auth RBAC</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Prisma MongoDB Engine</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Chart.js Visual BI</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>React 19 Decoupled</span>
                </div>
              </div>

            </div>

            {/* LIVE DASHBOARD CANVAS MOCKUP */}
            <div className="mt-14 max-w-5xl mx-auto rounded-3xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/60 p-3 sm:p-5 shadow-2xl backdrop-blur-md">
              {/* Window Header */}
              <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-200 dark:border-zinc-800">
                <div className="flex space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="px-3 py-0.5 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[10px] font-mono font-bold text-slate-600 dark:text-zinc-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  NEXACORE LIVE PRODUCTION INSTANCE
                </div>
                <div className="text-[10px] font-bold text-slate-400">LAT: 23.7749 &bull; LNG: 90.4255</div>
              </div>

              {/* Mock Dashboard Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left font-sans">
                
                {/* Card 1: Geofenced Attendance Radar */}
                <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-850 space-y-3 shadow-xs">
                  <div className="flex justify-between items-center text-xs font-extrabold">
                    <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <MapPin className="h-4 w-4" /> Geofenced Radar
                    </span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 font-extrabold px-2 py-0.5 rounded-full">
                      200m Radius Match
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-500">BRAC University Campus</span>
                      <span className="text-emerald-600 font-mono">09:14 AM</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      Status: <strong className="text-slate-900 dark:text-white">On-Time Checked In</strong>
                    </div>
                  </div>
                </div>

                {/* Card 2: Kanban Sprint Pipeline */}
                <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-850 space-y-3 shadow-xs">
                  <div className="flex justify-between items-center text-xs font-extrabold">
                    <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                      <Layers className="h-4 w-4" /> Sprint Kanban
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">14 Live Tasks</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl flex justify-between items-center text-[11px] font-bold">
                      <span>#NEXA-88: Auth Token Refresh</span>
                      <span className="text-[9px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded font-black">TESTING</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: "75%" }} />
                    </div>
                  </div>
                </div>

                {/* Card 3: OpEx & Capital Runway */}
                <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-850 space-y-3 shadow-xs">
                  <div className="flex justify-between items-center text-xs font-extrabold">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <DollarSign className="h-4 w-4" /> OpEx & Runway
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">Q3 2026</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1">
                    <div>
                      <div className="text-xl font-black text-slate-900 dark:text-white">$217,300</div>
                      <span className="text-[9px] text-slate-400 font-bold">Total Liquidity Reserve</span>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      4.2 Mo Runway
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* ======================================================== */}
        {/* INTERACTIVE ROLE EXPERIENCE SHOWCASE                     */}
        {/* ======================================================== */}
        <section id="solutions" className={`py-24 border-b ${
          darkMode ? "bg-zinc-900/50 border-zinc-900" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Tailored Organizational Workflows
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Engineered for Every Corporate Role
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto">
                Toggle roles below to preview the customized toolsets and operational dashboards available to each user group.
              </p>
            </div>

            {/* Role Switcher */}
            <div className="flex justify-center mb-10">
              <div className="flex bg-slate-200/70 dark:bg-zinc-900 p-1.5 rounded-2xl gap-1 border border-slate-300/60 dark:border-zinc-800">
                {[
                  { id: "HR", label: "HR Administrator", icon: Shield },
                  { id: "PM", label: "Project Manager", icon: Briefcase },
                  { id: "EMPLOYEE", label: "Software Engineer", icon: Users }
                ].map(r => {
                  const Icon = r.icon;
                  const isActive = activeTab === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setActiveTab(r.id as any)}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        isActive
                          ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-md"
                          : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Role Card */}
            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-3xl p-8 sm:p-10 max-w-5xl mx-auto shadow-sm">
              {activeTab === "HR" && (
                <div className="grid md:grid-cols-2 gap-8 items-center text-left animate-in fade-in duration-300">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      Organizational Governance & Finance
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                      Full Staff Audit & Executive Command
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                      HR administrators hold top clearance across onboarding pipelines, salary slip compiling, loan reviews, grievance investigations, company-wide pulse surveys, and confidential OpEx budget tracking.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700 dark:text-zinc-300">
                      <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Employee Onboarding</div>
                      <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Automated Payslip Engine</div>
                      <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> OpEx Ledger & Runway</div>
                      <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Grievance Resolution</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-zinc-900/60 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold pb-2 border-b border-slate-200 dark:border-zinc-800">
                      <span>Monthly Payroll Execution</span>
                      <span className="text-emerald-600 font-extrabold">100% Processed</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">August 2026 Batch</span>
                        <span>$45,000 Total Outlay</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%" }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "PM" && (
                <div className="grid md:grid-cols-2 gap-8 items-center text-left animate-in fade-in duration-300">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      Sprint Velocity & Deliverables
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                      PM Command Center & Kanban Workspace
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                      Project Managers manage localized agile sprint lifecycles, assign Markdown tickets, schedule corporate meeting rooms with collision prevention, conduct 360° star evaluations, and launch sprint surveys.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700 dark:text-zinc-300">
                      <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> PM Command Dashboard</div>
                      <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Markdown Sprint Board</div>
                      <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Team Star Reviews</div>
                      <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Room Concurrency Limits</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-zinc-900/60 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold pb-2 border-b border-slate-200 dark:border-zinc-800">
                      <span>Project Sprint Velocity</span>
                      <span className="text-indigo-600 font-extrabold">Active Delivery</span>
                    </div>
                    <div className="space-y-2.5">
                      <div className="p-3 bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 flex justify-between text-xs font-bold">
                        <span>Autonomous Task Queue</span>
                        <span className="text-amber-600">84% Velocity</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "EMPLOYEE" && (
                <div className="grid md:grid-cols-2 gap-8 items-center text-left animate-in fade-in duration-300">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      Engineer Self-Service Hub
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                      Check-In, Sprints, Chat & Certifications
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                      Developers clock in with geofenced GPS validation, claim Kanban sprint tickets, collaborate in Slack-style project chat channels, request leaves & WFH, and earn cryptographic project diplomas.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700 dark:text-zinc-300">
                      <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Geofenced Attendance</div>
                      <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Slack-Style Project Chat</div>
                      <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Digital Credentials</div>
                      <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Emergency Loan Portal</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-zinc-900/60 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold pb-2 border-b border-slate-200 dark:border-zinc-800">
                      <span>Credentials & Honors</span>
                      <span className="text-amber-500 font-extrabold flex items-center gap-1"><Medal className="h-4 w-4" /> Verified</span>
                    </div>
                    <div className="p-3 bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-bold space-y-1">
                      <div className="text-slate-900 dark:text-white">Full-Stack Core Architecture</div>
                      <div className="text-[10px] text-slate-400 font-mono">Code: NEXA-CERT-2026-8812</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* ======================================================== */}
        {/* COMPLETE 20-MODULE ENTERPRISE FEATURE SUITE              */}
        {/* ======================================================== */}
        <section id="modules" className={`py-24 border-b ${
          darkMode ? "bg-zinc-950 border-zinc-900" : "bg-white border-slate-200"
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Complete 20-Point Specification
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Everything Your Enterprise Needs
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto">
                Filter by category to explore all 20 modules implemented into the unified NexaCore architecture.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex justify-center mb-10 overflow-x-auto">
              <div className="flex bg-slate-100 dark:bg-zinc-900 p-1.5 rounded-2xl gap-1 text-xs font-bold">
                {[
                  { id: "ALL", label: "All 20 Modules" },
                  { id: "SPRINTS", label: "Sprints & Kanban" },
                  { id: "ATTENDANCE", label: "Attendance & Leaves" },
                  { id: "FINANCE", label: "Payroll & Finance" },
                  { id: "OPERATIONS", label: "Governance & Operations" },
                ].map(c => (
                  <button
                    key={c.id}
                    onClick={() => setFeatureCategory(c.id)}
                    className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      featureCategory === c.id
                        ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modules Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              {filteredModules.map(mod => {
                const Icon = mod.icon;
                return (
                  <div
                    key={mod.id}
                    className="p-6 rounded-3xl border border-slate-200 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-900/30 hover:border-slate-400 dark:hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4 hover:-translate-y-1 duration-200 shadow-xs"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs">
                          <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                          {mod.tag}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {mod.id}. {mod.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                        {mod.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* ======================================================== */}
        {/* LIVE CRYPTOGRAPHIC CERTIFICATE VERIFIER SIMULATOR        */}
        {/* ======================================================== */}
        <section className={`py-20 border-b ${
          darkMode ? "bg-zinc-900/40 border-zinc-900" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Module 18 Real-Time Verification Engine
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Instant Credential Verification Simulator
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-lg mx-auto">
              Test the real-time cryptographic verification engine used to authenticate project completion diplomas.
            </p>

            <div className="flex max-w-md mx-auto bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm gap-2">
              <input
                type="text"
                value={simCertCode}
                onChange={(e) => setSimCertCode(e.target.value)}
                placeholder="Enter certificate code..."
                className="flex-1 px-3 bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-white outline-none"
              />
              <button
                onClick={() => setCertVerified(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer shadow-xs transition-all"
              >
                Verify Code
              </button>
            </div>

            {certVerified && (
              <div className="max-w-md mx-auto p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-left text-xs space-y-2 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Official NexaCore Credential Authenticated</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-zinc-300 font-medium">
                  Recipient: <strong>Abir Hasan</strong> &bull; Track: <strong>Enterprise System Architecture</strong>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Issuer: NexaCore Operations Board &bull; Status: Valid
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ======================================================== */}
        {/* INTERACTIVE FAQ ACCORDION                                */}
        {/* ======================================================== */}
        <section className={`py-24 border-b ${
          darkMode ? "bg-zinc-950 border-zinc-900" : "bg-white border-slate-200"
        }`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Architecture & Security
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Frequently Asked Questions
              </h2>
            </div>
            
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div 
                  key={idx} 
                  className="rounded-2xl border border-slate-200 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-900/40 overflow-hidden text-left transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full p-5 flex justify-between items-center text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white cursor-pointer"
                  >
                    <span className="flex items-center gap-3">
                      <HelpCircle className="h-4 w-4 text-indigo-500 shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${openFaq === idx ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium pl-12 border-t border-slate-200/50 dark:border-zinc-800/50 animate-in fade-in duration-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* BOTTOM CALL TO ACTION                                    */}
        {/* ======================================================== */}
        <section className={`py-24 text-center ${
          darkMode ? "bg-zinc-950" : "bg-slate-50"
        }`}>
          <div className="max-w-3xl mx-auto px-4 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Ready to elevate your workforce operations?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
              Experience seamless employee management, geofenced punctuality, automated payrolls, and Kanban sprint delivery in a high-performance decoupled interface.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 text-white font-extrabold py-4 px-8 rounded-2xl text-xs transition-all shadow-lg gap-2 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Enter NexaCore Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
