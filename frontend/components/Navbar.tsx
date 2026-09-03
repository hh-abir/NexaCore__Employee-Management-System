"use client";

import Link from "next/link";
import { LogOut, LayoutDashboard, LogIn } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";

export default function Navbar() {
  const { data: sessionData } = useSession();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 transition-colors duration-150 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          
          {/* Logo & Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.jpg" alt="NexaCore Logo" className="w-9 h-9 rounded-xl object-cover border border-slate-200" />
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  NexaCore
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  EMS
                </span>
              </div>
            </Link>
          </div>

          {/* Right Action */}
          <div className="flex items-center space-x-3">
            {sessionData ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3.5 py-2 rounded-xl transition-all gap-1.5 shadow-xs"
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Dashboard</span>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center justify-center text-xs font-bold text-slate-500 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all px-4 py-2 rounded-xl shadow-sm gap-1.5 hover:scale-105 active:scale-95"
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
