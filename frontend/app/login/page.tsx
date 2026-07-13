"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { Workflow, AlertCircle, CheckCircle2, Mail, Lock, ShieldCheck, Activity } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("signup") === "success") {
      setSuccess("Account created successfully! Please sign in below.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all credentials.");
      setLoading(false);
      return;
    }

    try {
      await signIn.email(
        {
          email,
          password,
        },
        {
          onRequest: () => {
            setLoading(true);
          },
          onSuccess: () => {
            setLoading(false);
            router.push("/dashboard");
          },
          onError: (ctx) => {
            setError(ctx.error.message || "Invalid email or password.");
            setLoading(false);
          },
        }
      );
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6 font-sans">
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Welcome back
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Access your NexaCore central operations & HR workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {success && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-md flex items-start gap-2.5 text-xs font-semibold animate-in fade-in duration-300">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-250 text-rose-800 rounded-md flex items-start gap-2.5 text-xs font-semibold animate-in fade-in duration-300">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Email Input */}
        <div className="w-full">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Email Address</label>
          <div className="flex items-center border border-slate-200 bg-slate-50 px-3 h-10 rounded-lg focus-within:bg-white focus-within:border-slate-950 transition-all">
            <div className="mr-2 text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input 
              type="email" 
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@nexacore.com" 
              className="w-full bg-transparent outline-none text-xs text-slate-900 h-full font-medium" 
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="w-full">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Password</label>
            <a href="#" className="text-xs font-semibold text-slate-900 hover:underline">
              Forgot password?
            </a>
          </div>
          <div className="flex items-center border border-slate-200 bg-slate-50 px-3 h-10 rounded-lg focus-within:bg-white focus-within:border-slate-950 transition-all">
            <div className="mr-2 text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input 
              type="password" 
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full bg-transparent outline-none text-xs text-slate-900 h-full font-medium" 
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="remember"
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <label htmlFor="remember" className="text-xs font-bold text-slate-500 select-none cursor-pointer">
              Remember this device
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 bg-zinc-950 hover:bg-zinc-900 active:bg-black text-white font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2 disabled:opacity-50"
        >
          {loading ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-white font-sans antialiased">
      {/* Left side: Form */}
      <div className="lg:col-span-5 flex flex-col justify-between px-6 py-10 sm:px-12 lg:px-16 xl:px-20 relative">
        {/* Brand Header */}
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.jpg" alt="NexaCore" className="w-8.5 h-8.5 rounded-lg object-cover border border-slate-100" />
            <span className="text-base font-bold tracking-tight text-slate-900">
              NexaCore<span className="text-slate-400">.</span>
            </span>
          </Link>
        </div>

        {/* Center Form */}
        <div className="my-auto py-12 flex justify-center lg:justify-start">
          <Suspense fallback={
            <div className="w-full max-w-sm text-center text-slate-500 py-8 text-xs font-semibold">
              Loading authentication form...
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>

        {/* Bottom copyright info */}
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          &copy; 2026 NexaCore Inc. All rights reserved.
        </div>
      </div>

      {/* Right side: Branding Panel (Solid flat slate with clean metrics card) */}
      <div className="hidden lg:col-span-7 lg:flex flex-col justify-between p-12 bg-zinc-950 text-white relative border-l border-slate-100/5 dark:border-zinc-800">
        
        {/* Top Header Badge */}
        <div className="relative flex justify-end">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold text-white select-none shadow-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            SSO Enterprise Secured
          </div>
        </div>

        {/* Branding Slogan & Graphics */}
        <div className="relative max-w-lg space-y-10 my-auto">
          <div className="space-y-4">
            <h2 className="text-4xl xl:text-5xl font-extralight tracking-tight leading-tight">
              Manage your company in a <span className="font-normal text-indigo-400">unified workspace.</span>
            </h2>
            <p className="text-slate-400 text-sm xl:text-base leading-relaxed font-medium">
              NexaCore consolidates all company operations—from project resource tracking and access permissions to automated monthly payroll generation.
            </p>
          </div>

          {/* Mini Dashboard Component inside Auth Page (Flat Slate) */}
          <div className="p-5 bg-zinc-900/50 border border-zinc-800/80 rounded-xl space-y-4 select-none shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20">
                  <Activity className="h-4 w-4 animate-pulse" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">Workforce Activity status</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-[9px] font-bold tracking-wider uppercase text-emerald-500 border border-emerald-500/20">
                Live
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs border-b border-zinc-800 pb-2 font-medium">
                <span className="text-slate-400">Database Connector Status</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Synchronized
                </span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-zinc-800 pb-2 font-medium">
                <span className="text-slate-400">Active Users Online</span>
                <span className="text-white font-bold">148 Active Employees</span>
              </div>
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-slate-450">Pending Leave Approvals</span>
                <span className="text-amber-500 font-bold">3 Pending HR Review</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Quote / Testimonial */}
        <div className="relative text-xs text-slate-400 border-l border-slate-700 pl-4 py-1 italic max-w-md font-medium leading-relaxed">
          "NexaCore simplified our team management and cut payroll processing time by half."
          <span className="block mt-2 font-bold text-xs text-white not-italic">
            — Marcus Vance, CEO at Apex Global
          </span>
        </div>
      </div>
    </div>
  );
}
