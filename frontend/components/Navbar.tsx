"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: sessionData } = useSession();

  const navLinks = [
    { name: "Features", href: "/#features" },
    { name: "Solutions", href: "/#solutions" },
    { name: "Pricing", href: "/#pricing" },
  ];

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 w-full bg-white dark:bg-black border-b border-neutral-200 dark:border-neutral-800 transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          {}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-3.5">
              <img src="/logo.jpg" alt="NexaCore Logo" className="w-12 h-12 rounded-xl object-cover border border-slate-100" />
              <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                NexaCore<span className="text-slate-400">.</span>
              </span>
            </Link>
          </div>

          {}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:text-blue-700 dark:text-neutral-400 dark:hover:text-white transition-colors duration-150"
              >
                {link.name}
              </Link>
            ))}
            {sessionData && (
              <Link
                href="/dashboard"
                className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 hover:text-blue-800 flex items-center gap-1"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </Link>
            )}
          </div>

          {}
          <div className="hidden md:flex items-center space-x-3">
            {sessionData ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    {sessionData.user.name}
                  </span>
                  <span className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                    {sessionData.user.role}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center justify-center text-xs font-bold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors duration-150 px-4 py-2 rounded-md cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center text-xs font-bold text-white bg-blue-700 hover:bg-blue-850 active:bg-blue-900 transition-colors duration-150 px-5 py-2.5 rounded-md"
              >
                Sign In
              </Link>
            )}
          </div>

          {}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900 focus:outline-none transition-colors duration-150"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {}
      <div className={`md:hidden absolute top-16 left-0 right-0 w-full bg-white dark:bg-black border-b border-neutral-200 dark:border-neutral-800 transition-all duration-200 ${
        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden pointer-events-none"
      }`}>
        <div className="px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-semibold text-neutral-600 hover:text-blue-700 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors duration-150"
            >
              {link.name}
            </Link>
          ))}
          {sessionData && (
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-bold text-blue-700 dark:text-blue-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors duration-150"
            >
              Dashboard
            </Link>
          )}
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-2">
            {sessionData ? (
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleSignOut();
                }}
                className="w-full text-center px-4 py-2.5 rounded-md text-xs font-bold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors duration-150"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="w-full text-center px-4 py-2.5 rounded-md text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 transition-colors duration-150"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
