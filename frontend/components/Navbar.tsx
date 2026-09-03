"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LogOut, LayoutDashboard, LogIn, Sun, Moon } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";

export default function Navbar() {
  const { data: sessionData } = useSession();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const shouldBeDark = storedTheme === "dark" || (!storedTheme && prefersDark);
      setIsDark(shouldBeDark);
      if (shouldBeDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 w-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          
          {/* Logo & Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.jpg" alt="NexaCore Logo" className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-zinc-700" />
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  NexaCore
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-850 px-2 py-0.5 rounded-md border border-slate-200 dark:border-zinc-800">
                  EMS
                </span>
              </div>
            </Link>
          </div>

          {/* Right Action */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Night Mode"}
              className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900"
            >
              {isDark ? (
                <Sun className="h-4.5 w-4.5 text-amber-500 fill-amber-500/20" />
              ) : (
                <Moon className="h-4.5 w-4.5" />
              )}
            </button>

            {sessionData ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center text-xs font-bold text-slate-900 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl transition-all gap-1.5"
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Dashboard</span>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center justify-center text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition-all px-4 py-2 rounded-xl shadow-xs gap-1.5 hover:scale-105 active:scale-95"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
