"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { 
  Award, 
  ShieldCheck, 
  Printer, 
  Download, 
  Plus, 
  X, 
  Search, 
  CheckCircle2, 
  Sparkles, 
  FileText, 
  Building, 
  Calendar, 
  Briefcase, 
  Check, 
  ExternalLink, 
  QrCode, 
  Trash2, 
  GraduationCap,
  Medal,
  Flame,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/components/Toast";

interface Certificate {
  id: string;
  certificateCode: string;
  title: string;
  type: "PROJECT_COMPLETION" | "TRAINING_WORKSHOP" | "EXCELLENCE_AWARD" | "SKILL_ACHIEVEMENT";
  description?: string;
  recipient: {
    id: string;
    name: string;
    email: string;
    role: string;
    designation?: string;
    department?: string;
  };
  issuer: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  project?: {
    id: string;
    name: string;
    category?: string;
    budget?: number;
  };
  pmSignature?: string;
  hrSignature?: string;
  issuedAt: string;
}

interface EmployeeCompact {
  id: string;
  name: string;
  email: string;
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

export default function CertificatesPage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionLoading } = useSession();
  const { toast } = useToast();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<EmployeeCompact[]>([]);
  const [projects, setProjects] = useState<ProjectCompact[]>([]);

  // Filtering & Search
  const [activeTab, setActiveTab] = useState<"ALL" | "PROJECT_COMPLETION" | "EXCELLENCE_AWARD" | "TRAINING_WORKSHOP">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Certificate Modal State (View / Print)
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  // Verify Certificate Modal State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyCodeInput, setVerifyCodeInput] = useState("");
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  // Issue Certificate Modal State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueRecipientId, setIssueRecipientId] = useState("");
  const [issueTitle, setIssueTitle] = useState("");
  const [issueType, setIssueType] = useState<string>("PROJECT_COMPLETION");
  const [issueProjectId, setIssueProjectId] = useState("");
  const [issueDesc, setIssueDesc] = useState("");
  const [issuePmSig, setIssuePmSig] = useState("");
  const [issueHrSig, setIssueHrSig] = useState("NexaCore Executive Board");
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !sessionData) {
      router.push("/login");
    }
  }, [sessionData, sessionLoading, router]);

  useEffect(() => {
    if (sessionData) {
      fetchCertificates();
      fetchEmployees();
      fetchProjects();
    }
  }, [sessionData]);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/certificates`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
        setCertificates(data.certificates || []);
      }
    } catch (err) {
      console.error("Failed to load certificates:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/hr/employees`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
        setEmployees(data.employees || []);
        if (data.employees?.length > 0 && !issueRecipientId) {
          setIssueRecipientId(data.employees[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
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
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  const handleVerifySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCodeInput.trim()) return;

    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/certificates/verify/${verifyCodeInput.trim().toUpperCase()}`);
      const data = await safeJson(res);
      if (res.ok && data.isValid) {
        setVerificationResult(data.certificate);
      } else {
        toast.error(data.error || "Invalid or revoked certificate code.");
      }
    } catch (err) {
      toast.error("Failed to verify certificate.");
    } finally {
      setVerifying(false);
    }
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueRecipientId || !issueTitle.trim()) {
      toast.error("Please fill in recipient and title.");
      return;
    }

    setIssuing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/certificates/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: issueRecipientId,
          title: issueTitle.trim(),
          type: issueType,
          projectId: issueProjectId || undefined,
          description: issueDesc.trim() || undefined,
          pmSignature: issuePmSig.trim() || undefined,
          hrSignature: issueHrSig.trim() || undefined
        }),
        credentials: "include"
      });
      const data = await safeJson(res);

      if (res.ok) {
        toast.success("Certificate generated and verified!");
        setShowIssueModal(false);
        setIssueTitle("");
        setIssueDesc("");
        fetchCertificates();
      } else {
        toast.error(data.error || "Failed to issue certificate.");
      }
    } catch (err) {
      console.error("Issue certificate error:", err);
      toast.error("Internal server error.");
    } finally {
      setIssuing(false);
    }
  };

  const handleDeleteCertificate = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/certificates/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        toast.success("Certificate revoked.");
        if (selectedCertificate?.id === id) setSelectedCertificate(null);
        fetchCertificates();
      } else {
        const data = await safeJson(res);
        toast.error(data.error || "Failed to revoke certificate.");
      }
    } catch (err) {
      toast.error("Internal server error.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered Certificates
  const filteredCertificates = useMemo(() => {
    return certificates.filter(c => {
      // Tab filter
      if (activeTab !== "ALL" && c.type !== activeTab) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = c.certificateCode.toLowerCase().includes(q);
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchRecipient = c.recipient.name.toLowerCase().includes(q);
        const matchProject = c.project?.name.toLowerCase().includes(q);
        if (!matchCode && !matchTitle && !matchRecipient && !matchProject) return false;
      }
      return true;
    });
  }, [certificates, activeTab, searchQuery]);

  const isHr = sessionData?.user?.role === "HR";
  const isPm = sessionData?.user?.role === "PROJECT_MANAGER";
  const canIssue = isHr || isPm;

  const projectCertsCount = certificates.filter(c => c.type === "PROJECT_COMPLETION").length;
  const excellenceCertsCount = certificates.filter(c => c.type === "EXCELLENCE_AWARD").length;
  const workshopCertsCount = certificates.filter(c => c.type === "TRAINING_WORKSHOP").length;

  if (sessionLoading || !sessionData) return null;

  return (
    <div className="flex-grow flex flex-col space-y-6 font-sans text-slate-900 dark:text-white transition-colors duration-150 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Credentials & Certificates</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Verified Digital
            </span>
          </h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
            Official verifiable credentials for completed project sprints, engineering milestones & corporate workshops
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setVerifyCodeInput("");
              setVerificationResult(null);
              setShowVerifyModal(true);
            }}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-900 dark:text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Verify Credential</span>
          </button>

          {canIssue && (
            <button
              onClick={() => setShowIssueModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Issue Credential</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Earned Credentials</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{certificates.length}</span>
            <Award className="h-6 w-6 text-amber-500 opacity-75" />
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">Total Verified Awards</div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Project Deliveries</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{projectCertsCount}</span>
            <Briefcase className="h-6 w-6 text-blue-500 opacity-75" />
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">Sprint Milestones</div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Excellence Honors</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{excellenceCertsCount}</span>
            <Medal className="h-6 w-6 text-purple-500 opacity-75" />
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">Leadership & Innovation</div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Workshops & Training</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{workshopCertsCount}</span>
            <GraduationCap className="h-6 w-6 text-emerald-500 opacity-75" />
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">Technical Certifications</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs">
        <div className="relative flex items-center w-full sm:w-80 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2">
          <Search className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search code, title, recipient, project..."
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
            All ({certificates.length})
          </button>
          <button
            onClick={() => setActiveTab("PROJECT_COMPLETION")}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === "PROJECT_COMPLETION" 
                ? "bg-blue-600 text-white shadow-xs" 
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Project Delivery ({projectCertsCount})
          </button>
          <button
            onClick={() => setActiveTab("EXCELLENCE_AWARD")}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === "EXCELLENCE_AWARD" 
                ? "bg-purple-600 text-white shadow-xs" 
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Excellence ({excellenceCertsCount})
          </button>
          <button
            onClick={() => setActiveTab("TRAINING_WORKSHOP")}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === "TRAINING_WORKSHOP" 
                ? "bg-emerald-600 text-white shadow-xs" 
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Workshops ({workshopCertsCount})
          </button>
        </div>
      </div>

      {/* Certificates Gallery Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs font-bold">Loading credentials...</div>
      ) : filteredCertificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.map(cert => {
            const isProject = cert.type === "PROJECT_COMPLETION";
            const isExcellence = cert.type === "EXCELLENCE_AWARD";

            return (
              <div
                key={cert.id}
                className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl p-6 shadow-xs flex flex-col justify-between h-[300px] hover:border-amber-500/40 hover:shadow-md transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      isProject 
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400" 
                        : isExcellence
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400"
                    }`}>
                      <Sparkles className="h-3 w-3" />
                      {cert.type.replace("_", " ")}
                    </span>

                    <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-zinc-900 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-zinc-800">
                      {cert.certificateCode.slice(0, 14)}...
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {cert.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {cert.description || "In recognition of outstanding technical performance and engineering contributions."}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-900">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Presented To</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">{cert.recipient.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Issued On</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">
                        {new Date(cert.issuedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCertificate(cert)}
                    className="w-full bg-slate-100 hover:bg-zinc-950 hover:text-white dark:bg-zinc-900 dark:hover:bg-white dark:hover:text-zinc-950 font-bold py-2 px-4 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <Award className="h-4 w-4 text-amber-500" />
                    <span>View & Print Diploma</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 dark:border-zinc-900 rounded-3xl text-xs">
          No certificates found in this category.
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: HIGH-FIDELITY PRINTABLE CERTIFICATE CANVAS        */}
      {/* ======================================================== */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="max-w-4xl w-full text-center space-y-4 my-8">
            
            {/* Top Toolbar (Hidden during print) */}
            <div className="flex justify-between items-center bg-zinc-900/90 text-white p-4 rounded-2xl border border-zinc-800 print:hidden">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span className="text-xs font-mono font-bold">{selectedCertificate.certificateCode}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-black px-2 py-0.5 rounded-full">
                  VERIFIED AUTHENTIC
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setSelectedCertificate(null)}
                  className="p-1.5 rounded-xl bg-zinc-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Official Diploma Canvas (Printable Area) */}
            <div 
              id="printable-certificate"
              className="bg-white text-slate-900 p-10 sm:p-14 rounded-3xl shadow-2xl border-12 border-[#1E293B] relative overflow-hidden text-center space-y-6 font-serif select-none"
            >
              {/* Decorative Corner Seals */}
              <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 opacity-20" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-indigo-300 via-indigo-500 to-indigo-600 opacity-20" />

              {/* Company Banner */}
              <div className="space-y-1">
                <div className="font-sans text-xs font-black tracking-[0.3em] uppercase text-amber-600">
                  NexaCore Technologies Corporation
                </div>
                <div className="text-[10px] font-sans text-slate-400 uppercase tracking-widest">
                  Workforce Credentialing & Verification Registry
                </div>
              </div>

              {/* Title Section */}
              <div className="space-y-2 pt-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wide uppercase text-slate-900">
                  Certificate of Achievement
                </h1>
                <p className="font-sans text-xs text-slate-500 font-semibold uppercase tracking-widest">
                  This official diploma is proudly conferred upon
                </p>
              </div>

              {/* Recipient Full Name */}
              <div className="py-2 border-b-2 border-slate-300 max-w-lg mx-auto">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block">
                  {selectedCertificate.recipient.name}
                </span>
                <span className="font-sans text-[11px] font-bold text-indigo-600 block mt-0.5">
                  {selectedCertificate.recipient.role} {selectedCertificate.recipient.department ? `&bull; ${selectedCertificate.recipient.department}` : ""}
                </span>
              </div>

              {/* Description */}
              <div className="max-w-xl mx-auto font-sans text-xs text-slate-600 leading-relaxed">
                {selectedCertificate.description || `For outstanding technical excellence, team leadership, and successful delivery of ${selectedCertificate.title}.`}
              </div>

              {/* Signatures & Seal Section */}
              <div className="grid grid-cols-3 items-end pt-6 border-t border-slate-200 text-center font-sans">
                
                {/* PM Signature */}
                <div className="space-y-1 text-center">
                  <div className="text-sm font-script italic font-black text-slate-800">
                    {selectedCertificate.pmSignature || "Project Director"}
                  </div>
                  <div className="w-32 border-b border-slate-400 mx-auto" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Project Manager</span>
                </div>

                {/* NexaCore Official Gold Seal */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full border-2 border-amber-500 bg-amber-50/50 flex flex-col items-center justify-center shadow-xs">
                    <Sparkles className="h-5 w-5 text-amber-600" />
                    <span className="text-[7px] font-black text-amber-800 uppercase tracking-widest mt-0.5">OFFICIAL</span>
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">SEAL OF EXCELLENCE</span>
                </div>

                {/* HR Signature */}
                <div className="space-y-1 text-center">
                  <div className="text-sm font-script italic font-black text-slate-800">
                    {selectedCertificate.hrSignature || "NexaCore Board"}
                  </div>
                  <div className="w-32 border-b border-slate-400 mx-auto" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Executive Director</span>
                </div>

              </div>

              {/* Verification Footer */}
              <div className="pt-4 flex justify-between items-center text-[9px] font-sans text-slate-400 font-semibold border-t border-slate-100">
                <span>Verification Hash: {selectedCertificate.certificateCode}</span>
                <span>Issued Date: {new Date(selectedCertificate.issuedAt).toLocaleDateString()}</span>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VERIFY CREDENTIAL CODE SEARCH                     */}
      {/* ======================================================== */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl shadow-xl max-w-md w-full p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Verify Digital Credential
                </h3>
              </div>
              <button onClick={() => setShowVerifyModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleVerifySearch} className="space-y-3">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Enter Certificate Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. NEXA-PROJ-..."
                    value={verifyCodeInput}
                    onChange={(e) => setVerifyCodeInput(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 uppercase"
                  />
                  <button
                    type="submit"
                    disabled={verifying}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs cursor-pointer shadow-xs"
                  >
                    {verifying ? "Checking..." : "Verify"}
                  </button>
                </div>
              </div>
            </form>

            {verificationResult && (
              <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-500/30 space-y-2 animate-in fade-in duration-200 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Valid & Cryptographically Verified Credential</span>
                </div>
                <div className="space-y-1 text-slate-700 dark:text-zinc-300 pt-1">
                  <div><strong>Title:</strong> {verificationResult.title}</div>
                  <div><strong>Awarded To:</strong> {verificationResult.recipient.name} ({verificationResult.recipient.role})</div>
                  <div><strong>Issued Date:</strong> {new Date(verificationResult.issuedAt).toLocaleDateString()}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ISSUE NEW CREDENTIAL (HR & PM ONLY)               */}
      {/* ======================================================== */}
      {showIssueModal && canIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl shadow-xl max-w-lg w-full p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Issue Verifiable Digital Credential
                </h3>
              </div>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleIssueCertificate} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Recipient Employee *
                </label>
                <select
                  value={issueRecipientId}
                  onChange={(e) => setIssueRecipientId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Award / Certificate Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Infrastructure Architecture Specialist"
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    Credential Type
                  </label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  >
                    <option value="PROJECT_COMPLETION">Project Completion</option>
                    <option value="EXCELLENCE_AWARD">Excellence Honor</option>
                    <option value="TRAINING_WORKSHOP">Training & Workshop</option>
                    <option value="SKILL_ACHIEVEMENT">Skill Milestone</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    Linked Project (Optional)
                  </label>
                  <select
                    value={issueProjectId}
                    onChange={(e) => setIssueProjectId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  >
                    <option value="">-- None --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Diploma Text / Citation
                </label>
                <textarea
                  rows={3}
                  placeholder="In recognition of outstanding dedication and leadership in..."
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    Project Manager Signature
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Asif Iqbal"
                    value={issuePmSig}
                    onChange={(e) => setIssuePmSig(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    HR Signatory Seal
                  </label>
                  <input
                    type="text"
                    value={issueHrSig}
                    onChange={(e) => setIssueHrSig(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issuing}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  {issuing ? "Issuing & Signing..." : "Confer Credential"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
