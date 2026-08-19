"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { 
  Award, 
  Star, 
  User, 
  Plus, 
  MessageSquare, 
  Calendar, 
  X,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/components/Toast";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface EvaluationRecord {
  id: string;
  rating: number;
  feedback: string;
  createdAt: string;
  pm: {
    name: string;
    email: string;
  };
  user?: {
    name: string;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function EvaluationsPage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionLoading } = useSession();
  const { toast } = useToast();

  // General state
  const [myEvaluations, setMyEvaluations] = useState<EvaluationRecord[]>([]);
  const [loadingMy, setLoadingMy] = useState(false);

  // PM / HR state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpForReview, setSelectedEmpForReview] = useState("");
  const [employeeHistory, setEmployeeHistory] = useState<EvaluationRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Evaluation Form Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [formEmpId, setFormEmpId] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formFeedback, setFormFeedback] = useState("");
  const [submittingForm, setSubmittingForm] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !sessionData) {
      router.push("/login");
    }
  }, [sessionData, sessionLoading, router]);

  useEffect(() => {
    if (sessionData) {
      fetchMyEvaluations();
      if (sessionData.user.role === "HR" || sessionData.user.role === "PROJECT_MANAGER") {
        fetchEmployeesList();
      }
    }
  }, [sessionData]);

  const fetchMyEvaluations = async () => {
    setLoadingMy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/evaluations/my-evaluations`, {
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        setMyEvaluations(data.evaluations || []);
      }
    } catch (err) {
      console.error("Fetch personal evaluations error:", err);
    } finally {
      setLoadingMy(false);
    }
  };

  const fetchEmployeesList = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/hr/employees`, {
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error("Fetch employees error:", err);
    }
  };

  const handleFetchEmployeeHistory = async (userId: string) => {
    setSelectedEmpForReview(userId);
    if (!userId) {
      setEmployeeHistory([]);
      return;
    }
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/evaluations/employee/${userId}`, {
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        setEmployeeHistory(data.evaluations || []);
      }
    } catch (err) {
      console.error("Fetch employee history error:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmpId || !formFeedback.trim()) return;

    setSubmittingForm(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/evaluations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: formEmpId,
          rating: formRating,
          feedback: formFeedback
        }),
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Performance review submitted successfully!");
        setFormEmpId("");
        setFormRating(5);
        setFormFeedback("");
        setShowFormModal(false);
        fetchMyEvaluations(); // Refresh logs
        if (selectedEmpForReview === formEmpId) {
          handleFetchEmployeeHistory(formEmpId); // Refresh audited list
        }
      } else {
        toast.error(data.error || "Failed to submit review.");
      }
    } catch (err) {
      console.error("Submit evaluation error:", err);
    } finally {
      setSubmittingForm(false);
    }
  };

  if (sessionLoading || !sessionData) return null;

  const isReviewer = sessionData.user.role === "HR" || sessionData.user.role === "PROJECT_MANAGER";

  // Renders star rating visually
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            className={`h-4.5 w-4.5 ${
              star <= rating 
                ? "text-amber-500 fill-amber-500" 
                : "text-slate-200 dark:text-zinc-800"
            }`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex-grow flex flex-col space-y-6 font-sans text-slate-900 dark:text-white transition-colors duration-150 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-left">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Performance Reviews</h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
            Conduct evaluations, track assessments, and view historical ratings
          </p>
        </div>
        {isReviewer && (
          <button
            onClick={() => setShowFormModal(true)}
            className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            Evaluate Employee
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Manager/HR: Historical Employee Evaluations Search */}
        {isReviewer && (
          <div className="lg:col-span-3 bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl p-6 shadow-xs text-left space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5 border-b border-slate-50 dark:border-zinc-900 pb-3">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              Employee Evaluation Directory
            </h2>

            <div className="max-w-md">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Select Employee to Inspect History</label>
              <select
                value={selectedEmpForReview}
                onChange={(e) => handleFetchEmployeeHistory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-medium"
              >
                <option value="">-- Choose employee --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                ))}
              </select>
            </div>

            {selectedEmpForReview && (
              <div className="pt-4 space-y-4">
                {loadingHistory ? (
                  <div className="text-xs text-slate-400 font-bold">Synchronizing history...</div>
                ) : employeeHistory.length > 0 ? (
                  <div className="space-y-4">
                    {employeeHistory.map(rec => (
                      <div key={rec.id} className="bg-slate-50/45 dark:bg-zinc-900/20 p-5 rounded-2xl border border-slate-100/50 dark:border-zinc-900/40 space-y-3">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 block">RATING ASSESSMENT</span>
                            {renderStars(rec.rating)}
                          </div>
                          <div className="text-right text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                            Evaluated by {rec.pm.name} &bull; {new Date(rec.createdAt).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 block">QUALITATIVE FEEDBACK</span>
                          <p className="text-xs text-slate-700 dark:text-zinc-350 leading-relaxed font-medium whitespace-pre-line">{rec.feedback}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 border border-dashed border-slate-100 dark:border-zinc-900 rounded-2xl text-xs font-bold">
                    No historical reviews found for this employee.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Employee Personal Reviews History */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl p-6 shadow-xs text-left space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5 border-b border-slate-50 dark:border-zinc-900 pb-3">
            <Award className="h-4 w-4 text-slate-400" />
            My Performance Assessments
          </h2>

          {loadingMy ? (
            <div className="py-8 text-center text-slate-400 text-xs font-bold">Loading evaluations...</div>
          ) : myEvaluations.length > 0 ? (
            <div className="space-y-4">
              {myEvaluations.map(rec => (
                <div key={rec.id} className="bg-slate-50/45 dark:bg-zinc-900/20 p-5 rounded-2xl border border-slate-100/50 dark:border-zinc-900/40 space-y-3">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 block">RATING ASSESSMENT</span>
                      {renderStars(rec.rating)}
                    </div>
                    <div className="text-right text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                      Evaluated by PM {rec.pm.name} &bull; {new Date(rec.createdAt).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 block">FEEDBACK DETAILS</span>
                    <p className="text-xs text-slate-700 dark:text-zinc-350 leading-relaxed font-medium whitespace-pre-line">{rec.feedback}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 dark:border-zinc-900 rounded-2xl text-xs">
              No performance reviews have been logged for your profile yet.
            </div>
          )}
        </div>

      </div>

      {/* HR/PM Evaluate Employee Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 dark:bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl shadow-xl max-w-md w-full p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-zinc-900">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="h-4 w-4 text-slate-400" />
                Submit Employee Evaluation
              </h3>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitEvaluation} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Select Employee</label>
                <select
                  required
                  value={formEmpId}
                  onChange={(e) => setFormEmpId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-medium"
                >
                  <option value="">-- Choose employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Rating Rating (1 to 5 Stars)</label>
                <div className="flex gap-2 items-center mt-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormRating(star)}
                      className="p-1 cursor-pointer transition-transform active:scale-95"
                    >
                      <Star 
                        className={`h-7 w-7 ${
                          star <= formRating 
                            ? "text-amber-500 fill-amber-500" 
                            : "text-slate-200 dark:text-zinc-800"
                        }`} 
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-450 dark:text-zinc-500 ml-2">({formRating} out of 5)</span>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Qualitative Feedback Details</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide qualitative details, performance strengths, or avenues for growth..."
                  value={formFeedback}
                  onChange={(e) => setFormFeedback(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50 dark:border-zinc-900/60">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-bold py-1.5 px-4 rounded-lg text-[10px] cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingForm}
                  className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-1.5 px-4 rounded-lg text-[10px] cursor-pointer shadow-xs transition-colors"
                >
                  {submittingForm ? "Submitting..." : "Submit Evaluation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
