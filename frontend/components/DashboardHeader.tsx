"use client";

import { useState, useEffect } from "react";
import { Bell, Search, Sun, Moon, Mail, Menu } from "lucide-react";
import { useSession } from "@/lib/auth-client";

export default function DashboardHeader() {
  const { data: sessionData } = useSession();
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sync initial theme status on mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setIsDark(document.documentElement.classList.contains("dark"));
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const userInitials = mounted && sessionData?.user?.name
    ? sessionData.user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
    : "JD";

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white flex items-center justify-between px-8 select-none transition-colors duration-150 font-sans shadow-xs">
      
      {/* Left: Sidebar Toggle & Minimal Search Bar */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => alert("Sidebar toggle triggered.")}
          className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer rounded"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        {/* Subtle Search Input */}
        <div className="relative flex items-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 w-64 focus-within:border-zinc-900 dark:focus-within:border-white transition-all shadow-xs">
          <Search className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search anything..."
            className="bg-transparent text-[11px] outline-none text-zinc-900 dark:text-white w-full font-semibold"
          />
        </div>
      </div>

      {/* Right: Unboxed Icons (Dark Mode, Bell, Mail, Avatar) */}
      <div className="flex items-center space-x-5">
        
        {/* Night Mode Toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Night Mode"}
          className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer rounded hover:bg-slate-50 dark:hover:bg-zinc-900"
        >
          {isDark ? (
            <Sun className="h-4.5 w-4.5 text-amber-500 fill-amber-500/20" />
          ) : (
            <Moon className="h-4.5 w-4.5" />
          )}
        </button>

        {/* Mail Envelope Icon */}
        <button
          onClick={() => alert("Inbox: No unread messages.")}
          className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer rounded hover:bg-slate-50 dark:hover:bg-zinc-900"
        >
          <Mail className="h-4.5 w-4.5" />
        </button>

        {/* Notifications with red dot badge */}
        <button
          onClick={() => alert("Notification center: 3 pending task alerts.")}
          className="relative p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer rounded hover:bg-slate-50 dark:hover:bg-zinc-900"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
        </button>

        {/* User Mini Avatar */}
        <div className="w-7.5 h-7.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer flex items-center justify-center">
          {userInitials}
        </div>
      </div>
    </header>
  );
}
