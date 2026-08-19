"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { 
  BarChart3, 
  Vote, 
  CheckCircle2, 
  Plus, 
  X, 
  Trash2, 
  Lock, 
  Sparkles, 
  Users, 
  Briefcase, 
  Globe, 
  Clock, 
  Calendar, 
  Search, 
  Filter, 
  Check, 
  PieChart, 
  Layers,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { useToast } from "@/components/Toast";

interface PollOption {
  id: string;
  text: string;
  votesCount: number;
  percentage: number;
  isUserSelected: boolean;
}

interface Poll {
  id: string;
  title: string;
  description?: string;
  target: "COMPANY_WIDE" | "PROJECT";
  status: "ACTIVE" | "CLOSED";
  allowMultiple: boolean;
  expiresAt?: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  project?: {
    id: string;
    name: string;
  };
  options: PollOption[];
  totalVotes: number;
  uniqueVoters: number;
  hasVoted: boolean;
  userVotedOptionIds: string[];
}

interface ProjectCompact {
  id: string;
  name: string;
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

export default function PollsPage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionLoading } = useSession();
  const { toast } = useToast();

  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<ProjectCompact[]>([]);

  // Filtering & Search
  const [activeTab, setActiveTab] = useState<"ALL" | "COMPANY_WIDE" | "PROJECT" | "MY_POLLS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Voting Selection State (Map pollId -> array of selected optionIds)
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string[]>>({});
  const [votingPollId, setVotingPollId] = useState<string | null>(null);
  const [changingVotePollId, setChangingVotePollId] = useState<string | null>(null);

  // Create Poll Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pollTitle, setPollTitle] = useState("");
  const [pollDesc, setPollDesc] = useState("");
  const [pollTarget, setPollTarget] = useState<"COMPANY_WIDE" | "PROJECT">("COMPANY_WIDE");
  const [pollProjectId, setPollProjectId] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false);
  const [pollExpiresAt, setPollExpiresAt] = useState("");
  const [creatingPoll, setCreatingPoll] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !sessionData) {
      router.push("/login");
    }
  }, [sessionData, sessionLoading, router]);

  useEffect(() => {
    if (sessionData) {
      fetchPolls();
      fetchProjects();
    }
  }, [sessionData]);

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/polls`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
        setPolls(data.polls || []);
      }
    } catch (err) {
      console.error("Failed to load polls:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/my-projects`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
        setProjects(data.projects || []);
        if (data.projects?.length > 0 && !pollProjectId) {
          setPollProjectId(data.projects[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  const handleSelectOption = (poll: Poll, optionId: string) => {
    setSelectedVotes(prev => {
      const current = prev[poll.id] || [];
      if (poll.allowMultiple) {
        if (current.includes(optionId)) {
          return { ...prev, [poll.id]: current.filter(id => id !== optionId) };
        } else {
          return { ...prev, [poll.id]: [...current, optionId] };
        }
      } else {
        return { ...prev, [poll.id]: [optionId] };
      }
    });
  };

  const handleCastVote = async (pollId: string) => {
    const selected = selectedVotes[pollId];
    if (!selected || selected.length === 0) {
      toast.error("Please select at least one option.");
      return;
    }

    setVotingPollId(pollId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionIds: selected }),
        credentials: "include"
      });
      const data = await safeJson(res);
      if (res.ok) {
        toast.success(data.message || "Vote recorded successfully!");
        setChangingVotePollId(null);
        fetchPolls();
      } else {
        toast.error(data.error || "Failed to submit vote.");
      }
    } catch (err) {
      toast.error("Internal server error.");
    } finally {
      setVotingPollId(null);
    }
  };

  const handleClosePoll = async (pollId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/polls/${pollId}/close`, {
        method: "PATCH",
        credentials: "include"
      });
      const data = await safeJson(res);
      if (res.ok) {
        toast.success("Poll closed successfully.");
        fetchPolls();
      } else {
        toast.error(data.error || "Failed to close poll.");
      }
    } catch (err) {
      toast.error("Internal server error.");
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/polls/${pollId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        toast.success("Poll deleted.");
        fetchPolls();
      } else {
        const data = await safeJson(res);
        toast.error(data.error || "Failed to delete poll.");
      }
    } catch (err) {
      toast.error("Internal server error.");
    }
  };

  const handleAddOptionInput = () => {
    if (pollOptions.length < 8) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handleRemoveOptionInput = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handleOptionTextChange = (index: number, val: string) => {
    const next = [...pollOptions];
    next[index] = val;
    setPollOptions(next);
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = pollOptions.map(o => o.trim()).filter(Boolean);

    if (!pollTitle.trim()) {
      toast.error("Please enter a poll title.");
      return;
    }
    if (validOptions.length < 2) {
      toast.error("Please provide at least 2 distinct voting options.");
      return;
    }
    if (pollTarget === "PROJECT" && !pollProjectId) {
      toast.error("Please select a project.");
      return;
    }

    setCreatingPoll(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/polls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pollTitle.trim(),
          description: pollDesc.trim() || undefined,
          target: pollTarget,
          projectId: pollTarget === "PROJECT" ? pollProjectId : undefined,
          options: validOptions,
          allowMultiple: pollAllowMultiple,
          expiresAt: pollExpiresAt || undefined
        }),
        credentials: "include"
      });
      const data = await safeJson(res);

      if (res.ok) {
        toast.success("Poll launched successfully!");
        setShowCreateModal(false);
        setPollTitle("");
        setPollDesc("");
        setPollOptions(["", ""]);
        setPollExpiresAt("");
        fetchPolls();
      } else {
        toast.error(data.error || "Failed to launch poll.");
      }
    } catch (err) {
      console.error("Create poll error:", err);
      toast.error("Internal server error.");
    } finally {
      setCreatingPoll(false);
    }
  };

  // Filtered Polls
  const filteredPolls = useMemo(() => {
    return polls.filter(p => {
      // Tab filter
      if (activeTab === "COMPANY_WIDE" && p.target !== "COMPANY_WIDE") return false;
      if (activeTab === "PROJECT" && p.target !== "PROJECT") return false;
      if (activeTab === "MY_POLLS" && p.author.id !== sessionData?.user?.id) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        const matchProj = p.project?.name.toLowerCase().includes(q);
        const matchAuthor = p.author.name.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchProj && !matchAuthor) return false;
      }
      return true;
    });
  }, [polls, activeTab, searchQuery, sessionData]);

  const isHr = sessionData?.user?.role === "HR";
  const isPm = sessionData?.user?.role === "PROJECT_MANAGER";
  const canCreatePoll = isHr || isPm;

  const totalActivePolls = polls.filter(p => p.status === "ACTIVE").length;
  const myParticipatedPolls = polls.filter(p => p.hasVoted).length;
  const companySurveysCount = polls.filter(p => p.target === "COMPANY_WIDE").length;
  const projectPollsCount = polls.filter(p => p.target === "PROJECT").length;

  if (sessionLoading || !sessionData) return null;

  return (
    <div className="flex-grow flex flex-col space-y-6 font-sans text-slate-900 dark:text-white transition-colors duration-150 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Pulse Polls & Surveys</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-extrabold uppercase px-2.5 py-0.5 rounded-full">
              Live Democracy
            </span>
          </h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
            Voice your opinion in corporate surveys, vote on sprint tech-stacks & view live distribution charts
          </p>
        </div>

        {canCreatePoll && (
          <button
            onClick={() => {
              if (!isHr && isPm) setPollTarget("PROJECT");
              setShowCreateModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Launch New Poll</span>
          </button>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Active Polls</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalActivePolls}</span>
            <Vote className="h-6 w-6 text-indigo-500 opacity-75" />
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">Open for Voting</div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Your Participation</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {myParticipatedPolls}
            </span>
            <CheckCircle2 className="h-6 w-6 text-emerald-500 opacity-75" />
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">Polls Voted In</div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Company Surveys</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{companySurveysCount}</span>
            <Globe className="h-6 w-6 text-purple-500 opacity-75" />
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">Organization-Wide</div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Project Polls</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{projectPollsCount}</span>
            <Briefcase className="h-6 w-6 text-blue-500 opacity-75" />
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">Workspace Sprints</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs">
        <div className="relative flex items-center w-full sm:w-80 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2">
          <Search className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search polls, authors, projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs outline-none text-zinc-900 dark:text-white w-full font-medium"
          />
        </div>

        <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl gap-1 text-[11px] font-bold">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === "ALL" 
                ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs" 
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            All Polls ({polls.length})
          </button>
          <button
            onClick={() => setActiveTab("COMPANY_WIDE")}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === "COMPANY_WIDE" 
                ? "bg-purple-600 text-white shadow-xs" 
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Company Wide ({companySurveysCount})
          </button>
          <button
            onClick={() => setActiveTab("PROJECT")}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === "PROJECT" 
                ? "bg-blue-600 text-white shadow-xs" 
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Project Sprints ({projectPollsCount})
          </button>
          <button
            onClick={() => setActiveTab("MY_POLLS")}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === "MY_POLLS" 
                ? "bg-indigo-600 text-white shadow-xs" 
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            My Polls
          </button>
        </div>
      </div>

      {/* Poll Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs font-bold">Loading surveys...</div>
      ) : filteredPolls.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPolls.map(poll => {
            const isCompany = poll.target === "COMPANY_WIDE";
            const isActive = poll.status === "ACTIVE";
            const isAuthor = poll.author.id === sessionData.user.id;
            const isChangingVote = changingVotePollId === poll.id;
            const showVotingForm = (!poll.hasVoted || isChangingVote) && isActive;
            const selectedCurrent = selectedVotes[poll.id] || (isChangingVote ? poll.userVotedOptionIds : []);

            return (
              <div
                key={poll.id}
                className={`p-6 rounded-3xl border transition-all bg-white dark:bg-zinc-950 shadow-xs flex flex-col justify-between space-y-5 ${
                  isActive ? "border-slate-100 dark:border-zinc-900" : "border-slate-200/50 dark:border-zinc-850 opacity-80"
                }`}
              >
                {/* Poll Card Header */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        isCompany 
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400" 
                          : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                      }`}>
                        {isCompany ? <Globe className="h-3 w-3" /> : <Briefcase className="h-3 w-3" />}
                        {isCompany ? "Company Wide" : poll.project?.name || "Project Poll"}
                      </span>

                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isActive 
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400" 
                          : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}>
                        {poll.status}
                      </span>
                    </div>

                    {/* Author Controls */}
                    {(isAuthor || isHr) && (
                      <div className="flex items-center gap-1">
                        {isActive && (
                          <button
                            onClick={() => handleClosePoll(poll.id)}
                            className="p-1 rounded text-slate-400 hover:text-amber-600 cursor-pointer"
                            title="Close Poll"
                          >
                            <Lock className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePoll(poll.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Delete Poll"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                      {poll.title}
                    </h3>
                    {poll.description && (
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                        {poll.description}
                      </p>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-2 pt-1">
                    <span>By {poll.author.name} ({poll.author.role})</span>
                    <span>&bull;</span>
                    <span>{poll.allowMultiple ? "Multiple Selection" : "Single Choice"}</span>
                    {poll.expiresAt && (
                      <>
                        <span>&bull;</span>
                        <span className="text-amber-600 dark:text-amber-400">
                          Expires {new Date(poll.expiresAt).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Options / Results Segment */}
                <div className="space-y-2.5 pt-2">
                  {showVotingForm ? (
                    // Unvoted Mode: Interactive Selection Form
                    <div className="space-y-2">
                      {poll.options.map(opt => {
                        const isChecked = selectedCurrent.includes(opt.id);

                        return (
                          <div
                            key={opt.id}
                            onClick={() => handleSelectOption(poll, opt.id)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isChecked
                                ? "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500"
                                : "bg-slate-50/50 dark:bg-zinc-900/40 border-slate-200/60 dark:border-zinc-800 hover:border-slate-300"
                            }`}
                          >
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {opt.text}
                            </span>
                            <div className={`w-4 h-4 rounded-${poll.allowMultiple ? "md" : "full"} border flex items-center justify-center ${
                              isChecked ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 dark:border-zinc-700"
                            }`}>
                              {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}

                      <div className="flex justify-end gap-2 pt-2">
                        {isChangingVote && (
                          <button
                            type="button"
                            onClick={() => setChangingVotePollId(null)}
                            className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold py-2 px-3.5 rounded-xl text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={votingPollId === poll.id}
                          onClick={() => handleCastVote(poll.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-xl text-xs cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                          {votingPollId === poll.id ? "Submitting..." : "Submit Vote"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Voted / Closed Mode: Live Visual Percentage Bars
                    <div className="space-y-3">
                      {poll.options.map(opt => (
                        <div key={opt.id} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{opt.text}</span>
                              {opt.isUserSelected && (
                                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                  <Check className="h-2.5 w-2.5" />
                                  Your Choice
                                </span>
                              )}
                            </span>
                            <span className="font-mono font-extrabold text-slate-500 dark:text-zinc-400">
                              {opt.percentage}% ({opt.votesCount})
                            </span>
                          </div>

                          <div className="w-full bg-slate-100 dark:bg-zinc-900 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                opt.isUserSelected ? "bg-indigo-600" : "bg-slate-400 dark:bg-zinc-600"
                              }`}
                              style={{ width: `${opt.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}

                      {isActive && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVotes({ ...selectedVotes, [poll.id]: poll.userVotedOptionIds });
                              setChangingVotePollId(poll.id);
                            }}
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            Change My Vote
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Metrics */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-zinc-900 text-[10px] font-bold text-slate-400">
                  <span>Total Responses: {poll.totalVotes} votes</span>
                  <span>{poll.uniqueVoters} Participants</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 dark:border-zinc-900 rounded-3xl text-xs">
          No matching polls or surveys found.
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE POLL / SURVEY                              */}
      {/* ======================================================== */}
      {showCreateModal && canCreatePoll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl shadow-xl max-w-lg w-full p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <Vote className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Launch Pulse Survey / Poll
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Poll Question / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Which frontend framework should we adopt for Project Apollo?"
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Description / Context
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional background, context, or rules for this poll..."
                  value={pollDesc}
                  onChange={(e) => setPollDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    Survey Target Scope
                  </label>
                  <select
                    value={pollTarget}
                    onChange={(e) => setPollTarget(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  >
                    {isHr && <option value="COMPANY_WIDE">Company-Wide (All Staff)</option>}
                    <option value="PROJECT">Project-Specific Team</option>
                  </select>
                </div>

                {pollTarget === "PROJECT" ? (
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                      Select Project *
                    </label>
                    <select
                      value={pollProjectId}
                      onChange={(e) => setPollProjectId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                      Expiration Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={pollExpiresAt}
                      onChange={(e) => setPollExpiresAt(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Dynamic Options List */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block">
                  Voting Options (Minimum 2) *
                </label>
                
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-4">{i + 1}.</span>
                    <input
                      type="text"
                      required
                      placeholder={`Option ${i + 1} text`}
                      value={opt}
                      onChange={(e) => handleOptionTextChange(i, e.target.value)}
                      className="flex-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOptionInput(i)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}

                {pollOptions.length < 8 && (
                  <button
                    type="button"
                    onClick={handleAddOptionInput}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1 mt-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Another Option</span>
                  </button>
                )}
              </div>

              {/* Settings Checkbox */}
              <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="multiCheck"
                  checked={pollAllowMultiple}
                  onChange={(e) => setPollAllowMultiple(e.target.checked)}
                  className="h-4 w-4 accent-indigo-600 rounded cursor-pointer"
                />
                <label htmlFor="multiCheck" className="text-xs font-semibold text-slate-700 dark:text-zinc-300 cursor-pointer">
                  Allow multiple choices (voters can pick more than 1 option)
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingPoll}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  {creatingPoll ? "Publishing..." : "Launch Poll"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
