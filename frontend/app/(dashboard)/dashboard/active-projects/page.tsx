"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { 
  Layers,
  ArrowLeft,
  Send,
  Trash2,
  Users,
  MessageSquare,
  Calendar as CalendarIcon,
  Briefcase,
  X,
  Plus,
  CheckCircle2,
  Search,
  Filter,
  Clock,
  DollarSign,
  AlertCircle,
  Hash,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Edit3,
  CheckSquare,
  Code,
  Bold,
  Italic,
  List,
  Save,
  Check,
  Eye,
  FileText
} from "lucide-react";
import { useToast } from "@/components/Toast";

interface UserCompact {
  id: string;
  name: string;
  email: string;
}

interface Channel {
  id: string;
  name: string;
  projectId: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: UserCompact;
}

interface Task {
  id: string;
  title: string;
  description: string;
  column: string;
  dueDate?: string;
  assignee?: UserCompact;
  assigneeId?: string;
  createdAt?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  budget: number;
  client?: string;
  priority: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  managerId?: string;
  manager: UserCompact;
  employees: UserCompact[];
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

const getPriorityBadgeClass = (priority: string) => {
  switch (priority?.toUpperCase()) {
    case "HIGH":
      return "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-500/20";
    case "LOW":
      return "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border border-slate-500/20";
    default:
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-500/20";
  }
};

const formatTimeline = (start?: string, end?: string) => {
  if (!start && !end) return "No timeline set";
  const s = start ? new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
  const e = end ? new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
  return `${s} - ${e}`;
};

export default function ActiveProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: sessionData, isPending: sessionLoading } = useSession();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Directory Search & Filters
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [projectStatusTab, setProjectStatusTab] = useState<"ALL" | "ACTIVE" | "PENDING" | "COMPLETED">("ALL");

  // Selected Project Workspace States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Task Creation states with Markdown tab
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskModalTab, setTaskModalTab] = useState<"WRITE" | "PREVIEW">("WRITE");
  const [taskFilterAssignee, setTaskFilterAssignee] = useState<string>("ALL");

  // Right-Side Task Details Drawer State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditingTaskDesc, setIsEditingTaskDesc] = useState(false);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [editingTaskDesc, setEditingTaskDesc] = useState("");
  const [editingTaskTab, setEditingTaskTab] = useState<"WRITE" | "PREVIEW">("WRITE");
  const [savingTaskDetails, setSavingTaskDetails] = useState(false);

  // Chat Drawer State
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    confirmText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  useEffect(() => {
    if (!sessionLoading && !sessionData) {
      router.push("/login");
    }
  }, [sessionData, sessionLoading, router]);

  useEffect(() => {
    if (sessionData) {
      fetchProjects();
    }
  }, [sessionData]);

  // Sync URL search parameters
  useEffect(() => {
    const projectIdParam = searchParams.get("projectId");
    if (projectIdParam && projects.length > 0) {
      const proj = projects.find(p => p.id === projectIdParam);
      if (proj) {
        setSelectedProject(proj);
      }
    } else if (!projectIdParam) {
      setSelectedProject(null);
    }
  }, [searchParams, projects]);

  // Selected Project hook: load tasks and channels
  useEffect(() => {
    if (selectedProject) {
      fetchProjectTasks(selectedProject.id);
      fetchProjectChannels(selectedProject.id);
    } else {
      setTasks([]);
      setChannels([]);
      setSelectedChannel(null);
      setMessages([]);
      setSelectedTask(null);
    }
  }, [selectedProject]);

  // Sync Selected Task when tasks reload
  useEffect(() => {
    if (selectedTask) {
      const fresh = tasks.find(t => t.id === selectedTask.id);
      if (fresh) {
        setSelectedTask(fresh);
        if (!isEditingTaskDesc) {
          setEditingTaskTitle(fresh.title);
          setEditingTaskDesc(fresh.description || "");
        }
      }
    }
  }, [tasks]);

  // Selected Channel polling
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (selectedChannel) {
      fetchChannelMessages(selectedChannel.id);
      interval = setInterval(() => {
        fetchChannelMessages(selectedChannel.id, true);
      }, 4000);
    } else {
      setMessages([]);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedChannel]);

  // Autoscroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/my-projects`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleApproveProject = async (projectId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/approve`, {
        method: "PATCH",
        credentials: "include"
      });
      const data = await safeJson(res);
      if (res.ok) {
        toast.success("Project workspace approved & activated successfully!");
        fetchProjects();
      } else {
        toast.error(data.error || "Failed to approve project.");
      }
    } catch (err) {
      console.error("Failed to approve project:", err);
      toast.error("Internal server error.");
    }
  };

  const handleRequestCompletion = (projectId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Request Project Completion & Settlement",
      message: "Are you sure all milestones are finalized? This will notify HR to review and transfer the budget and team bonus payouts.",
      confirmText: "Submit for Settlement",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/request-completion`, {
            method: "PATCH",
            credentials: "include"
          });
          const data = await safeJson(res);
          if (res.ok) {
            toast.success("Project completion requested! HR has been notified.");
            fetchProjects();
            if (selectedProject) {
              setSelectedProject({ ...selectedProject, status: "PENDING_SETTLEMENT" });
            }
          } else {
            toast.error(data.error || "Failed to request completion.");
          }
        } catch (err) {
          console.error("Complete project error:", err);
          toast.error("Internal server error.");
        }
      }
    });
  };

  const fetchProjectTasks = async (projectId: string) => {
    setLoadingTasks(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tasks`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchProjectChannels = async (projectId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/channels`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
        const chanList = data.channels || [];
        setChannels(chanList);
        setSelectedChannel(prev => {
          if (prev && chanList.some((c: any) => c.id === prev.id)) {
            return prev;
          }
          const general = chanList.find((c: any) => c.name === "general");
          return general || chanList[0] || null;
        });
      }
    } catch (err) {
      console.error("Failed to fetch channels:", err);
    }
  };

  const fetchChannelMessages = async (channelId: string, isSilent = false) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/channels/${channelId}/messages`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
        setMessages(data.messages || []);
      }
    } catch (err) {
      if (!isSilent) console.error("Failed to fetch messages:", err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedProject) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${selectedProject.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDesc.trim() || undefined,
          assigneeId: taskAssignee || undefined,
          dueDate: taskDue || undefined
        }),
        credentials: "include"
      });

      const data = await safeJson(res);
      if (res.ok) {
        toast.success("Kanban task created successfully!");
        setTaskTitle("");
        setTaskDesc("");
        setTaskAssignee("");
        setTaskDue("");
        setShowAddTask(false);
        fetchProjectTasks(selectedProject.id);
      } else {
        toast.error(data.error || "Failed to create task.");
      }
    } catch (err) {
      console.error("Error adding task:", err);
      toast.error("Internal server error.");
    }
  };

  const handleMoveTask = async (taskId: string, targetCol: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ column: targetCol }),
        credentials: "include"
      });
      if (res.ok && selectedProject) {
        fetchProjectTasks(selectedProject.id);
      }
    } catch (err) {
      console.error("Error updating task column:", err);
    }
  };

  const handleUpdateTaskDetails = async (taskId: string, updates: Partial<Task>) => {
    setSavingTaskDetails(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include"
      });
      const data = await safeJson(res);
      if (res.ok) {
        toast.success("Task updated successfully!");
        setIsEditingTaskDesc(false);
        if (selectedProject) {
          fetchProjectTasks(selectedProject.id);
        }
      } else {
        toast.error(data.error || "Failed to update task.");
      }
    } catch (err) {
      toast.error("Internal server error.");
    } finally {
      setSavingTaskDetails(false);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Kanban Task",
      message: "Are you sure you want to permanently delete this task? This action cannot be undone.",
      confirmText: "Delete Task",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/projects/tasks/${taskId}`, {
            method: "DELETE",
            credentials: "include"
          });
          if (res.ok && selectedProject) {
            toast.success("Task removed from board.");
            if (selectedTask?.id === taskId) setSelectedTask(null);
            fetchProjectTasks(selectedProject.id);
          }
        } catch (err) {
          console.error("Error deleting task:", err);
        }
      }
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChannel) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/channels/${selectedChannel.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
        credentials: "include"
      });
      if (res.ok) {
        setNewMessage("");
        fetchChannelMessages(selectedChannel.id, true);
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Helper to insert markdown tags in textarea
  const insertMarkdown = (tagStart: string, tagEnd = "", target: "NEW_TASK" | "EDIT_TASK") => {
    if (target === "NEW_TASK") {
      setTaskDesc(prev => prev + tagStart + tagEnd);
    } else {
      setEditingTaskDesc(prev => prev + tagStart + tagEnd);
    }
  };

  // Filtered Projects Directory
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (projectStatusTab === "ACTIVE" && p.status !== "ACTIVE") return false;
      if (projectStatusTab === "PENDING" && p.status !== "PENDING") return false;
      if (projectStatusTab === "COMPLETED" && (p.status !== "COMPLETED" && p.status !== "PENDING_SETTLEMENT")) return false;

      if (projectSearchQuery.trim()) {
        const q = projectSearchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchCat = p.category?.toLowerCase().includes(q);
        const matchClient = p.client?.toLowerCase().includes(q);
        const matchMgr = p.manager?.name?.toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchClient && !matchMgr) return false;
      }
      return true;
    });
  }, [projects, projectStatusTab, projectSearchQuery]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    if (taskFilterAssignee === "ALL") return tasks;
    return tasks.filter(t => t.assignee?.id === taskFilterAssignee);
  }, [tasks, taskFilterAssignee]);

  if (sessionLoading || !sessionData) return null;

  const isHrOrPm = sessionData.user.role === "HR" || sessionData.user.role === "PROJECT_MANAGER";
  const activeProjectsCount = projects.filter(p => p.status === "ACTIVE").length;
  const pendingProjectsCount = projects.filter(p => p.status === "PENDING").length;
  const completedProjectsCount = projects.filter(p => p.status === "COMPLETED" || p.status === "PENDING_SETTLEMENT").length;

  return (
    <div className="flex-grow flex flex-col space-y-6 font-sans text-slate-900 dark:text-white transition-colors duration-150 text-left relative">
      
      {/* 1. Header Segment */}
      {!selectedProject ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Project Workspaces</h1>
              <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
                Kanban task execution, team sprint delivery & synchronized chat channels
              </p>
            </div>

            {sessionData.user.role === "HR" && (
              <button
                onClick={() => router.push("/dashboard/create-project")}
                className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>Initialize Project</span>
              </button>
            )}
          </div>

          {/* Directory KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Total Workspaces</span>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{projects.length}</span>
                <Briefcase className="h-6 w-6 text-indigo-500 opacity-75" />
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">Allocated Projects</div>
            </div>

            <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Active Sprints</span>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{activeProjectsCount}</span>
                <CheckCircle2 className="h-6 w-6 text-emerald-500 opacity-75" />
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">Live Kanban Boards</div>
            </div>

            <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Awaiting PM Activation</span>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{pendingProjectsCount}</span>
                <Clock className="h-6 w-6 text-amber-500 opacity-75" />
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">Pending Approval</div>
            </div>

            <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Completed & Settled</span>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{completedProjectsCount}</span>
                <DollarSign className="h-6 w-6 text-blue-500 opacity-75" />
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">Archived Milestones</div>
            </div>
          </div>

          {/* Search & Tabs Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs">
            <div className="relative flex items-center w-full sm:w-80 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2">
              <Search className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search workspace, client, manager..."
                value={projectSearchQuery}
                onChange={(e) => setProjectSearchQuery(e.target.value)}
                className="bg-transparent text-xs outline-none text-zinc-900 dark:text-white w-full font-medium"
              />
            </div>

            <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl gap-1 text-[11px] font-bold">
              <button
                onClick={() => setProjectStatusTab("ALL")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  projectStatusTab === "ALL" 
                    ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                All ({projects.length})
              </button>
              <button
                onClick={() => setProjectStatusTab("ACTIVE")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  projectStatusTab === "ACTIVE" 
                    ? "bg-emerald-600 text-white shadow-xs" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Active ({activeProjectsCount})
              </button>
              <button
                onClick={() => setProjectStatusTab("PENDING")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  projectStatusTab === "PENDING" 
                    ? "bg-amber-600 text-white shadow-xs" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Pending ({pendingProjectsCount})
              </button>
              <button
                onClick={() => setProjectStatusTab("COMPLETED")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  projectStatusTab === "COMPLETED" 
                    ? "bg-blue-600 text-white shadow-xs" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Completed ({completedProjectsCount})
              </button>
            </div>
          </div>

          {/* Projects Card Grid */}
          {loadingProjects ? (
            <div className="py-12 text-center text-slate-400 text-xs font-bold">Loading workspaces...</div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map(proj => {
                const isAssignedPm = sessionData.user.role === "PROJECT_MANAGER" && (proj.manager?.id === sessionData.user.id || proj.managerId === sessionData.user.id);
                const isPending = proj.status === "PENDING";

                return (
                  <div
                    key={proj.id}
                    className={`p-6 rounded-3xl border transition-all flex flex-col justify-between h-[280px] bg-white dark:bg-zinc-950 shadow-xs ${
                      isPending 
                        ? "border-amber-200 dark:border-amber-900/40" 
                        : "border-slate-100 dark:border-zinc-900 hover:border-indigo-500/50 hover:shadow-md"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                            {proj.name}
                          </h3>
                          {proj.client && (
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block mt-0.5">
                              Client: {proj.client}
                            </span>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          isPending 
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400" 
                            : proj.status === "COMPLETED"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400"
                        }`}>
                          {proj.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium line-clamp-2 leading-relaxed">
                        {proj.description || "Project parameters defined by HR."}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-900">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Budget</span>
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            ${proj.budget?.toLocaleString() || "0"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Manager</span>
                          <span className="font-extrabold text-slate-900 dark:text-white truncate block">
                            {proj.manager?.name || "Unassigned"}
                          </span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      {isPending && isAssignedPm ? (
                        <button
                          onClick={() => handleApproveProject(proj.id)}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
                        >
                          Approve & Activate Workspace
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedProject(proj);
                            router.push(`/dashboard/active-projects?projectId=${proj.id}`);
                          }}
                          className="w-full bg-slate-100 hover:bg-zinc-950 hover:text-white dark:bg-zinc-900 dark:hover:bg-white dark:hover:text-zinc-950 font-bold py-2 px-4 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                        >
                          <span>Open Workspace</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 dark:border-zinc-900 rounded-3xl">
              No matching project workspaces found.
            </div>
          )}

        </div>
      ) : (
        /* ======================================================== */
        /* 2. SELECTED WORKSPACE FOCUS (KANBAN & CHAT)             */
        /* ======================================================== */
        <div className="space-y-6">
          
          {/* Top Project Focus Bar */}
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setSelectedProject(null);
                  router.push("/dashboard/active-projects");
                }}
                className="p-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer shadow-xs bg-white dark:bg-zinc-950"
                title="Back to Directory"
              >
                <ArrowLeft className="h-4 w-4 text-slate-500" />
              </button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{selectedProject.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${getPriorityBadgeClass(selectedProject.priority)}`}>
                    {selectedProject.priority}
                  </span>
                </h1>
                <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold mt-0.5 flex items-center gap-2">
                  <span>Manager: {selectedProject.manager?.name}</span>
                  <span>&bull;</span>
                  <span>Budget: ${selectedProject.budget?.toLocaleString()}</span>
                  <span>&bull;</span>
                  <span>Timeline: {formatTimeline(selectedProject.startDate, selectedProject.endDate)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Team Chat Drawer Button */}
              <button
                onClick={() => setShowChatDrawer(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Project Chat ({channels.length} Channels)</span>
              </button>

              {/* PM Completion Settlement Button */}
              {(selectedProject.status === "ACTIVE" && (sessionData.user.role === "HR" || selectedProject.manager?.id === sessionData.user.id || selectedProject.managerId === sessionData.user.id)) && (
                <button
                  onClick={() => handleRequestCompletion(selectedProject.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Complete & Settle</span>
                </button>
              )}
            </div>
          </div>

          {/* Kanban Board Container */}
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl p-6 shadow-xs space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Sprint Kanban Board
                </h3>
              </div>

              <div className="flex items-center gap-3">
                {/* Assignee Filter */}
                <select
                  value={taskFilterAssignee}
                  onChange={(e) => setTaskFilterAssignee(e.target.value)}
                  className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none font-bold"
                >
                  <option value="ALL">All Assignees</option>
                  {selectedProject.employees?.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>

                <button
                  onClick={() => setShowAddTask(true)}
                  className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-1.5 px-3.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Task</span>
                </button>
              </div>
            </div>

            {/* Kanban Columns */}
            {loadingTasks ? (
              <div className="py-12 text-center text-slate-400 text-xs font-bold">Synchronizing board...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { col: "TODO", label: "To Do", bg: "bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300" },
                  { col: "IN_PROGRESS", label: "In Progress", bg: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400" },
                  { col: "TESTING", label: "Testing / Review", bg: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400" },
                  { col: "COMPLETED", label: "Completed", bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400" }
                ].map(({ col, label, bg }) => {
                  const colTasks = filteredTasks.filter(t => t.column === col);

                  return (
                    <div
                      key={col}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const taskId = e.dataTransfer.getData("text/plain");
                        handleMoveTask(taskId, col);
                      }}
                      className="flex flex-col space-y-3 min-h-[500px] bg-slate-50/50 dark:bg-zinc-900/20 p-4 rounded-3xl border border-slate-100 dark:border-zinc-900"
                    >
                      <div className={`px-3 py-1.5 rounded-xl text-xs font-extrabold tracking-wider uppercase flex justify-between items-center ${bg}`}>
                        <span>{label}</span>
                        <span className="bg-white/80 dark:bg-zinc-950/80 px-2 py-0.5 rounded-md text-[10px] font-black">{colTasks.length}</span>
                      </div>

                      <div className="flex-grow space-y-3 overflow-y-auto max-h-[480px]">
                        {colTasks.map(task => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
                            onClick={() => {
                              setSelectedTask(task);
                              setEditingTaskTitle(task.title);
                              setEditingTaskDesc(task.description || "");
                              setIsEditingTaskDesc(false);
                            }}
                            className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-slate-200/60 dark:border-zinc-850 shadow-xs space-y-2.5 cursor-pointer hover:border-indigo-500/50 hover:shadow-md transition-all group/card"
                          >
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug group-hover/card:text-indigo-600 dark:group-hover/card:text-indigo-400 transition-colors">
                                {task.title}
                              </h4>
                            </div>

                            {task.description && (
                              <div className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown>{task.description}</ReactMarkdown>
                              </div>
                            )}

                            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-zinc-900 text-[10px] font-bold text-slate-400">
                              <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                                {task.assignee?.name || "Unassigned"}
                              </span>
                              {task.dueDate && (
                                <span>{new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                              )}
                            </div>

                            {/* Move Controls */}
                            <div 
                              className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-zinc-900/60"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex gap-1">
                                {col !== "TODO" && (
                                  <button
                                    onClick={() => handleMoveTask(task.id, "TODO")}
                                    className="text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-900"
                                    title="Move To Do"
                                  >
                                    &larr;
                                  </button>
                                )}
                                {col !== "COMPLETED" && (
                                  <button
                                    onClick={() => {
                                      const nextCol = col === "TODO" ? "IN_PROGRESS" : col === "IN_PROGRESS" ? "TESTING" : "COMPLETED";
                                      handleMoveTask(task.id, nextCol);
                                    }}
                                    className="text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-900"
                                    title="Advance"
                                  >
                                    Advance &rarr;
                                  </button>
                                )}
                              </div>

                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-slate-400 hover:text-rose-600 cursor-pointer p-1 rounded transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* RIGHT-SIDE TASK DETAILS FLYOUT / DRAWER                  */}
      {/* ======================================================== */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl h-full bg-white dark:bg-zinc-950 shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-zinc-800 animate-in slide-in-from-right duration-300 overflow-y-auto">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 dark:border-zinc-900 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/30 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-md">
                  {selectedProject?.name}
                </span>
                <span className="text-xs text-slate-400 font-bold">&bull; Task Details</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteTask(selectedTask.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors"
                  title="Delete Task"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-grow overflow-y-auto">
              
              {/* Task Title */}
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {selectedTask.title}
                </h2>
              </div>

              {/* Status & Properties Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-850 text-xs">
                
                {/* Column / Status */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Column Status</span>
                  <select
                    value={selectedTask.column}
                    onChange={(e) => handleMoveTask(selectedTask.id, e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="TESTING">Testing / Review</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                {/* Assignee */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Assigned Developer</span>
                  <select
                    value={selectedTask.assignee?.id || ""}
                    onChange={(e) => handleUpdateTaskDetails(selectedTask.id, { assigneeId: e.target.value || undefined })}
                    className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="">-- Unassigned --</option>
                    {selectedProject?.employees?.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div className="space-y-1 col-span-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Sprint Deadline</span>
                  <input
                    type="date"
                    value={selectedTask.dueDate ? selectedTask.dueDate.slice(0, 10) : ""}
                    onChange={(e) => handleUpdateTaskDetails(selectedTask.id, { dueDate: e.target.value || undefined })}
                    className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                  />
                </div>

              </div>

              {/* Markdown Description Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-900 pb-2">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-indigo-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Task Description & Specification (Markdown)
                    </span>
                  </div>

                  {!isEditingTaskDesc ? (
                    <button
                      onClick={() => setIsEditingTaskDesc(true)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit Description</span>
                    </button>
                  ) : (
                    <div className="flex bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-lg gap-1 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setEditingTaskTab("WRITE")}
                        className={`px-2.5 py-0.5 rounded-md cursor-pointer ${
                          editingTaskTab === "WRITE" ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs" : "text-slate-400"
                        }`}
                      >
                        Write
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTaskTab("PREVIEW")}
                        className={`px-2.5 py-0.5 rounded-md cursor-pointer ${
                          editingTaskTab === "PREVIEW" ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs" : "text-slate-400"
                        }`}
                      >
                        Preview
                      </button>
                    </div>
                  )}
                </div>

                {!isEditingTaskDesc ? (
                  <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-850 min-h-[140px]">
                    {selectedTask.description ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-xs text-slate-800 dark:text-zinc-200 leading-relaxed font-normal space-y-2">
                        <ReactMarkdown>{selectedTask.description}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No description provided. Click "Edit Description" to add rich markdown specs or checklists.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {/* Markdown Formatting Toolbar */}
                    {editingTaskTab === "WRITE" && (
                      <div className="flex items-center gap-1 p-1.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-500">
                        <button
                          type="button"
                          onClick={() => insertMarkdown("**", "**", "EDIT_TASK")}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded cursor-pointer"
                          title="Bold"
                        >
                          <Bold className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdown("*", "*", "EDIT_TASK")}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded cursor-pointer"
                          title="Italic"
                        >
                          <Italic className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdown("`", "`", "EDIT_TASK")}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded cursor-pointer"
                          title="Inline Code"
                        >
                          <Code className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdown("\n- ", "", "EDIT_TASK")}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded cursor-pointer"
                          title="Bullet List"
                        >
                          <List className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdown("\n- [ ] ", "", "EDIT_TASK")}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded cursor-pointer"
                          title="Task Checklist"
                        >
                          <CheckSquare className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {editingTaskTab === "WRITE" ? (
                      <textarea
                        rows={7}
                        value={editingTaskDesc}
                        onChange={(e) => setEditingTaskDesc(e.target.value)}
                        placeholder="Write task acceptance criteria, code blocks, or checklists in Markdown..."
                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-600 font-mono resize-none"
                      />
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 min-h-[160px] prose prose-sm dark:prose-invert max-w-none text-xs text-slate-900 dark:text-white">
                        {editingTaskDesc ? (
                          <ReactMarkdown>{editingTaskDesc}</ReactMarkdown>
                        ) : (
                          <span className="text-slate-400 italic">Preview is empty.</span>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingTaskDesc(false);
                          setEditingTaskDesc(selectedTask.description || "");
                        }}
                        className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold py-1.5 px-3.5 rounded-xl text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={savingTaskDetails}
                        onClick={() => handleUpdateTaskDetails(selectedTask.id, { description: editingTaskDesc })}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer shadow-xs flex items-center gap-1.5"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>{savingTaskDetails ? "Saving..." : "Save Markdown"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-zinc-900 bg-slate-50/30 dark:bg-zinc-900/20 flex justify-between items-center text-[10px] text-slate-400 font-bold shrink-0">
              <span>Task ID: {selectedTask.id.slice(-8)}</span>
              <span>Project: {selectedProject?.name}</span>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD TASK (WITH MARKDOWN TABS)                     */}
      {/* ======================================================== */}
      {showAddTask && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl shadow-xl max-w-lg w-full p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-zinc-900">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Create Kanban Task</h3>
              <button onClick={() => setShowAddTask(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement OAuth integration or design database schema"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Assign Developer</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  >
                    <option value="">-- Unassigned --</option>
                    {selectedProject.employees?.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Sprint Due Date</label>
                  <input
                    type="date"
                    value={taskDue}
                    onChange={(e) => setTaskDue(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  />
                </div>
              </div>

              {/* Description with Markdown Tabs & Helper */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                    Task Specification (Markdown Supported)
                  </label>
                  
                  <div className="flex bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-lg gap-1 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setTaskModalTab("WRITE")}
                      className={`px-2.5 py-0.5 rounded-md cursor-pointer ${
                        taskModalTab === "WRITE" ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs" : "text-slate-400"
                      }`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskModalTab("PREVIEW")}
                      className={`px-2.5 py-0.5 rounded-md cursor-pointer ${
                        taskModalTab === "PREVIEW" ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs" : "text-slate-400"
                      }`}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {taskModalTab === "WRITE" ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-500">
                      <button
                        type="button"
                        onClick={() => insertMarkdown("**", "**", "NEW_TASK")}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded cursor-pointer"
                        title="Bold"
                      >
                        <Bold className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown("*", "*", "NEW_TASK")}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded cursor-pointer"
                        title="Italic"
                      >
                        <Italic className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown("`", "`", "NEW_TASK")}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded cursor-pointer"
                        title="Inline Code"
                      >
                        <Code className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown("\n- ", "", "NEW_TASK")}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded cursor-pointer"
                        title="Bullet List"
                      >
                        <List className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown("\n- [ ] ", "", "NEW_TASK")}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded cursor-pointer"
                        title="Task Checklist"
                      >
                        <CheckSquare className="h-3 w-3" />
                      </button>
                    </div>

                    <textarea
                      rows={4}
                      placeholder="Type details, checklists, acceptance criteria, or code snippets..."
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-mono resize-none"
                    />
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 min-h-[110px] prose prose-sm dark:prose-invert max-w-none text-xs text-slate-900 dark:text-white">
                    {taskDesc ? (
                      <ReactMarkdown>{taskDesc}</ReactMarkdown>
                    ) : (
                      <span className="text-slate-400 italic">Nothing to preview.</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SLACK-STYLE SPLIT CHAT DRAWER                            */}
      {/* ======================================================== */}
      {showChatDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl h-full bg-white dark:bg-zinc-950 shadow-2xl flex border-l border-slate-200 dark:border-zinc-800 animate-in slide-in-from-right duration-300">
            
            {/* Left Aubergine Pane: Channels List */}
            <div className="w-56 bg-[#3F0E40] text-white p-4 flex flex-col justify-between shrink-0 select-none">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-200 truncate">
                    {selectedProject?.name || "Channels"}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest block px-2">
                    Channels
                  </span>
                  {channels.map(chan => (
                    <button
                      key={chan.id}
                      onClick={() => setSelectedChannel(chan)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer truncate ${
                        selectedChannel?.id === chan.id 
                          ? "bg-[#1164A3] text-white shadow-xs" 
                          : "text-purple-200 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Hash className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span className="truncate">{chan.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-purple-300 border-t border-white/10 pt-3">
                Team Workspace Chat
              </div>
            </div>

            {/* Right Pane: Message Stream */}
            <div className="flex-1 flex flex-col justify-between bg-white dark:bg-zinc-950 text-slate-900 dark:text-white">
              
              {/* Top Bar */}
              <div className="h-14 px-6 border-b border-slate-100 dark:border-zinc-900 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-slate-400" />
                  <span className="font-extrabold text-sm">{selectedChannel?.name || "general"}</span>
                </div>
                <button
                  onClick={() => setShowChatDrawer(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Messages Scroll Area */}
              <div ref={chatContainerRef} className="flex-grow p-6 overflow-y-auto space-y-4">
                {messages.length > 0 ? (
                  messages.map(msg => {
                    const isMe = msg.sender?.id === sessionData.user.id;

                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        {!isMe && (
                          <span className="text-[10px] font-bold text-slate-400 mb-1">
                            {msg.sender?.name || "Teammate"}
                          </span>
                        )}
                        <div className={`max-w-md p-3.5 rounded-2xl text-xs font-medium ${
                          isMe 
                            ? "bg-[#1164A3] text-white rounded-br-xs shadow-xs" 
                            : "bg-slate-100 dark:bg-zinc-900 text-slate-900 dark:text-white rounded-bl-xs"
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-[9px] text-slate-400 mt-1 font-mono">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-20 text-center text-slate-400 text-xs font-bold">
                    No messages yet in #{selectedChannel?.name || "general"}. Start the discussion!
                  </div>
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-zinc-900 flex gap-2">
                <input
                  type="text"
                  placeholder={`Message #${selectedChannel?.name || "general"}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-600 font-medium"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-[#1164A3] hover:bg-[#0d4f82] text-white p-2.5 rounded-xl cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

            </div>

          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl shadow-xl max-w-md w-full p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{confirmModal.title}</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">{confirmModal.message}</p>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50 dark:border-zinc-900">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer shadow-xs"
              >
                {confirmModal.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
