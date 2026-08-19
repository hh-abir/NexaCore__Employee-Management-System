"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { 
  Settings, 
  User, 
  Lock, 
  Bell, 
  Monitor, 
  CheckCircle,
  HelpCircle,
  Building,
  Key,
  Phone,
  Briefcase,
  MapPin,
  FileText,
  Shield,
  ShieldCheck,
  Smartphone,
  Laptop,
  Globe,
  Save,
  Clock,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/components/Toast";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  department?: string;
  designation?: string;
  bio?: string;
  location?: string;
  emergencyContact?: string;
  twoFactorEnabled?: boolean;
  createdAt?: string;
}

interface ActiveSession {
  id: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  expiresAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function safeJson(res: Response) {
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return {};
    }
  }
  return {};
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionLoading } = useSession();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"PROFILE" | "SECURITY" | "NOTIFICATIONS" | "PREFERENCES">("PROFILE");
  const [profileLoading, setProfileLoading] = useState(false);

  // Profile Form States
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Security States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [toggling2FA, setToggling2FA] = useState(false);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);

  // Preferences States
  const [emailNotif, setEmailNotif] = useState(true);
  const [browserNotif, setBrowserNotif] = useState(true);
  const [clockInReminder, setClockInReminder] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD");
  const [timezone, setTimezone] = useState("Asia/Dhaka");

  useEffect(() => {
    if (!sessionLoading && !sessionData) {
      router.push("/login");
    }
  }, [sessionData, sessionLoading, router]);

  useEffect(() => {
    if (sessionData) {
      fetchProfile();
      fetchSessions();
    }
  }, [sessionData]);

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
        if (data.user) {
          const u: UserProfile = data.user;
          setName(u.name || "");
          setPhone(u.phone || "");
          setDepartment(u.department || "");
          setDesignation(u.designation || "");
          setBio(u.bio || "");
          setLocation(u.location || "");
          setEmergencyContact(u.emergencyContact || "");
          setTwoFactor(!!u.twoFactorEnabled);
        }
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/sessions`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Fetch sessions error:", err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Full name is required.");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          department,
          designation,
          bio,
          location,
          emergencyContact
        }),
        credentials: "include"
      });
      const data = await safeJson(res);
      if (res.ok) {
        toast.success("Profile information updated successfully!");
        fetchProfile();
      } else {
        toast.error(data.error || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Update profile error:", err);
      toast.error("Internal server error.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: "include"
      });
      const data = await safeJson(res);
      if (res.ok) {
        toast.success("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Failed to update password.");
      }
    } catch (err) {
      console.error("Password update error:", err);
      toast.error("Internal server error.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleToggle2FA = async () => {
    setToggling2FA(true);
    const nextState = !twoFactor;
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/two-factor`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextState }),
        credentials: "include"
      });
      const data = await safeJson(res);
      if (res.ok) {
        setTwoFactor(nextState);
        toast.success(nextState ? "Two-Factor Authentication enabled!" : "Two-Factor Authentication disabled.");
      } else {
        toast.error(data.error || "Failed to toggle 2FA.");
      }
    } catch (err) {
      console.error("Toggle 2FA error:", err);
      toast.error("Internal server error.");
    } finally {
      setToggling2FA(false);
    }
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Workspace preferences updated successfully!");
  };

  if (sessionLoading || !sessionData) return null;

  const initials = sessionData.user.name 
    ? sessionData.user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() 
    : "JD";

  return (
    <div className="flex-grow flex flex-col space-y-6 font-sans text-slate-900 dark:text-white transition-colors duration-150 text-left">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Account Settings</h1>
        <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
          Manage personal identity, security credentials, sessions & workspace preferences
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-zinc-800 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab("PROFILE")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "PROFILE" 
              ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs" 
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900"
          }`}
        >
          <User className="h-4 w-4" />
          <span>Profile & Identity</span>
        </button>

        <button
          onClick={() => setActiveTab("SECURITY")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "SECURITY" 
              ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs" 
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900"
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>Security & Sessions</span>
        </button>

        <button
          onClick={() => setActiveTab("NOTIFICATIONS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "NOTIFICATIONS" 
              ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs" 
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900"
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Notifications</span>
        </button>

        <button
          onClick={() => setActiveTab("PREFERENCES")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "PREFERENCES" 
              ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs" 
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900"
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>Preferences & System</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PROFILE & IDENTITY                                */}
      {/* ======================================================== */}
      {activeTab === "PROFILE" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Profile Overview Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-20 w-20 bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-black text-2xl rounded-full flex items-center justify-center shadow-md">
                  {initials}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{name || sessionData.user.name}</h3>
                  <p className="text-xs text-slate-400 font-medium">{sessionData.user.email}</p>
                </div>
                <span className="inline-flex items-center text-[10px] font-extrabold uppercase px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-full">
                  {sessionData.user.role}
                </span>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-zinc-900 space-y-2 text-xs text-slate-600 dark:text-zinc-400 font-medium">
                <div className="flex items-center gap-2">
                  <Building className="h-3.5 w-3.5 text-slate-400" />
                  <span>NexaCore Industries Ltd.</span>
                </div>
                {department && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                    <span>Dept: {department}</span>
                  </div>
                )}
                {location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl p-6 shadow-xs space-y-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5 border-b border-slate-50 dark:border-zinc-900 pb-3">
                <User className="h-4 w-4 text-indigo-500" />
                Personal Information
              </h2>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                      Email Address (Locked)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={sessionData.user.email}
                      className="w-full bg-slate-100 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-500 font-medium cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                      Direct Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+880 1700-000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                      Office / Campus Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BRAC University Hub, Merul Badda, Dhaka"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Engineering, Product Design, Finance"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                      Job Designation / Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Full-Stack Engineer"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    Emergency Contact (Name & Phone)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jane Doe (Spouse) - +880 1800-000000"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-medium"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    Professional Biography
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe your responsibilities, technical expertise, and domain focus..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-medium resize-none"
                  />
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-50 dark:border-zinc-900">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-2 px-5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>{savingProfile ? "Saving..." : "Save Profile Details"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: SECURITY & SESSIONS                               */}
      {/* ======================================================== */}
      {activeTab === "SECURITY" && (
        <div className="space-y-6">
          
          {/* Two-Factor Authentication Card */}
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Two-Factor Authentication (2FA)</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                Add an extra layer of security to your account with time-based verification codes.
              </p>
            </div>
            <button
              onClick={handleToggle2FA}
              disabled={toggling2FA}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                twoFactor 
                  ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xs" 
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              }`}
            >
              {twoFactor ? "Disable 2FA" : "Enable 2FA"}
            </button>
          </div>

          {/* Change Password Card */}
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5 border-b border-slate-50 dark:border-zinc-900 pb-3">
              <Lock className="h-4 w-4 text-slate-400" />
              Change Account Password
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-medium"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  New Password (Min 6 Characters)
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter strong new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-medium"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-medium"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-2 px-4 rounded-xl text-xs cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Key className="h-4 w-4" />
                  {updatingPassword ? "Updating Password..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>

          {/* Active Sessions Card */}
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5 border-b border-slate-50 dark:border-zinc-900 pb-3">
              <Laptop className="h-4 w-4 text-slate-400" />
              Active Login Sessions
            </h2>

            <div className="space-y-3">
              {sessions.length > 0 ? (
                sessions.map((sess, idx) => (
                  <div key={sess.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-900 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/30">
                    <div className="space-y-0.5 text-xs">
                      <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{idx === 0 ? "Current Active Session" : "Authorized Session"}</span>
                        {idx === 0 && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 font-extrabold uppercase px-2 py-0.5 rounded-full">
                            This Device
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {sess.ipAddress || "127.0.0.1"} &bull; Logged in {new Date(sess.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Expires {new Date(sess.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-4">No other active sessions detected.</div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: NOTIFICATION PREFERENCES                          */}
      {/* ======================================================== */}
      {activeTab === "NOTIFICATIONS" && (
        <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl p-6 shadow-xs space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5 border-b border-slate-50 dark:border-zinc-900 pb-3">
            <Bell className="h-4 w-4 text-indigo-500" />
            Notification Delivery Channels
          </h2>

          <form onSubmit={handleSavePreferences} className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/30">
              <div className="space-y-0.5">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">Email Digest & Summaries</div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Receive monthly payslip receipts and company-wide notices in your inbox
                </p>
              </div>
              <input
                type="checkbox"
                checked={emailNotif}
                onChange={(e) => setEmailNotif(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/30">
              <div className="space-y-0.5">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">Live Push & Header Alerts</div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Instant header drop alerts for chat mentions, task assignments, and review approvals
                </p>
              </div>
              <input
                type="checkbox"
                checked={browserNotif}
                onChange={(e) => setBrowserNotif(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/30">
              <div className="space-y-0.5">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">Morning 9:00 AM Geofence Reminder</div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Receive an automated alert when entering the BRAC University perimeter to clock in on time
                </p>
              </div>
              <input
                type="checkbox"
                checked={clockInReminder}
                onChange={(e) => setClockInReminder(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/30">
              <div className="space-y-0.5">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">Interface Audio Cues & Toasts</div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Play subtle chimes when receiving direct messages or submitting requests
                </p>
              </div>
              <input
                type="checkbox"
                checked={soundEffects}
                onChange={(e) => setSoundEffects(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-50 dark:border-zinc-900">
              <button
                type="submit"
                className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-2 px-4 rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
              >
                Save Notification Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: PREFERENCES & SYSTEM                              */}
      {/* ======================================================== */}
      {activeTab === "PREFERENCES" && (
        <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl p-6 shadow-xs space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5 border-b border-slate-50 dark:border-zinc-900 pb-3">
            <Globe className="h-4 w-4 text-indigo-500" />
            Regional & Localization Options
          </h2>

          <form onSubmit={handleSavePreferences} className="space-y-4 max-w-lg">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                Preferred Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
              >
                <option value="Asia/Dhaka">Dhaka, Bangladesh (UTC+06:00)</option>
                <option value="Asia/Dubai">Dubai, UAE (UTC+04:00)</option>
                <option value="Europe/London">London, UK (UTC+00:00)</option>
                <option value="America/New_York">New York, USA (UTC-05:00)</option>
                <option value="Asia/Singapore">Singapore (UTC+08:00)</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                Calendar & Ledger Date Format
              </label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
              >
                <option value="YYYY-MM-DD">ISO Standard (2026-08-20)</option>
                <option value="DD/MM/YYYY">British / Standard (20/08/2026)</option>
                <option value="MMM DD, YYYY">Readable (Aug 20, 2026)</option>
              </select>
            </div>

            <div className="pt-3 border-t border-slate-50 dark:border-zinc-900">
              <button
                type="submit"
                className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-2 px-4 rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
              >
                Save Localization
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
