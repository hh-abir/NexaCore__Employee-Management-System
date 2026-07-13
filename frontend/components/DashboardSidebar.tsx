"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";

import {
  LayoutDashboard,
  Calendar,
  UserPlus,
  FileText,
  Clock,
  DollarSign,
  Wallet,
  Settings,
  LogOut,
  HelpCircle,
  Sparkles
} from "lucide-react";

interface SidebarItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: sessionData } = useSession();

  const handleSignOut = async () => {
    await signOut({
      callbackURL: "/login",
    });
  };

  const menuGroups: SidebarGroup[] = [
    {
      title: "Dashboard",
      items: [
        { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "Apps",
      items: [
        { name: "Onboarding", href: "/hr/onboarding", icon: UserPlus, badge: "New" },
        { name: "Leave Requests", href: "/dashboard/leaves", icon: FileText },
        { name: "Attendance Logs", href: "/dashboard/attendance", icon: Clock },
      ],
    },
    {
      title: "Finance",
      items: [
        { name: "Payroll Ledger", href: "/dashboard/payroll", icon: DollarSign },
        { name: "Loans Tracker", href: "/dashboard/loans", icon: Wallet },
      ],
    },
    {
      title: "System",
      items: [
        { name: "Settings", href: "/dashboard/settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 flex flex-col justify-between bg-white dark:bg-zinc-950 text-slate-900 dark:text-white transition-colors duration-150 select-none border-r-0 font-sans z-30">
      
      {/* Upper Content Area */}
      <div className="flex flex-col flex-grow min-h-0">
        
        {/* Minimalist Branding Header */}
        <div className="h-16 px-6 flex items-center gap-2.5">
          <img src="/logo.jpg" alt="NexaCore" className="w-8 h-8 rounded-lg object-cover border border-slate-100 dark:border-zinc-800" />
          <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">
            NexaCore<span className="text-zinc-400">.</span>
          </span>
        </div>

        {/* Scrollable Navigation Groups */}
        <div className="flex-grow overflow-y-auto px-4 py-4 space-y-5">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1.5">
              <span className="px-3 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                {group.title}
              </span>
              <ul className="space-y-0.5">
                {group.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={itemIdx}>
                      <Link
                        href={item.href}
                        className={`w-full flex items-center justify-between py-3 px-4 text-sm font-semibold rounded-xl transition-all duration-200 ${
                          isActive
                            ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs font-bold" 
                            : "bg-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-zinc-900/50 hover:translate-x-0.5 font-semibold"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <Icon className={`h-4.5 w-4.5 shrink-0 ${
                            isActive ? "text-white dark:text-zinc-950" : "text-slate-400"
                          }`} />
                          <span className="truncate">{item.name}</span>
                        </div>
                        
                        {item.badge && (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors ${
                            isActive 
                              ? "bg-white/20 text-white border-white/20" 
                              : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Pinned User Profile Segment */}
      <div className="p-4">

        {/* User profile segment */}
        <div className="flex items-center justify-between gap-2.5 px-1 pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs shrink-0 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
              {(sessionData?.user?.name || "JD").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-xs font-bold text-zinc-900 dark:text-white truncate leading-none">
                {sessionData?.user?.name || "Jane Doe"}
              </span>
              <span className="text-[9px] font-medium text-slate-400 dark:text-zinc-400 mt-1 truncate">
                {sessionData?.user?.email || "hr@nexacore.com"}
              </span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            title="Log Out"
            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-all cursor-pointer shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
