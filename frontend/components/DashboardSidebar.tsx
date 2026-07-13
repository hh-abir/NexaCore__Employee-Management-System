"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";

import {
  LayoutDashboard,
  UserPlus,
  FileText,
  Clock,
  DollarSign,
  Wallet,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  Briefcase
} from "lucide-react";

interface SidebarSubItem {
  name: string;
  href: string;
}

interface SidebarItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  subItems?: SidebarSubItem[];
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: sessionData } = useSession();

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const isHrOrPm = sessionData?.user?.role === "HR" || sessionData?.user?.role === "PROJECT_MANAGER";
  const isHr = sessionData?.user?.role === "HR";

  // Hydration-safe profile values
  const userInitials = mounted && sessionData?.user?.name
    ? sessionData.user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
    : "JD";

  const userName = mounted && sessionData?.user?.name
    ? sessionData.user.name
    : "Jane Doe";

  const userEmail = mounted && sessionData?.user?.email
    ? sessionData.user.email
    : "hr@nexacore.com";

  const menuGroups: SidebarGroup[] = [
    {
      title: "Dashboard",
      items: [
        { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "Workspace",
      items: [
        {
          name: "Projects",
          href: "#",
          icon: Briefcase,
          subItems: [
            { name: "Active Projects", href: "/dashboard?tab=Projects" },
            ...(isHr ? [{ name: "Add Project", href: "/dashboard?tab=Projects&create=true" }] : [])
          ]
        }
      ]
    },
    {
      title: "Apps",
      items: [
        { name: "Employee Onboarding", href: "/hr/onboarding", icon: UserPlus },
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

  // Auto-expand menus that contain the currently active route on load
  useEffect(() => {
    const nextExpanded: Record<string, boolean> = {};
    const tabVal = searchParams.get("tab");
    
    menuGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.subItems) {
          const hasActiveSub = item.subItems.some(sub => {
            const basePath = sub.href.split("?")[0];
            const isBaseMatch = pathname === basePath;

            if (sub.href.includes("tab=Projects")) {
              return isBaseMatch && tabVal === "Projects";
            }
            return isBaseMatch;
          });

          if (hasActiveSub) {
            nextExpanded[item.name] = true;
          }
        }
      });
    });
    setExpandedItems(prev => ({ ...prev, ...nextExpanded }));
  }, [pathname, searchParams]);

  const toggleExpand = (name: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 flex flex-col justify-between bg-white dark:bg-zinc-950 text-slate-900 dark:text-white transition-colors duration-150 select-none border-r border-slate-50 dark:border-zinc-900/50 font-sans z-30">
      
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
                  const hasSub = item.subItems && item.subItems.length > 0;
                  const isExpanded = expandedItems[item.name] || false;
                  
                  const tabVal = searchParams.get("tab");
                  const isAnySubActive = hasSub && item.subItems!.some(sub => {
                    const basePath = sub.href.split("?")[0];
                    const isBaseMatch = pathname === basePath;
                    if (sub.href.includes("tab=Projects")) {
                      return isBaseMatch && tabVal === "Projects";
                    }
                    return isBaseMatch;
                  });

                  const isActive = (!hasSub && pathname === item.href) || isAnySubActive;

                  return (
                    <li key={itemIdx} className="space-y-1">
                      {hasSub ? (
                        <>
                          <button
                            onClick={() => toggleExpand(item.name)}
                            className={`w-full flex items-center justify-between py-3 px-4 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                              isActive
                                ? "bg-slate-100/80 text-zinc-950 dark:bg-zinc-900 dark:text-white"
                                : "bg-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-zinc-900/50 hover:translate-x-0.5"
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <Icon className={`h-4.5 w-4.5 shrink-0 ${
                                isActive ? "text-zinc-950 dark:text-white" : "text-slate-400"
                              }`} />
                              <span className="truncate">{item.name}</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {item.badge && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                  {item.badge}
                                </span>
                              )}
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                              )}
                            </div>
                          </button>

                          {/* Sub menu links list */}
                          {isExpanded && (
                            <ul className="pl-5.5 space-y-0.5 border-l border-slate-100 dark:border-zinc-900 ml-6 mt-1 text-left">
                              {item.subItems!.map((sub, subIdx) => {
                                const isSubActive = pathname === sub.href.split("?")[0] && (
                                  !sub.href.includes("tab=Projects") || tabVal === "Projects"
                                ) && (
                                  !sub.href.includes("create=true") || searchParams.get("create") === "true"
                                );

                                return (
                                  <li key={subIdx}>
                                    <Link
                                      href={sub.href}
                                      className={`w-full flex items-center py-2 px-4 text-xs font-semibold rounded-lg transition-all duration-150 ${
                                        isSubActive
                                          ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold shadow-xs"
                                          : "bg-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/10 dark:hover:bg-zinc-900/40"
                                      }`}
                                    >
                                      {sub.name}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </>
                      ) : (
                        <Link
                          href={item.href}
                          className={`w-full flex items-center justify-between py-3 px-4 text-sm font-semibold rounded-xl transition-all duration-200 ${
                            isActive
                              ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs font-bold"
                              : "bg-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-zinc-900/50 hover:translate-x-0.5"
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
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
                      )}
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
              {userInitials}
            </div>
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-xs font-bold text-zinc-900 dark:text-white truncate leading-none">
                {userName}
              </span>
              <span className="text-[9px] font-medium text-slate-400 dark:text-zinc-400 mt-1 truncate">
                {userEmail}
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
