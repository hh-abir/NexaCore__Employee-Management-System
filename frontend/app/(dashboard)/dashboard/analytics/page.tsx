"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Users, 
  DollarSign, 
  Clock, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Award, 
  Building, 
  RefreshCw,
  Zap,
  Activity,
  Check
} from "lucide-react";
import { useToast } from "@/components/Toast";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DepartmentStat {
  department: string;
  headcount: number;
  totalSalary: number;
  percentage: number;
}

interface AttendanceDay {
  day: string;
  present: number;
  late: number;
  remote: number;
}

interface PayrollHistoryItem {
  month: string;
  grossSalary: number;
  bonuses: number;
  loans: number;
}

interface TaskDistItem {
  column: string;
  count: number;
  percentage: number;
}

interface ProjectVelocityItem {
  id: string;
  name: string;
  category: string;
  status: string;
  budget: number;
  totalTasks: number;
  completedTasks: number;
  progress: number;
  managerName: string;
}

interface AnalyticsData {
  summary: {
    totalHeadcount: number;
    activeEmployees: number;
    projectManagers: number;
    hrAdministrators: number;
    monthlyPayroll: number;
    activeSprints: number;
    completedProjects: number;
    totalProjectBudget: number;
    taskCompletionRate: number;
    punctualityRate: number;
    remoteRatio: number;
    avgReviewScore: number;
    grievanceResolutionRate: number;
    totalDisbursedLoans: number;
    totalPolls: number;
    totalRoomBookings: number;
  };
  departmentStats: DepartmentStat[];
  weeklyAttendanceTrend: AttendanceDay[];
  payrollHistory: PayrollHistoryItem[];
  taskDistribution: TaskDistItem[];
  projectVelocities: ProjectVelocityItem[];
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

export default function AnalyticsPage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionLoading } = useSession();
  const { toast } = useToast();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "ATTENDANCE" | "PAYROLL" | "PROJECTS" | "PERFORMANCE">("OVERVIEW");

  useEffect(() => {
    if (!sessionLoading && !sessionData) {
      router.push("/login");
    }
  }, [sessionData, sessionLoading, router]);

  useEffect(() => {
    if (sessionData) {
      fetchAnalytics();
    }
  }, [sessionData]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics/overview`, {
        credentials: "include"
      });
      if (res.ok) {
        const json = await safeJson(res);
        setData(json);
      } else {
        toast.error("Failed to load business intelligence data.");
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
      toast.error("Internal server error.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Chart.js Data Configurations
  const payrollChartData = useMemo(() => {
    if (!data) return { labels: [], datasets: [] };
    return {
      labels: data.payrollHistory.map(p => p.month),
      datasets: [
        {
          label: "Base Salary ($)",
          data: data.payrollHistory.map(p => p.grossSalary),
          backgroundColor: "#10B981",
          borderRadius: 6
        },
        {
          label: "Milestone Bonuses ($)",
          data: data.payrollHistory.map(p => p.bonuses),
          backgroundColor: "#F59E0B",
          borderRadius: 6
        }
      ]
    };
  }, [data]);

  const attendanceChartData = useMemo(() => {
    if (!data) return { labels: [], datasets: [] };
    return {
      labels: data.weeklyAttendanceTrend.map(d => d.day),
      datasets: [
        {
          label: "On-Time Campus",
          data: data.weeklyAttendanceTrend.map(d => d.present),
          backgroundColor: "#3B82F6",
          borderRadius: 6
        },
        {
          label: "Late Check-in",
          data: data.weeklyAttendanceTrend.map(d => d.late),
          backgroundColor: "#EF4444",
          borderRadius: 6
        },
        {
          label: "Remote WFH",
          data: data.weeklyAttendanceTrend.map(d => d.remote),
          backgroundColor: "#8B5CF6",
          borderRadius: 6
        }
      ]
    };
  }, [data]);

  const departmentChartData = useMemo(() => {
    if (!data) return { labels: [], datasets: [] };
    return {
      labels: data.departmentStats.map(d => d.department),
      datasets: [
        {
          data: data.departmentStats.map(d => d.headcount),
          backgroundColor: ["#6366F1", "#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EC4899"],
          borderWidth: 0
        }
      ]
    };
  }, [data]);

  const taskPipelineChartData = useMemo(() => {
    if (!data) return { labels: [], datasets: [] };
    return {
      labels: data.taskDistribution.map(t => t.column),
      datasets: [
        {
          data: data.taskDistribution.map(t => t.count),
          backgroundColor: ["#94A3B8", "#3B82F6", "#F59E0B", "#10B981"],
          borderWidth: 0
        }
      ]
    };
  }, [data]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          boxWidth: 12,
          font: { size: 11, weight: 600 as any }
        }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: "rgba(200, 200, 200, 0.15)" } }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          boxWidth: 12,
          font: { size: 11, weight: 600 as any }
        }
      }
    }
  };

  if (sessionLoading || !sessionData) return null;

  return (
    <div className="flex-grow flex flex-col space-y-6 font-sans text-slate-900 dark:text-white transition-colors duration-150 text-left">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Executive Reports & Analytics</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              Chart.js Visual BI
            </span>
          </h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
            Cross-functional business intelligence, workforce attendance trends, payroll outlays & sprint velocity heatmaps
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer shadow-xs transition-all"
            title="Refresh Metrics"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handlePrint}
            className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95"
          >
            <Printer className="h-4 w-4" />
            <span>Export BI Report</span>
          </button>
        </div>
      </div>

      {loading || !data ? (
        <div className="py-24 text-center text-slate-400 text-xs font-bold space-y-2">
          <Activity className="h-8 w-8 text-indigo-500 animate-pulse mx-auto opacity-70" />
          <p>Compiling corporate business intelligence streams...</p>
        </div>
      ) : (
        <>
          {/* Top 4 Executive KPI Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                <span>Active Headcount</span>
                <Users className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {data.summary.totalHeadcount}
                </span>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                  {data.summary.activeEmployees} Devs
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                {data.summary.projectManagers} PMs &bull; {data.summary.hrAdministrators} HR
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                <span>Monthly Payroll Outlay</span>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  ${data.summary.monthlyPayroll.toLocaleString()}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                Gross Monthly Base Outlay
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                <span>Sprint Task Velocity</span>
                <Zap className="h-4 w-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                  {data.summary.taskCompletionRate}%
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {data.summary.activeSprints} Live Sprints
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                Completed vs Sprint Backlog
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                <span>Workforce Punctuality</span>
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                  {data.summary.punctualityRate}%
                </span>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md">
                  {data.summary.remoteRatio}% WFH
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                30-Day On-Time Index
              </div>
            </div>
          </div>

          {/* Navigation Filter Tabs */}
          <div className="flex bg-slate-100 dark:bg-zinc-900 p-1.5 rounded-2xl gap-1 text-xs font-bold overflow-x-auto">
            {[
              { id: "OVERVIEW", label: "Executive Overview", icon: BarChart3 },
              { id: "ATTENDANCE", label: "Attendance & Remote", icon: Clock },
              { id: "PAYROLL", label: "Payroll & Compensation", icon: DollarSign },
              { id: "PROJECTS", label: "Sprint Velocity & Kanban", icon: Briefcase },
              { id: "PERFORMANCE", label: "Department & Health", icon: Award }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {(activeTab === "OVERVIEW" || activeTab === "PAYROLL") && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Monthly Payroll Trajectory Visual Bar Chart */}
              <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-900">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                      <span>6-Month Payroll Outlay (Chart.js)</span>
                    </h3>
                    <span className="text-[10px] text-slate-400 font-semibold">Gross base compensation & milestone payouts</span>
                  </div>
                  <span className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                    ${data.summary.monthlyPayroll.toLocaleString()} / mo
                  </span>
                </div>

                {/* Chart.js Bar Component */}
                <div className="h-64 w-full">
                  <Bar data={payrollChartData} options={chartOptions} />
                </div>
              </div>

              {/* Department Headcount & Resource Allocation Doughnut Chart */}
              <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-900">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Building className="h-4 w-4 text-indigo-500" />
                      <span>Department Staff Distribution</span>
                    </h3>
                    <span className="text-[10px] text-slate-400 font-semibold">Headcount breakdown per organizational unit</span>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <Doughnut data={departmentChartData} options={doughnutOptions} />
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ATTENDANCE & REMOTE TRENDS */}
          {(activeTab === "OVERVIEW" || activeTab === "ATTENDANCE") && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* 7-Day Weekly Attendance Clustered Bar Chart */}
              <div className="lg:col-span-2 bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-900">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span>Weekly Attendance Heatmap (Chart.js)</span>
                    </h3>
                    <span className="text-[10px] text-slate-400 font-semibold">Campus check-ins, late arrivals & remote WFH sessions</span>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <Bar data={attendanceChartData} options={chartOptions} />
                </div>
              </div>

              {/* Punctuality Ring Gauge */}
              <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span>Punctuality & Reliability</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold">Geofenced check-in precision</span>
                </div>

                <div className="flex flex-col items-center justify-center space-y-3 py-4">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-100 dark:text-zinc-800"
                        strokeWidth="3.8"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-emerald-500"
                        strokeDasharray={`${data.summary.punctualityRate}, 100`}
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {data.summary.punctualityRate}%
                      </span>
                      <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">
                        On-Time
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-2xl text-[11px] text-slate-500 dark:text-zinc-400 text-center font-medium">
                  {data.summary.punctualityRate >= 90 ? "Excellent workforce attendance discipline." : "Attendance requires managerial review."}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: PROJECT VELOCITY & SPRINT PROGRESS */}
          {(activeTab === "OVERVIEW" || activeTab === "PROJECTS") && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Task Distribution Doughnut */}
              <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-500" />
                    <span>Sprint Pipeline Distribution</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold">Kanban column volume</span>
                </div>

                <div className="h-56 w-full">
                  <Doughnut data={taskPipelineChartData} options={doughnutOptions} />
                </div>
              </div>

              {/* Active Workspace Sprints Delivery Matrix */}
              <div className="lg:col-span-2 bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-900">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-amber-500" />
                      <span>Project Velocity & Delivery Health</span>
                    </h3>
                    <span className="text-[10px] text-slate-400 font-semibold">Live milestone execution across workspaces</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    Budget Total: ${data.summary.totalProjectBudget.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-64">
                  {data.projectVelocities.map(proj => (
                    <div 
                      key={proj.id}
                      className="p-3.5 bg-slate-50 dark:bg-zinc-900/40 rounded-2xl border border-slate-100 dark:border-zinc-850 flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">{proj.name}</span>
                          <span className="text-[9px] font-black uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded">
                            {proj.category}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Manager: {proj.managerName} &bull; Budget: ${proj.budget?.toLocaleString() || "0"}
                        </span>
                      </div>

                      <div className="w-full sm:w-48 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-slate-500">{proj.completedTasks}/{proj.totalTasks} Tasks</span>
                          <span className="text-indigo-600 dark:text-indigo-400">{proj.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${proj.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: PERFORMANCE EVALUATIONS & GRIEVANCE HEALTH */}
          {(activeTab === "OVERVIEW" || activeTab === "PERFORMANCE") && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Performance Review Average</span>
                  <Award className="h-4 w-4 text-amber-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                    {data.summary.avgReviewScore} / 5.0
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  Aggregated from 360° quarterly employee peer reviews.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Grievance Resolution Rate</span>
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {data.summary.grievanceResolutionRate}%
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  Confidential incidents reviewed and resolved by HR.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Disbursed Staff Loans</span>
                  <DollarSign className="h-4 w-4 text-purple-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                    ${data.summary.totalDisbursedLoans.toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  Active company-assisted financial relief disbursements.
                </p>
              </div>

            </div>
          )}

        </>
      )}

    </div>
  );
}
