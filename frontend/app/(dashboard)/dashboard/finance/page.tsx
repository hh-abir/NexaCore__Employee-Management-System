"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  PieChart, 
  Building, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Search, 
  Printer, 
  Download, 
  Filter, 
  Calendar, 
  Cloud, 
  Laptop, 
  Server, 
  Sparkles, 
  X, 
  Briefcase, 
  AlertCircle,
  FileSpreadsheet,
  Lock
} from "lucide-react";
import { useToast } from "@/components/Toast";

interface FinanceExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  vendor?: string;
  invoiceRef?: string;
  status: string;
  date: string;
  notes?: string;
  recordedBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface FinanceSummary {
  budget: {
    fiscalYear: number;
    quarter: string;
    allocated: number;
    reserveFund: number;
    totalExpensesYtd: number;
    remainingBudget: number;
    totalLiquidity: number;
    monthlyOpExBurn: number;
    runwayMonths: number;
  };
  categoryBreakdown: {
    category: string;
    label: string;
    amount: number;
    percentage: number;
  }[];
  projectFinances: {
    totalAllocatedProjectBudget: number;
    activeProjectsCount: number;
    completedProjectsCount: number;
  };
  expenses: FinanceExpense[];
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

const getCategoryBadgeClass = (category: string) => {
  switch (category) {
    case "CLOUD_INFRASTRUCTURE":
      return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400";
    case "SAAS_SUBSCRIPTIONS":
      return "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400";
    case "HARDWARE_EQUIPMENT":
      return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400";
    case "TEAM_EVENTS":
      return "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400";
    case "OFFICE_OPERATIONS":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400";
    default:
      return "bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-300";
  }
};

export default function FinancePage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionLoading } = useSession();
  const { toast } = useToast();

  const [data, setData] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Record Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("CLOUD_INFRASTRUCTURE");
  const [expenseVendor, setExpenseVendor] = useState("");
  const [expenseInvoiceRef, setExpenseInvoiceRef] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");
  const [submittingExpense, setSubmittingExpense] = useState(false);

  // Budget Adjust Modal
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetAllocated, setBudgetAllocated] = useState("");
  const [budgetReserve, setBudgetReserve] = useState("");
  const [savingBudget, setSavingBudget] = useState(false);

  useEffect(() => {
    if (!sessionLoading) {
      if (!sessionData) {
        router.push("/login");
      } else if (sessionData.user.role !== "HR") {
        toast.error("Access restricted to HR Administrators.");
        router.push("/dashboard");
      }
    }
  }, [sessionData, sessionLoading, router]);

  useEffect(() => {
    if (sessionData && sessionData.user.role === "HR") {
      fetchFinanceData();
    }
  }, [sessionData]);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/finance/summary`, {
        credentials: "include"
      });
      if (res.ok) {
        const json = await safeJson(res);
        setData(json);
        setBudgetAllocated(String(json.budget?.allocated || "250000"));
        setBudgetReserve(String(json.budget?.reserveFund || "50000"));
      } else {
        toast.error("Failed to load corporate finance summary.");
      }
    } catch (err) {
      console.error("Finance fetch error:", err);
      toast.error("Internal server error.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) {
      toast.error("Please provide a title and amount.");
      return;
    }

    setSubmittingExpense(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/finance/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: expenseTitle.trim(),
          amount: parseFloat(expenseAmount),
          category: expenseCategory,
          vendor: expenseVendor.trim() || undefined,
          invoiceRef: expenseInvoiceRef.trim() || undefined,
          date: expenseDate || undefined,
          notes: expenseNotes.trim() || undefined
        }),
        credentials: "include"
      });
      const resJson = await safeJson(res);

      if (res.ok) {
        toast.success("Expense added to corporate ledger!");
        setShowExpenseModal(false);
        setExpenseTitle("");
        setExpenseAmount("");
        setExpenseVendor("");
        setExpenseInvoiceRef("");
        setExpenseNotes("");
        fetchFinanceData();
      } else {
        toast.error(resJson.error || "Failed to record expense.");
      }
    } catch (err) {
      toast.error("Internal server error.");
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/finance/expenses/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        toast.success("Expense removed from ledger.");
        fetchFinanceData();
      } else {
        const resJson = await safeJson(res);
        toast.error(resJson.error || "Failed to delete expense.");
      }
    } catch (err) {
      toast.error("Internal server error.");
    }
  };

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBudget(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/finance/budget`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allocated: parseFloat(budgetAllocated),
          reserveFund: parseFloat(budgetReserve)
        }),
        credentials: "include"
      });
      const resJson = await safeJson(res);

      if (res.ok) {
        toast.success("Corporate budget parameters updated!");
        setShowBudgetModal(false);
        fetchFinanceData();
      } else {
        toast.error(resJson.error || "Failed to update budget.");
      }
    } catch (err) {
      toast.error("Internal server error.");
    } finally {
      setSavingBudget(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    if (!data?.expenses) return [];
    return data.expenses.filter(e => {
      if (activeCategory !== "ALL" && e.category !== activeCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.title.toLowerCase().includes(q);
        const matchVendor = e.vendor?.toLowerCase().includes(q);
        const matchRef = e.invoiceRef?.toLowerCase().includes(q);
        if (!matchTitle && !matchVendor && !matchRef) return false;
      }
      return true;
    });
  }, [data?.expenses, activeCategory, searchQuery]);

  if (sessionLoading || !sessionData || sessionData.user.role !== "HR") return null;

  return (
    <div className="flex-grow flex flex-col space-y-6 font-sans text-slate-900 dark:text-white transition-colors duration-150 text-left">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Corporate Finance & OpEx Ledger</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <Lock className="h-3 w-3" />
              HR Confidential
            </span>
          </h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
            Operational expenditure management, cloud infrastructure outlays, SaaS licensing & capital runway
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowBudgetModal(true)}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-900 dark:text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
          >
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <span>Adjust Budget ({data?.budget?.quarter || "Q3"})</span>
          </button>

          <button
            onClick={() => setShowExpenseModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Record OpEx Expense</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>Export Statement</span>
          </button>
        </div>
      </div>

      {loading || !data ? (
        <div className="py-24 text-center text-slate-400 text-xs font-bold">Loading corporate finance ledger...</div>
      ) : (
        <>
          {/* Top 4 Financial Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Total Capital Liquidity</span>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  ${data.budget.totalLiquidity.toLocaleString()}
                </span>
                <Building className="h-6 w-6 text-indigo-500 opacity-75" />
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                ${data.budget.reserveFund.toLocaleString()} in Reserve Fund
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">OpEx Outlay (YTD)</span>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                  ${data.budget.totalExpensesYtd.toLocaleString()}
                </span>
                <CreditCard className="h-6 w-6 text-rose-500 opacity-75" />
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                ${data.budget.remainingBudget.toLocaleString()} Budget Remaining
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Monthly Burn Rate</span>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                  ${data.budget.monthlyOpExBurn.toLocaleString()}
                </span>
                <TrendingUp className="h-6 w-6 text-amber-500 opacity-75" />
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                OpEx + Payroll Overhead
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Financial Runway</span>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {data.budget.runwayMonths} Mo
                </span>
                <ShieldCheck className="h-6 w-6 text-emerald-500 opacity-75" />
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                Sustained Capital Horizon
              </div>
            </div>
          </div>

          {/* OpEx Category Breakdown Grid */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-emerald-500" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  Operational Expenditure Allocation by Category
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">
                Total Expenses: ${data.budget.totalExpensesYtd.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {data.categoryBreakdown.map(cat => (
                <div 
                  key={cat.category}
                  onClick={() => setActiveCategory(activeCategory === cat.category ? "ALL" : cat.category)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    activeCategory === cat.category 
                      ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 shadow-xs" 
                      : "bg-slate-50/50 dark:bg-zinc-900/30 border-slate-100 dark:border-zinc-850 hover:border-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] font-extrabold uppercase text-slate-400">
                    <span>{cat.label}</span>
                    <span>{cat.percentage}%</span>
                  </div>
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    ${cat.amount.toLocaleString()}
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${cat.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* OpEx Expense Ledger Segment */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-4">
            
            {/* Search & Tabs */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-2 border-b border-slate-100 dark:border-zinc-900">
              <div className="relative flex items-center w-full sm:w-80 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2">
                <Search className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search expense, vendor, invoice ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs outline-none text-zinc-900 dark:text-white w-full font-medium"
                />
              </div>

              <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl gap-1 text-[11px] font-bold overflow-x-auto">
                {["ALL", "CLOUD_INFRASTRUCTURE", "SAAS_SUBSCRIPTIONS", "HARDWARE_EQUIPMENT", "TEAM_EVENTS", "OFFICE_OPERATIONS"].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      activeCategory === cat 
                        ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs" 
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {cat.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Expenses Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-zinc-900 pb-2">
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2">Expense Details</th>
                    <th className="py-3 px-2">Category</th>
                    <th className="py-3 px-2">Vendor / Invoice</th>
                    <th className="py-3 px-2 text-right">Amount</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                  {filteredExpenses.length > 0 ? (
                    filteredExpenses.map(expense => (
                      <tr key={expense.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                        <td className="py-3.5 px-2 font-mono font-bold text-slate-500 whitespace-nowrap">
                          {expense.date}
                        </td>
                        <td className="py-3.5 px-2">
                          <div className="font-extrabold text-slate-900 dark:text-white">{expense.title}</div>
                          {expense.notes && (
                            <div className="text-[10px] text-slate-400 font-medium line-clamp-1">{expense.notes}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-2">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${getCategoryBadgeClass(expense.category)}`}>
                            {expense.category.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-2">
                          <div className="font-bold text-slate-700 dark:text-zinc-300">{expense.vendor || "N/A"}</div>
                          {expense.invoiceRef && (
                            <div className="font-mono text-[9px] text-slate-400">{expense.invoiceRef}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-2 text-right font-extrabold text-slate-900 dark:text-white font-mono text-sm">
                          ${expense.amount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer transition-colors"
                            title="Delete Expense"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-bold text-xs">
                        No matching expenses found in ledger.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* MODAL: RECORD OPEX EXPENSE                               */}
      {/* ======================================================== */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl shadow-xl max-w-lg w-full p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-500" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Record Corporate OpEx Expense
                </h3>
              </div>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Expense Title / Purpose *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vercel Enterprise Pro & MongoDB Atlas Cluster"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    Amount ($ USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 2400.00"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    OpEx Category *
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  >
                    <option value="CLOUD_INFRASTRUCTURE">Cloud Infrastructure</option>
                    <option value="SAAS_SUBSCRIPTIONS">SaaS Subscriptions</option>
                    <option value="HARDWARE_EQUIPMENT">Hardware & Equipment</option>
                    <option value="OFFICE_OPERATIONS">Office Operations & Utilities</option>
                    <option value="TEAM_EVENTS">Team Events & Offsites</option>
                    <option value="LEGAL_COMPLIANCE">Legal & Compliance</option>
                    <option value="MARKETING_ADVERTISING">Marketing & Growth</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    Vendor / Provider
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vercel Inc."
                    value={expenseVendor}
                    onChange={(e) => setExpenseVendor(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    Invoice Reference #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-8812"
                    value={expenseInvoiceRef}
                    onChange={(e) => setExpenseInvoiceRef(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Transaction Date
                </label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Receipt Notes / Memo
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional accounting context..."
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  {submittingExpense ? "Recording..." : "Record in Ledger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADJUST BUDGET PARAMETERS                          */}
      {/* ======================================================== */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl shadow-xl max-w-md w-full p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Adjust Corporate Budget Parameters
                </h3>
              </div>
              <button onClick={() => setShowBudgetModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateBudget} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Quarterly Allocated Budget ($)
                </label>
                <input
                  type="number"
                  step="1000"
                  required
                  value={budgetAllocated}
                  onChange={(e) => setBudgetAllocated(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium font-mono"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Emergency Reserve Fund ($)
                </label>
                <input
                  type="number"
                  step="1000"
                  required
                  value={budgetReserve}
                  onChange={(e) => setBudgetReserve(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium font-mono"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBudget}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  {savingBudget ? "Updating..." : "Save Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
