"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Layers,
  DollarSign
} from "lucide-react";

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
          Sign In to Portal
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Access your NexaCore workspace & operations console.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {success && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-start gap-2.5 text-xs font-semibold animate-in fade-in duration-300">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2.5 text-xs font-semibold animate-in fade-in duration-300">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="w-full">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
            Email Address
          </label>
          <div className="flex items-center border border-slate-200 bg-slate-50 px-3 h-10 rounded-xl focus-within:bg-white focus-within:border-slate-950 transition-all">
            <div className="mr-2 text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input 
              type="email" 
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. abir@nexacore.com" 
              className="w-full bg-transparent outline-none text-xs text-slate-900 h-full font-medium" 
            />
          </div>
        </div>

        <div className="w-full">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Password
            </label>
          </div>
          <div className="flex items-center border border-slate-200 bg-slate-50 px-3 h-10 rounded-xl focus-within:bg-white focus-within:border-slate-950 transition-all">
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
              defaultChecked
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <label htmlFor="remember" className="text-xs font-bold text-slate-500 select-none cursor-pointer">
              Remember credentials
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-bold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
        >
          {loading ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="text-xs">Sign In</span>
          )}
        </button>

        <div className="pt-4 border-t border-slate-100 text-center">
          <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 transition-colors">
            <span>&larr; Return to Home & Test Credentials</span>
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  useEffect(() => {
    // Login page is strictly white light mode
    document.documentElement.classList.remove("dark");
  }, []);

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-white font-sans antialiased">
      
      {/* Left Section: Full-Bleed Office Background with Text Overlay */}
      <div className="hidden lg:col-span-7 lg:flex relative flex-col justify-between p-12 overflow-hidden bg-slate-950 text-white">
        
        {/* Full-Bleed Background Image */}
        <img 
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=85" 
          alt="People working in modern office in front of desk computers" 
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        />

        {/* High-Contrast Gradient Backdrop Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-slate-950/75 backdrop-blur-[0.5px]" />

        {/* Top Header */}
        <div className="relative z-10 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.jpg" alt="NexaCore" className="w-9 h-9 rounded-xl object-cover border border-white/20 shadow-sm" />
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">
                NexaCore
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/20">
                EMS
              </span>
            </div>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-white select-none shadow-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Role-Based Access Control</span>
          </div>
        </div>

        {/* Center Overlay Text & Feature Badges */}
        <div className="relative z-10 max-w-xl space-y-6 my-auto">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-md text-white border border-white/25">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Full-Stack Enterprise Operations</span>
            </div>

            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Empowering Teams. Accelerating Agile Delivery.
            </h2>

            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed font-medium">
              A unified environment connecting GPS-verified campus attendance, agile Markdown Kanban sprints, and automated BDT payroll operations.
            </p>
          </div>

          {/* Quick Feature Pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/15 text-xs text-slate-200 font-medium">
              <MapPin className="h-3.5 w-3.5 text-indigo-400" />
              <span>BRAC University GPS Check-In</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/15 text-xs text-slate-200 font-medium">
              <Layers className="h-3.5 w-3.5 text-purple-400" />
              <span>Markdown Sprint Kanban</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/15 text-xs text-slate-200 font-medium">
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              <span>BDT Payroll & Payslips</span>
            </div>
          </div>
        </div>

        {/* Bottom Footer Meta */}
        <div className="relative z-10 text-[11px] text-slate-400 font-medium flex justify-between items-center">
          <span>&copy; 2026 NexaCore Employee Management System</span>
          <span>Next.js 16 &bull; Express TypeScript &bull; MongoDB</span>
        </div>
      </div>

      {/* Right Section: Login Authentication Card */}
      <div className="lg:col-span-5 flex flex-col justify-between px-6 py-10 sm:px-12 lg:px-16 xl:px-20 relative bg-white">
        
        {/* Mobile Header */}
        <div className="flex justify-between items-center lg:hidden pb-6">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.jpg" alt="NexaCore" className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
            <span className="text-base font-bold tracking-tight text-slate-900">
              NexaCore
            </span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="my-auto py-12 flex justify-center">
          <Suspense fallback={
            <div className="w-full max-w-sm text-center text-slate-500 py-8 text-xs font-semibold">
              Loading authentication form...
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>

        {/* Footer info */}
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center lg:text-left">
          &copy; 2026 NexaCore Inc. All rights reserved.
        </div>
      </div>

    </div>
  );
}
