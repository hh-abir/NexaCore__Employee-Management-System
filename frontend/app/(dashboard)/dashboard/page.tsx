"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  TrendingUp, 
  Layers,
  ArrowRight,
  ChevronDown,
  Plus,
  X,
  ArrowLeft,
  Send,
  Trash2,
  Users,
  MessageSquare,
  Calendar as CalendarIcon,
  ChevronRight,
  CheckCircle2,
  Briefcase
} from "lucide-react";

interface UserCompact {
  id: string;
  name: string;
  email: string;
}

interface Channel {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  manager: UserCompact;
  employees: UserCompact[];
  channels: Channel[];
  budget: number;
  client?: string;
  startDate?: string;
  endDate?: string;
  priority: string;
  category?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  column: string; // TODO, IN_PROGRESS, TESTING, COMPLETED
  dueDate?: string;
  assignee?: UserCompact;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: UserCompact;
}

const formatTimeline = (start?: string, end?: string) => {
  if (!start && !end) return "No timeline";
  const s = start ? new Date(start).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";
  const e = end ? new Date(end).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";
  return s && e ? `${s} - ${e}` : s || e;
};

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

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: sessionData, isPending: sessionLoading } = useSession();

  // Active View States
  const [activeTab, setActiveTab] = useState<"Overview" | "Projects">("Overview");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Projects & Onboarding States
  const [projects, setProjects] = useState<Project[]>([]);
  const [freeEmployees, setFreeEmployees] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingFree, setLoadingFree] = useState(false);

  // Project Form States
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // Extra Project Details States
  const [projBudget, setProjBudget] = useState("");
  const [projClient, setProjClient] = useState("");
  const [projStart, setProjStart] = useState("");
  const [projEnd, setProjEnd] = useState("");
  const [projPriority, setProjPriority] = useState("MEDIUM");
  const [projCategory, setProjCategory] = useState("");
  const [managers, setManagers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selectedManager, setSelectedManager] = useState("");
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");

  // Toast Notification State
  interface Toast {
    id: string;
    message: string;
    type: "success" | "error" | "info";
  }
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Confirmation Modal State
  interface ConfirmModalState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    confirmText?: string;
    cancelText?: string;
    type?: "success" | "danger" | "warning" | "info";
  }
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "info"
  });

  const triggerConfirm = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    options?: { confirmText?: string; cancelText?: string; type?: "success" | "danger" | "warning" | "info" }
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        await onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      confirmText: options?.confirmText || "Confirm",
      cancelText: options?.cancelText || "Cancel",
      type: options?.type || "info"
    });
  };

  // Sync URL search parameters with dashboard active views
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const createParam = searchParams.get("create");
    const projectIdParam = searchParams.get("projectId");

    if (tabParam === "Projects") {
      setActiveTab("Projects");
      if (createParam === "true") {
        setShowCreateProject(true);
        setSelectedProject(null);
      } else {
        setShowCreateProject(false);
        if (projectIdParam) {
          const proj = projects.find(p => p.id === projectIdParam);
          if (proj) {
            setSelectedProject(proj);
          } else {
            setSelectedProject(null);
          }
        } else {
          setSelectedProject(null);
        }
      }
    } else {
      setActiveTab("Overview");
      setShowCreateProject(false);
      setSelectedProject(null);
    }
  }, [searchParams, projects]);

  // Selected Project Workspace States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Task Form States
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDue, setTaskDue] = useState("");

  // Chat Drawer State
  const [showChatDrawer, setShowChatDrawer] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Security Redirect
  useEffect(() => {
    if (!sessionLoading && !sessionData) {
      router.push("/login");
    }
  }, [sessionData, sessionLoading, router]);

  // Load Projects on load
  useEffect(() => {
    if (sessionData) {
      fetchProjects();
    }
  }, [sessionData]);

  // Load Free Employees & Managers when project form is opened
  useEffect(() => {
    if (showCreateProject) {
      fetchFreeEmployees();
      fetchManagers();
    }
  }, [showCreateProject]);

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
    }
  }, [selectedProject]);

  // Selected Channel hook: load messages & start polling
  useEffect(() => {
    let interval: any;
    if (selectedChannel) {
      fetchChannelMessages(selectedChannel.id);
      // Auto poll messages every 4 seconds to keep chat alive
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

  // Scroll to bottom on new messages inside the chat container container
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  // API Calls
  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch("http://localhost:5000/api/projects/my-projects", {
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchFreeEmployees = async () => {
    setLoadingFree(true);
    try {
      const res = await fetch("http://localhost:5000/api/projects/free-employees", {
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        setFreeEmployees(data.employees || []);
      }
    } catch (err) {
      console.error("Failed to fetch free employees:", err);
    } finally {
      setLoadingFree(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/projects/managers", {
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        setManagers(data.managers || []);
      }
    } catch (err) {
      console.error("Failed to fetch managers:", err);
    }
  };

  const handleApproveProject = (projectId: string) => {
    triggerConfirm(
      "Approve & Initialize Workspace",
      "Are you sure you want to approve and activate this project? This will initialize the communication channels and Kanban board for assigned team members.",
      async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/projects/${projectId}/approve`, {
            method: "PATCH",
            credentials: "include"
          });
          const data = await res.json();
          if (res.ok) {
            showToast("Project approved and activated successfully!", "success");
            fetchProjects();
          } else {
            showToast(data.error || "Failed to approve project.", "error");
          }
        } catch (err) {
          console.error("Failed to approve project:", err);
        }
      },
      { confirmText: "Approve & Activate", type: "success" }
    );
  };

  const fetchProjectTasks = async (projectId: string) => {
    setLoadingTasks(true);
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${projectId}/tasks`, {
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
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
      const res = await fetch(`http://localhost:5000/api/projects/${projectId}/channels`, {
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        const chanList = data.channels || [];
        setChannels(chanList);
        // Only set default if the current selectedChannel is null, or no longer exists in the loaded list
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
      const res = await fetch(`http://localhost:5000/api/projects/channels/${channelId}/messages`, {
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      if (!isSilent) console.error("Failed to fetch messages:", err);
    }
  };

  // Submissions
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName) return;

    try {
      const res = await fetch("http://localhost:5000/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projName,
          description: projDesc,
          managerId: selectedManager,
          employeeIds: selectedEmployees,
          budget: projBudget || undefined,
          client: projClient || undefined,
          startDate: projStart || undefined,
          endDate: projEnd || undefined,
          priority: projPriority,
          category: projCategory || undefined
        }),
        credentials: "include"
      });

      if (res.ok) {
        showToast("Project created successfully!", "success");
        setProjName("");
        setProjDesc("");
        setSelectedEmployees([]);
        setSelectedManager("");
        setProjBudget("");
        setProjClient("");
        setProjStart("");
        setProjEnd("");
        setProjPriority("MEDIUM");
        setProjCategory("");
        setEmployeeSearchQuery("");
        router.push("/dashboard?tab=Projects");
        fetchProjects();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to create project.", "error");
      }
    } catch (err) {
      console.error("Error creating project:", err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !selectedProject) return;

    try {
      const res = await fetch(`http://localhost:5000/api/projects/${selectedProject.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc,
          assigneeId: taskAssignee || undefined,
          dueDate: taskDue || undefined
        }),
        credentials: "include"
      });

      if (res.ok) {
        setTaskTitle("");
        setTaskDesc("");
        setTaskAssignee("");
        setTaskDue("");
        setShowAddTask(false);
        fetchProjectTasks(selectedProject.id);
      }
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const handleMoveTask = async (taskId: string, targetCol: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/projects/tasks/${taskId}`, {
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

  const handleDeleteTask = (taskId: string) => {
    triggerConfirm(
      "Delete Kanban Task",
      "Are you sure you want to permanently delete this task? This action cannot be undone.",
      async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/projects/tasks/${taskId}`, {
            method: "DELETE",
            credentials: "include"
          });
          if (res.ok && selectedProject) {
            showToast("Task deleted successfully.", "success");
            fetchProjectTasks(selectedProject.id);
          }
        } catch (err) {
          console.error("Error deleting task:", err);
        }
      },
      { confirmText: "Delete Task", type: "danger" }
    );
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChannel) return;

    try {
      const res = await fetch(`http://localhost:5000/api/projects/channels/${selectedChannel.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
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

  const toggleEmployeeSelection = (id: string) => {
    setSelectedEmployees(prev => {
      if (prev.includes(id)) {
        return prev.filter(empId => empId !== id);
      } else {
        if (prev.length >= 5) {
          showToast("You can assign a maximum of 5 employees per project.", "error");
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  if (sessionLoading || !sessionData) return null;

  const isHrOrPm = sessionData.user.role === "HR" || sessionData.user.role === "PROJECT_MANAGER";

  return (
    <div className="flex-grow flex flex-col space-y-6 font-sans text-slate-900 dark:text-white transition-colors duration-150">
      
      {/* 1. Header Segment */}
      {!selectedProject ? (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {activeTab === "Overview" ? (
            <div className="text-left">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
              <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
                Unified workspace manager
              </p>
            </div>
          ) : (
            <div className="text-left">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Projects</h1>
              <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
                Manage timelines, resource allocation, and Kanban tasks
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left border-b border-slate-100 dark:border-zinc-900 pb-5">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/dashboard?tab=Projects")}
              className="p-2 border border-slate-200 dark:border-zinc-800 rounded-xl hover:bg-white dark:hover:bg-zinc-900 transition-all cursor-pointer shadow-xs bg-slate-50 dark:bg-zinc-950 shrink-0"
            >
              <ArrowLeft className="h-4 w-4 text-slate-500" />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{selectedProject.name}</h1>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-2">
                <span>Manager: {selectedProject.manager.name} ({selectedProject.manager.email})</span>
                <button
                  onClick={() => setShowChatDrawer(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-extrabold tracking-wider uppercase cursor-pointer flex items-center gap-1.5 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat Channels ({channels.length})
                </button>
              </p>
            </div>
          </div>

          {/* Horizontal Details Bar */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-bold text-slate-400">
            {selectedProject.client && (
              <div className="flex flex-col">
                <span className="text-[8px] uppercase tracking-wider opacity-75">Client</span>
                <span className="text-slate-900 dark:text-white">{selectedProject.client}</span>
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-[8px] uppercase tracking-wider opacity-75">Budget</span>
              <span className="text-slate-900 dark:text-white">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(selectedProject.budget)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] uppercase tracking-wider opacity-75">Timeline</span>
              <span className="text-slate-900 dark:text-white">{formatTimeline(selectedProject.startDate, selectedProject.endDate)}</span>
            </div>
            {selectedProject.category && (
              <div className="flex flex-col">
                <span className="text-[8px] uppercase tracking-wider opacity-75">Category</span>
                <span className="text-slate-900 dark:text-white">{selectedProject.category}</span>
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-[8px] uppercase tracking-wider opacity-75">Priority</span>
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider text-center ${getPriorityBadgeClass(selectedProject.priority)}`}>
                {selectedProject.priority}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW: PROJECT WORKSPACE FOCUS                            */}
      {/* ======================================================== */}
      {selectedProject ? (
        <div className="w-full">
          
          {/* A. Fixed Kanban Board */}
          <div className="bg-white dark:bg-zinc-950 border-none shadow-sm rounded-2xl p-6 flex flex-col space-y-6">
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-zinc-900">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-slate-400" />
                Project Kanban Board
              </h3>

              <button 
                onClick={() => setShowAddTask(true)}
                className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-1.5 px-3 rounded-lg text-[10px] flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add Task
              </button>
            </div>

            {/* Columns Row */}
            {loadingTasks ? (
              <div className="py-12 text-center text-slate-400 text-xs font-bold">Synchronizing board...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {["TO_DO", "IN_PROGRESS", "TESTING", "COMPLETED"].map(col => {
                  const colTasks = tasks.filter(t => t.column === col);
                  const displayTitle = col === "TO_DO" ? "To Do" : col === "IN_PROGRESS" ? "In Progress" : col === "TESTING" ? "Testing" : "Completed";
                  const headerBg = col === "TO_DO" ? "bg-slate-100/50 dark:bg-zinc-900" : col === "IN_PROGRESS" ? "bg-blue-500/10 text-blue-700 dark:text-blue-400" : col === "TESTING" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
                  
                  return (
                    <div 
                      key={col} 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const taskId = e.dataTransfer.getData("text/plain");
                        handleMoveTask(taskId, col);
                      }}
                      className="flex flex-col space-y-4 min-h-[480px] bg-slate-50/30 dark:bg-zinc-900/10 p-4 rounded-2xl border border-slate-100/20"
                    >
                      <div className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase text-left flex justify-between items-center ${headerBg}`}>
                        <span>{displayTitle}</span>
                        <span className="bg-white/70 dark:bg-zinc-900/50 px-2 py-0.5 rounded text-[10px]">{colTasks.length}</span>
                      </div>

                      <div className="flex-grow space-y-3.5 overflow-y-auto max-h-[450px]">
                        {colTasks.map(task => (
                          <div 
                            key={task.id}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
                            className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-150/40 dark:border-zinc-900/60 shadow-xs text-left space-y-2 cursor-grab active:cursor-grabbing hover:border-slate-350 dark:hover:border-zinc-700 transition-all"
                          >
                            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-snug">{task.title}</h4>
                            {task.description && (
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal leading-relaxed line-clamp-2">{task.description}</p>
                            )}

                            <div className="flex justify-between items-center pt-2.5 border-t border-slate-50 dark:border-zinc-900 text-[10px] font-bold text-slate-550 dark:text-zinc-400">
                              <span>{task.assignee ? task.assignee.name.split(" ").map((n: string) => n[0]).join("") : "UA"}</span>
                              {task.dueDate && <span>{new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                            </div>

                            <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-50/50 dark:border-zinc-900/40">
                              {col !== "TO_DO" && (
                                <button 
                                  onClick={() => handleMoveTask(task.id, "TO_DO")}
                                  title="Move to To Do" 
                                  className="p-1 text-xs hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-500 rounded cursor-pointer"
                                >
                                  &larr;
                                </button>
                              )}
                              {col !== "COMPLETED" && (
                                <button 
                                  onClick={() => {
                                    const nextCol = col === "TO_DO" ? "IN_PROGRESS" : col === "IN_PROGRESS" ? "TESTING" : "COMPLETED";
                                    handleMoveTask(task.id, nextCol);
                                  }}
                                  title="Move Forward" 
                                  className="p-1 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-500 rounded cursor-pointer font-bold text-[10px]"
                                >
                                  Workspace &rarr;
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteTask(task.id)}
                                title="Delete" 
                                className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
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
      ) : (
        <>
          {/* ======================================================== */}
          {/* VIEW: MAIN OVERVIEW DASHBOARD                            */}
          {/* ======================================================== */}
          {activeTab === "Overview" && (
            <>
              {/* KPI Hero Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Analytics card */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-950 rounded-2xl p-6 border-none shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <div className="space-y-4 text-left">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                        Dashboard Overview
                      </span>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                        Analytics Dashboard
                      </h2>
                    </div>

                    <div className="flex items-center gap-8 pt-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Earnings</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-extrabold">$14,248.00</span>
                          <span className="inline-flex items-center text-[9px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                            +3.3%
                          </span>
                        </div>
                      </div>

                      <div className="w-px h-10 bg-slate-100 dark:bg-zinc-900" />

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Expenses</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-extrabold">$4,102.50</span>
                          <span className="inline-flex items-center text-[9px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 px-1.5 py-0.5 rounded-full">
                            -1.5%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full sm:w-44 h-28 bg-slate-50 dark:bg-zinc-900/50 rounded-xl flex items-center justify-center border border-slate-100 dark:border-zinc-800 shrink-0">
                    <svg className="w-20 h-20 text-slate-300 dark:text-zinc-700" viewBox="0 0 100 100" fill="currentColor">
                      <rect x="15" y="65" width="70" height="4" rx="2" />
                      <rect x="35" y="45" width="30" height="20" rx="1" />
                      <line x1="50" y1="65" x2="50" y2="72" stroke="currentColor" strokeWidth="2" />
                      <circle cx="50" cy="30" r="10" />
                    </svg>
                  </div>
                </div>

                {/* Right stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                  <div className="bg-white dark:bg-zinc-900 border-none shadow-sm rounded-2xl p-5 flex flex-col justify-between h-[120px] relative text-left">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Weekly Sales</span>
                        <h3 className="text-xl font-extrabold mt-1">$1,200.00</h3>
                      </div>
                      <div className="p-1.5 border border-slate-100 dark:border-zinc-800 rounded-full text-slate-400 dark:text-zinc-400 shrink-0">
                        <TrendingUp className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="inline-flex items-center text-[9px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                        +12.4%
                      </span>
                      <button onClick={() => alert("Report loaded.")} className="text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-0.5 transition-colors cursor-pointer">
                        See Report <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 border-none shadow-sm rounded-2xl p-5 flex flex-col justify-between h-[120px] relative text-left">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Purchase Orders</span>
                        <h3 className="text-xl font-extrabold mt-1">380</h3>
                      </div>
                      <div className="p-1.5 border border-slate-100 dark:border-zinc-800 rounded-full text-slate-400 dark:text-zinc-400 shrink-0">
                        <Layers className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="inline-flex items-center text-[9px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                        +8.2%
                      </span>
                      <button onClick={() => alert("Report loaded.")} className="text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-0.5 transition-colors cursor-pointer">
                        See Report <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart placeholders */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-zinc-950 rounded-2xl p-6 border-none shadow-sm flex flex-col justify-between h-[340px]">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-50 dark:border-zinc-900">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Revenue Updates</h3>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5">Yearly earnings comparison ledger</p>
                    </div>
                    <button onClick={() => alert("Interval set.")} className="flex items-center gap-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2 py-1.5 rounded-lg text-[9px] font-bold text-slate-500 dark:text-zinc-400 cursor-pointer">
                      <span>This year</span>
                      <ChevronDown className="h-3 w-3 text-slate-400" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 flex-grow items-center">
                    <div className="md:col-span-3 h-48 flex items-end justify-between gap-2.5 px-2">
                      {[70, 45, 90, 55, 80, 40, 95, 60, 85, 50, 75, 100].map((val, idx) => (
                        <div key={idx} className={`w-full rounded-t-sm transition-opacity hover:opacity-85 ${idx % 2 === 0 ? "bg-zinc-950 dark:bg-white" : "bg-slate-200 dark:bg-zinc-800"}`} style={{ height: `${val}%` }} />
                      ))}
                    </div>
                    <div className="md:col-span-1 space-y-4 pl-4 border-l border-slate-50 dark:border-zinc-900 text-left">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">Direct Sales</span>
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">$8,450.00</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">Partners</span>
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">$5,630.00</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 shadow-sm border-none flex flex-col justify-between h-[340px] text-left">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Monthly Earnings</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <h3 className="text-2xl font-bold tracking-tight">$6,820.00</h3>
                      <span className="inline-flex items-center text-[9px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 px-1.5 py-0.5 rounded-full">
                        -2.1%
                      </span>
                    </div>
                  </div>
                  <div className="h-44 relative w-full pt-4 flex flex-col justify-between">
                    <svg className="w-full h-36 overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="zinc-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#18181b" stopOpacity="0.1" />
                          <stop offset="100%" stopColor="#18181b" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M0,35 C15,30 30,10 45,25 C60,40 75,5 100,20 L100,40 L0,40 Z" fill="url(#zinc-grad)" />
                      <path d="M0,35 C15,30 30,10 45,25 C60,40 75,5 100,20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-zinc-950 dark:text-white" />
                    </svg>
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 dark:text-zinc-500 border-t border-slate-100 dark:border-zinc-900 pt-2 px-1">
                      <span>W1</span><span>W2</span><span>W3</span><span>W4</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ======================================================== */}
          {/* VIEW: PROJECTS DIRECTORY & WORKSPACE SELECTOR            */}
          {/* ======================================================== */}
          {activeTab === "Projects" && (
            <div className="space-y-6">
              

              {/* Add Project Form Drawer */}
              {/* Add Project Form Card */}
              {showCreateProject && (
                <div className="bg-white dark:bg-zinc-950 rounded-2xl p-8 border border-slate-100 dark:border-zinc-900/60 shadow-sm text-left space-y-6 w-full animate-in fade-in duration-200">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-50 dark:border-zinc-900">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Workspace Project</h3>
                      <p className="text-xs text-slate-450 dark:text-zinc-500 font-semibold mt-0.5">Assign resources, budget parameters, and spawn default communication backplanes.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => router.push("/dashboard?tab=Projects")}
                      className="p-1.5 border border-slate-250/60 dark:border-zinc-800 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-400 cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateProject} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left Column: Metadata */}
                      <div className="space-y-4">
                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1.5">Project Name</label>
                          <input 
                            type="text"
                            placeholder="e.g. Website Overhaul"
                            required
                            value={projName}
                            onChange={(e) => setProjName(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 h-10 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-semibold transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1.5">Description (Optional)</label>
                          <textarea 
                            placeholder="Describe project scope and target deliverables..."
                            value={projDesc}
                            onChange={(e) => setProjDesc(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-medium transition-all resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1.5">Client Name</label>
                            <input 
                              type="text"
                              placeholder="Acme Corp"
                              value={projClient}
                              onChange={(e) => setProjClient(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 h-10 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-semibold transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1.5">Category</label>
                            <input 
                              type="text"
                              placeholder="e.g. Design, Web App"
                              value={projCategory}
                              onChange={(e) => setProjCategory(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 h-10 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-semibold transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Financial & Timelines */}
                      <div className="space-y-4">
                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1.5">Assign Project Manager</label>
                          <select
                            required
                            value={selectedManager}
                            onChange={(e) => setSelectedManager(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 h-10 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-bold cursor-pointer transition-all"
                          >
                            <option value="">-- Select Project Manager --</option>
                            {managers.map(mgr => (
                              <option key={mgr.id} value={mgr.id}>
                                {mgr.name} ({mgr.email})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1.5">Project Budget ($)</label>
                            <input 
                              type="number"
                              placeholder="50000"
                              value={projBudget}
                              onChange={(e) => setProjBudget(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 h-10 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-semibold transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1.5">Priority</label>
                            <select
                              value={projPriority}
                              onChange={(e) => setProjPriority(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 h-10 text-xs text-slate-950 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-bold cursor-pointer transition-all"
                            >
                              <option value="LOW">LOW</option>
                              <option value="MEDIUM">MEDIUM</option>
                              <option value="HIGH">HIGH</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1.5">Start Date</label>
                            <input 
                              type="date"
                              value={projStart}
                              onChange={(e) => setProjStart(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 h-10 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-semibold transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1.5">End Date</label>
                            <input 
                              type="date"
                              value={projEnd}
                              onChange={(e) => setProjEnd(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 h-10 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-semibold transition-all"
                            />
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Employee checklist selector - full width search & list */}
                    <div className="pt-2">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block">
                          Assign Employees (Search and select up to 5)
                        </label>
                        <span className="text-[10px] font-bold text-slate-400">
                          {selectedEmployees.length}/5 Assigned
                        </span>
                      </div>

                      {/* Selected employee chips */}
                      {selectedEmployees.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {selectedEmployees.map(empId => {
                            const emp = freeEmployees.find(e => e.id === empId);
                            if (!emp) return null;
                            return (
                              <div key={empId} className="flex items-center gap-1.5 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold pl-3 pr-2 py-1.5 rounded-full shadow-xs">
                                <span>{emp.name}</span>
                                <button
                                  type="button"
                                  onClick={() => toggleEmployeeSelection(empId)}
                                  className="w-4 h-4 rounded-full flex items-center justify-center bg-white/20 dark:bg-black/10 hover:bg-white/40 dark:hover:bg-black/25 text-[10px] text-white dark:text-zinc-950 cursor-pointer"
                                >
                                  &times;
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Search Box */}
                      <input 
                        type="text"
                        placeholder="Search employees by name or email..."
                        value={employeeSearchQuery}
                        onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 h-10 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-medium mb-3"
                      />

                      {loadingFree ? (
                        <div className="text-center py-6 text-xs font-semibold text-slate-400">Loading free employee registry...</div>
                      ) : (
                        (() => {
                          const query = employeeSearchQuery.trim().toLowerCase();
                          const filtered = freeEmployees.filter(emp =>
                            emp.name.toLowerCase().includes(query) ||
                            emp.email.toLowerCase().includes(query)
                          );
                          const unselectedFiltered = filtered.filter(emp => !selectedEmployees.includes(emp.id));

                          if (unselectedFiltered.length > 0) {
                            return (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 p-1 max-h-48 overflow-y-auto">
                                {unselectedFiltered.map(emp => (
                                  <div 
                                    key={emp.id}
                                    onClick={() => toggleEmployeeSelection(emp.id)}
                                    className="flex items-center justify-between p-3.5 rounded-xl cursor-pointer text-xs font-bold border transition-all bg-slate-50 dark:bg-zinc-900 border-slate-200/50 dark:border-zinc-800 hover:bg-slate-100/50 dark:hover:bg-zinc-900"
                                  >
                                    <div className="flex flex-col min-w-0 text-left">
                                      <span className="truncate">{emp.name}</span>
                                      <span className="text-[8px] opacity-60 font-semibold truncate mt-0.5">{emp.email}</span>
                                    </div>
                                    <span className="text-[8px] border rounded-full px-1.5 py-0.5 shrink-0 opacity-70 ml-2">
                                      {emp.activeProjectsCount}/2 active
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          } else if (query && filtered.length === 0) {
                            return (
                              <div className="text-center py-4 text-xs font-semibold text-slate-400">
                                No matching free employees found.
                              </div>
                            );
                          } else {
                            const defaultList = freeEmployees.filter(emp => !selectedEmployees.includes(emp.id)).slice(0, 8);
                            if (defaultList.length > 0) {
                              return (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 p-1 max-h-48 overflow-y-auto">
                                  {defaultList.map(emp => (
                                    <div 
                                      key={emp.id}
                                      onClick={() => toggleEmployeeSelection(emp.id)}
                                      className="flex items-center justify-between p-3.5 rounded-xl cursor-pointer text-xs font-bold border transition-all bg-slate-50 dark:bg-zinc-900 border-slate-200/50 dark:border-zinc-800 hover:bg-slate-100/50 dark:hover:bg-zinc-900"
                                    >
                                      <div className="flex flex-col min-w-0 text-left">
                                        <span className="truncate">{emp.name}</span>
                                        <span className="text-[8px] opacity-60 font-semibold truncate mt-0.5">{emp.email}</span>
                                      </div>
                                      <span className="text-[8px] border rounded-full px-1.5 py-0.5 shrink-0 opacity-70 ml-2">
                                        {emp.activeProjectsCount}/2 active
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              );
                            } else {
                              return (
                                <div className="text-center py-6 text-[10px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                                  No more free employees available.
                                </div>
                              );
                            }
                          }
                        })()
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-50 dark:border-zinc-900">
                      <button 
                        type="button" 
                        onClick={() => router.push("/dashboard?tab=Projects")}
                        className="bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-bold py-2 px-6 rounded-lg text-xs cursor-pointer hover:bg-slate-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold py-2 px-6 rounded-lg text-xs cursor-pointer shadow-xs transition-colors"
                      >
                        Create Project
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Projects List Card Grid */}
              {loadingProjects ? (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold">Synchronizing projects...</div>
              ) : (
                (() => {
                  const pendingProjects = projects.filter(p => p.status === "PENDING");
                  const activeProjects = projects.filter(p => p.status === "ACTIVE");

                  return (
                    <div className="space-y-8">
                      {/* Approval Queue Section */}
                      {pendingProjects.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5 font-sans">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            Pending Project Approval Queue ({pendingProjects.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {pendingProjects.map(proj => (
                              <div 
                                key={proj.id}
                                className="bg-white dark:bg-zinc-950 border border-slate-200/55 dark:border-zinc-900 shadow-xs rounded-2xl p-6 flex flex-col justify-between min-h-[260px] text-left relative"
                              >
                                <div className="space-y-3">
                                  <div className="flex justify-between items-start">
                                    <div className="min-w-0">
                                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                                        {proj.name}
                                      </h4>
                                      {proj.category && (
                                        <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5 block">{proj.category}</span>
                                      )}
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider shrink-0">
                                      PENDING APPROVAL
                                    </span>
                                  </div>
                                  
                                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed font-semibold max-h-12 overflow-hidden line-clamp-2">
                                    {proj.description || "No project description provided."}
                                  </p>

                                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-1 text-[9px] font-bold text-slate-400 dark:text-zinc-500">
                                    <div>
                                      <span className="font-semibold block uppercase tracking-wider text-[8px] opacity-75">Client</span>
                                      <span className="text-slate-950 dark:text-white truncate block">{proj.client || "Internal"}</span>
                                    </div>
                                    <div>
                                      <span className="font-semibold block uppercase tracking-wider text-[8px] opacity-75">Budget</span>
                                      <span className="text-slate-955 dark:text-white block">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(proj.budget)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-semibold block uppercase tracking-wider text-[8px] opacity-75">Project Manager</span>
                                      <span className="text-slate-950 dark:text-white block truncate">{proj.manager?.name || "Unassigned"}</span>
                                    </div>
                                    <div>
                                      <span className="font-semibold block uppercase tracking-wider text-[8px] opacity-75">Timeline</span>
                                      <span className="text-slate-955 dark:text-white block">{formatTimeline(proj.startDate, proj.endDate)}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-4 border-t border-slate-50 dark:border-zinc-900/50 mt-4">
                                  {sessionData.user.role === "PROJECT_MANAGER" && proj.manager?.id === sessionData.user.id ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleApproveProject(proj.id);
                                      }}
                                      className="w-full bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-2 rounded-lg text-xs cursor-pointer shadow-xs transition-colors text-center"
                                    >
                                      Approve & Activate Workspace
                                    </button>
                                  ) : (
                                    <div className="text-[10px] font-bold text-slate-400 italic text-center">
                                      Awaiting approval from {proj.manager?.name || "Manager"}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Active Projects Section */}
                      <div className="space-y-4">
                        {pendingProjects.length > 0 && (
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                            Active Projects ({activeProjects.length})
                          </h4>
                        )}
                        {activeProjects.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {activeProjects.map(proj => (
                              <div 
                                key={proj.id}
                                onClick={() => {
                                  if (proj.status === "PENDING") {
                                    showToast("This project is pending approval. The workspace will unlock once the Project Manager approves it.", "info");
                                    return;
                                  }
                                  router.push(`?tab=Projects&projectId=${proj.id}`);
                                }}
                                className="bg-white dark:bg-zinc-950 border-none shadow-sm rounded-2xl p-6 hover:shadow-md hover:translate-y-[-1px] transition-all cursor-pointer flex flex-col justify-between h-[240px] text-left border border-slate-100/10"
                              >
                                <div className="space-y-3">
                                  <div className="flex justify-between items-start">
                                    <div className="min-w-0">
                                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                                        {proj.name}
                                      </h4>
                                      {proj.category && (
                                        <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5 block">{proj.category}</span>
                                      )}
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider shrink-0 ${getPriorityBadgeClass(proj.priority)}`}>
                                      {proj.priority}
                                    </span>
                                  </div>
                                  
                                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed font-semibold max-h-12 overflow-hidden line-clamp-2">
                                    {proj.description || "No project description provided."}
                                  </p>

                                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-1 text-[9px] font-bold text-slate-400 dark:text-zinc-500">
                                    <div>
                                      <span className="font-semibold block uppercase tracking-wider text-[8px] opacity-75">Client</span>
                                      <span className="text-slate-950 dark:text-white truncate block">{proj.client || "Internal"}</span>
                                    </div>
                                    <div>
                                      <span className="font-semibold block uppercase tracking-wider text-[8px] opacity-75">Budget</span>
                                      <span className="text-slate-950 dark:text-white block">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(proj.budget)}
                                      </span>
                                    </div>
                                    <div className="col-span-2">
                                      <span className="font-semibold block uppercase tracking-wider text-[8px] opacity-75">Timeline</span>
                                      <span className="text-slate-955 dark:text-white block">{formatTimeline(proj.startDate, proj.endDate)}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-zinc-900 text-[10px] font-bold text-slate-400">
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3.5 w-3.5 text-slate-400" />
                                    <span>{proj.employees.length} Members</span>
                                  </div>
                                  <span className="text-zinc-950 dark:text-white hover:underline flex items-center gap-0.5 cursor-pointer">
                                    Workspace &rarr;
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-white dark:bg-zinc-950 rounded-2xl py-12 text-center text-slate-400 text-xs font-semibold border border-slate-100/10">
                            <div className="flex flex-col items-center gap-2">
                              <Briefcase className="h-6 w-6 text-slate-300" />
                              <span>No active projects found.</span>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })()
              )}

            </div>
          )}
        </>
      )}

      {/* Floating Toast Notification Center */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 px-4.5 py-3.5 rounded-xl shadow-lg border text-xs font-bold animate-in slide-in-from-bottom-5 duration-200 transition-all ${
              t.type === "success"
                ? "bg-zinc-950 border-zinc-800 text-white dark:bg-white dark:border-slate-200 dark:text-zinc-950"
                : t.type === "error"
                ? "bg-rose-50 border-rose-250 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400"
                : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-400"
            }`}
          >
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Dynamic Confirmation Modal Popup */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 dark:bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl shadow-xl max-w-sm w-full p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="space-y-1.5">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                {confirmModal.type === "danger" && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />}
                {confirmModal.type === "success" && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />}
                {confirmModal.type === "warning" && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />}
                {confirmModal.type === "info" && <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />}
                {confirmModal.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
            <div className="flex gap-2.5 pt-2 border-t border-slate-50 dark:border-zinc-900/60 justify-end">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-bold py-1.5 px-4 rounded-lg text-[10px] cursor-pointer hover:bg-slate-100 transition-colors"
              >
                {confirmModal.cancelText}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`font-bold py-1.5 px-4 rounded-lg text-[10px] cursor-pointer shadow-xs transition-colors text-white ${
                  confirmModal.type === "danger"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : confirmModal.type === "success"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950"
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sliding Right Chat Drawer (Slack Style) */}
      {showChatDrawer && selectedProject && (
        <div className="fixed inset-0 z-40 flex justify-end bg-zinc-950/45 dark:bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setShowChatDrawer(false)} />
          
          <div className="relative w-full max-w-xl h-full bg-white dark:bg-[#1A1D21] shadow-2xl flex flex-row text-left animate-in slide-in-from-right duration-300">
            
            {/* Left Channel Sidebar (Slack Aubergine) */}
            <div className="w-52 h-full flex flex-col justify-between bg-[#3F0E40] text-[#BCABB6] dark:bg-[#19171d] border-r border-[#522653] dark:border-zinc-800 shrink-0">
              <div>
                {/* Header */}
                <div className="p-4 border-b border-[#522653] dark:border-zinc-850 flex flex-col gap-0.5">
                  <h2 className="text-xs font-black text-white uppercase tracking-wider truncate">
                    {selectedProject.name}
                  </h2>
                  <span className="text-[9px] text-[#D1C4E9] dark:text-zinc-500 font-bold truncate">
                    Project Workspace
                  </span>
                </div>

                {/* Section title */}
                <div className="pt-4 px-4 pb-2 text-[9px] font-extrabold uppercase tracking-widest text-[#D1C4E9]/60 dark:text-zinc-500 flex items-center justify-between">
                  <span>Channels</span>
                </div>

                {/* Channel Links */}
                <div className="flex flex-col space-y-0.5 px-2">
                  {channels.map(chan => {
                    const isActive = selectedChannel?.id === chan.id;
                    return (
                      <button
                        key={chan.id}
                        onClick={() => setSelectedChannel(chan)}
                        className={`w-full px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all text-left cursor-pointer ${
                          isActive 
                            ? "bg-[#1164A3] text-white shadow-xs" 
                            : "text-[#BCABB6] hover:bg-[#350d36] hover:text-white dark:text-zinc-400 dark:hover:bg-zinc-800/80"
                        }`}
                      >
                        <span className="opacity-70 font-black">#</span>
                        <span className="truncate">{chan.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active User status */}
              <div className="p-4 border-t border-[#522653] dark:border-zinc-850 flex items-center gap-2 text-[10px] font-bold text-white/80 dark:text-zinc-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                <span>Active Member</span>
              </div>
            </div>

            {/* Right Message Panel */}
            <div className="flex-grow h-full flex flex-col justify-between bg-white dark:bg-[#1A1D21]">
              {/* Channel Header */}
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/10">
                <div className="min-w-0">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
                    <span>#{selectedChannel?.name || "channel"}</span>
                  </h3>
                  <p className="text-[9px] text-slate-450 dark:text-zinc-500 font-bold mt-0.5">
                    Project communication backplane
                  </p>
                </div>
                <button
                  onClick={() => setShowChatDrawer(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400 hover:text-slate-650 cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Message log list */}
              <div ref={chatContainerRef} className="flex-grow overflow-y-auto space-y-4 px-5 py-4 min-h-0 bg-white dark:bg-[#1A1D21]">
                {messages.length > 0 ? (
                  messages.map(msg => {
                    const initials = msg.sender.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
                    const isMe = msg.sender.id === sessionData.user.id;
                    return (
                      <div key={msg.id} className={`flex gap-3 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 p-1.5 rounded transition-all ${isMe ? "justify-end text-right" : "text-left"}`}>
                        {!isMe && (
                          <div className="w-9 h-9 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 font-extrabold flex items-center justify-center text-xs shrink-0 select-none">
                            {initials}
                          </div>
                        )}
                        <div className={`min-w-0 flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                          <div className={`flex items-baseline gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {msg.sender.name}
                            </span>
                            <span className="text-[8px] text-slate-400 dark:text-zinc-500 font-bold">
                              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className={`text-xs font-medium mt-1 leading-relaxed whitespace-pre-wrap break-words inline-block p-2.5 rounded-2xl ${
                            isMe 
                              ? "bg-[#1164A3] text-white rounded-tr-none text-left" 
                              : "bg-slate-100 dark:bg-[#222529] text-slate-800 dark:text-zinc-300 rounded-tl-none text-left border border-slate-150/40 dark:border-zinc-800/80"
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-[10px] font-bold gap-1">
                    <MessageSquare className="h-5 w-5 text-slate-300" />
                    <span>Welcome to #{selectedChannel?.name || "channel"}!</span>
                    <span className="text-[9px] font-normal text-slate-400">Send a message to kickstart the thread.</span>
                  </div>
                )}
              </div>

              {/* Message Input console */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-[#1A1D21] shrink-0">
                <div className="border border-slate-250 dark:border-zinc-800 rounded-lg focus-within:border-slate-400 dark:focus-within:border-zinc-650 flex flex-col bg-slate-50/30 dark:bg-[#222529] p-1.5">
                  <input
                    type="text"
                    placeholder={`Message #${selectedChannel?.name || "channel"}...`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-900 dark:text-white outline-none font-medium px-2 py-1 placeholder-slate-400"
                  />
                  <div className="flex justify-end pt-1.5 border-t border-slate-100 dark:border-zinc-850 mt-1.5">
                    <button 
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-md p-1.5 cursor-pointer transition-colors shadow-xs"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* Add Task Dialog Modal */}
      {showAddTask && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 dark:bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl shadow-xl max-w-md w-full p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-zinc-900">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-slate-400" />
                Create New Task
              </h3>
              <button
                type="button"
                onClick={() => setShowAddTask(false)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Task Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Design app wrapper"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-medium"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Task Description</label>
                <textarea 
                  rows={3}
                  placeholder="Short description of the task requirements..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Assign Member</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-bold cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {selectedProject.employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Due Date</label>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white">
                    <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
                    <input 
                      type="date" 
                      value={taskDue}
                      onChange={(e) => setTaskDue(e.target.value)}
                      className="bg-transparent outline-none w-full font-bold cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50 dark:border-zinc-900/60">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-bold py-1.5 px-4 rounded-lg text-[10px] cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-1.5 px-4 rounded-lg text-[10px] cursor-pointer shadow-xs transition-colors"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
