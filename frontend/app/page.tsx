"use client";

import { useState } from "react";
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
  Code2,
  Database,
  Lock,
  Copy,
  Check,
  Sparkles,
  Server
} from "lucide-react";
import { useToast } from "@/components/Toast";

export default function Home() {
  const { toast } = useToast();
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleCopy = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    toast.success(`Copied "${email}" to clipboard.`);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const demoAccounts = [
    {
      role: "HR Administrator",
      name: "Jane Doe",
      email: "hr@worksync.com",
      badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
      description: "Employee onboarding, OpEx finances, BI analytics, payroll generation, grievances & surveys."
    },
    {
      role: "Project Manager",
      name: "Asif Iqbal",
      email: "asif.iqbal@nexacore.com",
      badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800",
      description: "PM Command Center, Markdown Kanban sprints, room bookings, star appraisals & sprint polls."
    },
    {
      role: "Software Engineer",
      name: "Abir Hasan",
      email: "abir.hasan@nexacore.com",
      badgeClass: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      description: "Geofenced campus check-in, sprint tickets, project chat, payslips, leaves, loans & certificates."
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
      description: "Real-time communication channels (#general, #technical, #announcements) scoped to assigned team members.",
      icon: Users
    }
  ];

  const techStack = [
    { name: "Next.js 16 (App Router)", tag: "Frontend" },
    { name: "Node.js & Express (TypeScript)", tag: "Backend API" },
    { name: "Prisma ORM & MongoDB Atlas", tag: "Database" },
    { name: "Better-Auth (RBAC)", tag: "Authentication" },
    { name: "Tailwind CSS v4 & Lucide", tag: "Styling" },
    { name: "Chart.js & react-chartjs-2", tag: "Analytics" }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white transition-colors duration-150">
      
      <Navbar />

      <main className="flex-grow pt-20">
        
        {/* ======================================================== */}
        {/* MINIMAL HERO SECTION                                     */}
        {/* ======================================================== */}
        <section className="py-16 sm:py-24 border-b border-slate-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300">
              <Code2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>University Capstone Project &bull; CSE Final Presentation</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              NexaCore <span className="text-slate-400 dark:text-zinc-600">&bull;</span> Employee Management System
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              A full-stack, decoupled enterprise operations and workforce platform built with <strong>Next.js</strong>, <strong>Express TypeScript</strong>, <strong>Prisma ORM</strong>, and <strong>Better-Auth</strong>.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 text-white font-bold px-6 py-3 rounded-xl text-xs transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Enter Portal / Login</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#demo-accounts"
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 font-bold px-5 py-3 rounded-xl text-xs transition-all cursor-pointer"
              >
                View Test Credentials
              </a>
            </div>

          </div>
        </section>

        {/* ======================================================== */}
        {/* DEMO TEST ACCOUNTS                                       */}
        {/* ======================================================== */}
        <section id="demo-accounts" className="py-16 border-b border-slate-200 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Presentation Access</span>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Role-Based Test Accounts</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Universal password for all accounts: <strong className="font-mono bg-slate-200 dark:bg-zinc-800 px-2 py-0.5 rounded text-slate-900 dark:text-white">Password123</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {demoAccounts.map((acc, idx) => (
                <div 
                  key={idx} 
                  className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-200 dark:border-zinc-850 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${acc.badgeClass}`}>
                        {acc.role}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{acc.name}</h3>
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900 p-2 rounded-xl border border-slate-100 dark:border-zinc-800 mt-1">
                        <span className="text-xs font-mono font-bold text-slate-600 dark:text-zinc-300 truncate">
                          {acc.email}
                        </span>
                        <button
                          onClick={() => handleCopy(acc.email)}
                          className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          title="Copy email"
                        >
                          {copiedEmail === acc.email ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                      {acc.description}
                    </p>
                  </div>

                  <Link
                    href="/login"
                    className="w-full text-center py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-slate-800 dark:text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Sign In as {acc.role.split(" ")[0]}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ======================================================== */}
        {/* KEY PROJECT MODULES (6 HIGHLIGHTS)                       */}
        {/* ======================================================== */}
        <section className="py-16 border-b border-slate-200 dark:border-zinc-900 bg-white dark:bg-zinc-950">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Core Architecture</span>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Key Functional Modules</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-left">
              {highlights.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={idx} 
                    className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-900/30 space-y-2.5"
                  >
                    <div className="p-2 rounded-xl bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 w-fit border border-slate-100 dark:border-zinc-700 shadow-xs">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* ======================================================== */}
        {/* TECHNOLOGY STACK                                         */}
        {/* ======================================================== */}
        <section className="py-14 bg-slate-50/50 dark:bg-zinc-900/20 text-center">
          <div className="max-w-4xl mx-auto px-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-6">
              Implemented Tech Stack
            </span>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {techStack.map((tech, idx) => (
                <div 
                  key={idx}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-bold text-slate-700 dark:text-zinc-300 shadow-xs flex items-center gap-2"
                >
                  <span>{tech.name}</span>
                  <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">
                    {tech.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
