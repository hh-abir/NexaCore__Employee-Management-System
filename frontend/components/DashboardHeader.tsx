"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Bell, 
  Search, 
  Sun, 
  Moon, 
  Menu, 
  LogOut, 
  Settings, 
  CheckCheck, 
  Clock, 
  FileText, 
  Megaphone, 
  Briefcase, 
  DollarSign,
  Award,
  Wallet,
  CheckCircle2,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function timeAgo(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return past.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function DashboardHeader() {
  const router = useRouter();
  const { data: sessionData } = useSession();
  const { toast } = useToast();

  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Live Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!sessionData) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Fetch notifications error:", err);
    }
  }, [sessionData]);

  useEffect(() => {
    setMounted(true);
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

  useEffect(() => {
    if (sessionData) {
      fetchNotifications();
      // Poll every 25 seconds for real-time background updates
      const interval = setInterval(fetchNotifications, 25000);
      return () => clearInterval(interval);
    }
  }, [sessionData, fetchNotifications]);

  // Close dropdowns on outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    toast.info(`Searching for: "${searchQuery}"`);
    setSearchQuery("");
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read.");
      }
    } catch (err) {
      console.error("Mark all as read error:", err);
    }
  };

  const handleClearNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/clear-all`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
        toast.info("Notification center cleared.");
      }
    } catch (err) {
      console.error("Clear notifications error:", err);
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.read) {
      try {
        await fetch(`${API_BASE_URL}/api/notifications/${item.id}/read`, {
          method: "PATCH",
          credentials: "include",
        });
        setNotifications(prev =>
          prev.map(n => (n.id === item.id ? { ...n, read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Mark notification read error:", err);
      }
    }

    if (item.link) {
      setShowNotifications(false);
      router.push(item.link);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Successfully logged out!");
            router.push("/login");
          }
        }
      });
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("Failed to log out.");
    }
  };

  const userInitials = mounted && sessionData?.user?.name
    ? sessionData.user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
    : "U";

  const getNotificationIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "ATTENDANCE":
        return <Clock className="h-4 w-4 text-emerald-500" />;
      case "ANNOUNCEMENT":
        return <Megaphone className="h-4 w-4 text-amber-500" />;
      case "LEAVE":
        return <FileText className="h-4 w-4 text-purple-500" />;
      case "PAYROLL":
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      case "LOAN":
        return <Wallet className="h-4 w-4 text-pink-500" />;
      case "EVALUATION":
        return <Award className="h-4 w-4 text-yellow-500" />;
      case "PROJECT":
        return <Briefcase className="h-4 w-4 text-indigo-500" />;
      default:
        return <Sparkles className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white flex items-center justify-between px-8 select-none transition-colors duration-150 font-sans shadow-xs border-b border-slate-50 dark:border-zinc-900/60">
      
      {/* Left side items: Menu & Search */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => toast.info("Sidebar is locked in expanded desktop layout.")}
          className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer rounded"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative flex items-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 w-64 focus-within:border-zinc-900 dark:focus-within:border-white transition-all shadow-xs">
          <Search className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search anything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-[11px] outline-none text-zinc-900 dark:text-white w-full font-semibold"
          />
        </form>
      </div>

      {/* Right side items: Actions & Profiling */}
      <div className="flex items-center space-x-4">
        
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Night Mode"}
          className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900"
        >
          {isDark ? (
            <Sun className="h-4.5 w-4.5 text-amber-500 fill-amber-500/20" />
          ) : (
            <Moon className="h-4.5 w-4.5" />
          )}
        </button>

        {/* Real Dynamic Notification Center Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
              if (!showNotifications) fetchNotifications();
            }}
            title="Notifications"
            className="relative p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-96 sm:w-[430px] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 text-left space-y-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-900">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">Live Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification Items List */}
              <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100/60 dark:divide-zinc-900/60">
                {notifications.length > 0 ? (
                  notifications.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`pt-2.5 first:pt-0 p-3 rounded-xl transition-all cursor-pointer ${
                        !item.read 
                          ? "bg-slate-50/90 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 shadow-xs" 
                          : "hover:bg-slate-50 dark:hover:bg-zinc-900/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-900 shrink-0 mt-0.5 border border-slate-200/40 dark:border-zinc-800/40">
                          {getNotificationIcon(item.type)}
                        </div>
                        <div className="flex-grow min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className={`text-xs font-bold truncate ${!item.read ? "text-slate-950 dark:text-white font-extrabold" : "text-slate-700 dark:text-zinc-300"}`}>
                              {item.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold shrink-0">
                              {timeAgo(item.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-medium">
                            {item.message}
                          </p>
                          {item.link && (
                            <div className="pt-0.5 flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                              <span>Open details</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400 dark:text-zinc-600 space-y-2">
                    <CheckCircle2 className="h-8 w-8 mx-auto text-slate-300 dark:text-zinc-700 opacity-60" />
                    <p className="text-xs font-bold">You're all caught up!</p>
                    <p className="text-[10px] font-medium text-slate-400">No new system alerts at this time.</p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              {notifications.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-900 flex justify-between items-center text-[11px]">
                  <button
                    onClick={handleClearNotifications}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 font-semibold cursor-pointer"
                  >
                    Clear history
                  </button>
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      router.push("/dashboard");
                    }}
                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    Workspace overview &rarr;
                  </button>
                </div>
              )}

            </div>
          )}
        </div>

        {/* User Initials & Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <div 
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="w-8 h-8 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-[11px] font-black cursor-pointer flex items-center justify-center hover:opacity-90 transition-opacity shadow-xs"
          >
            {userInitials}
          </div>

          {showProfile && (
            <div className="absolute right-0 mt-3 w-60 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-3 text-left space-y-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {mounted && sessionData && (
                <div className="p-2.5 border-b border-slate-100 dark:border-zinc-900 pb-2.5">
                  <div className="text-xs font-extrabold text-slate-950 dark:text-white truncate">{sessionData.user.name}</div>
                  <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium truncate">{sessionData.user.email}</div>
                  <span className="inline-flex items-center text-[9px] font-black uppercase px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-md mt-1.5">
                    {sessionData.user.role}
                  </span>
                </div>
              )}
              <div className="space-y-1 text-xs font-semibold">
                <button
                  onClick={() => {
                    setShowProfile(false);
                    router.push("/dashboard/settings");
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg text-slate-650 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Account Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 p-2 rounded-lg text-rose-650 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 cursor-pointer transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
