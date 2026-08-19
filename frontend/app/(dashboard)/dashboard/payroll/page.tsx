"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { 
  DollarSign, 
  Plus, 
  FileText, 
  CheckCircle, 
  Clock, 
  Printer, 
  X,
  Building,
  CreditCard,
  CheckCircle2,
  Receipt,
  Download
} from "lucide-react";
import { useToast } from "@/components/Toast";

interface PayrollRecord {
  id: string;
  userId: string;
  month: string; // YYYY-MM
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  status: "PENDING" | "PAID";
  paidAt?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface EmployeeOption {
  id: string;
  name: string;
  email: string;
  role: string;
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

export default function PayrollPage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionLoading } = useSession();
  const { toast } = useToast();

  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Generate Modal States
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [baseSalary, setBaseSalary] = useState("");
  const [bonus, setBonus] = useState("");
  const [deductions, setDeductions] = useState("");
  const [generating, setGenerating] = useState(false);

  // Payslip View / Print Modal
  const [viewingRecord, setViewingRecord] = useState<PayrollRecord | null>(null);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLoading && !sessionData) {
      router.push("/login");
    }
  }, [sessionData, sessionLoading, router]);

  useEffect(() => {
    if (sessionData) {
      fetchPayrollLedger();
      if (sessionData.user.role === "HR") {
        fetchEmployees();
      }
    }
  }, [sessionData]);

  const fetchPayrollLedger = async () => {
    setLoadingRecords(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payroll/ledger`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await safeJson(res);
        setRecords(data.payrolls || []);
      }
    } catch (err) {
      console.error("Fetch payroll error:", err);
    } finally {
      setLoadingRecords(false);
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
        if (data.employees?.length > 0 && !selectedUserId) {
          setSelectedUserId(data.employees[0].id);
        }
      }
    } catch (err) {
      console.error("Fetch employees error:", err);
    }
  };

  const handleGeneratePayroll = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId || !month || !baseSalary) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payroll/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          month,
          baseSalary: parseFloat(baseSalary),
          bonus: bonus ? parseFloat(bonus) : 0,
          deductions: deductions ? parseFloat(deductions) : 0
        }),
        credentials: "include"
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Payroll entry generated successfully!");
        setShowGenerateModal(false);
        setBaseSalary("");
        setBonus("");
        setDeductions("");
        fetchPayrollLedger();
      } else {
        toast.error(data.error || "Failed to generate payroll entry.");
      }
    } catch (err) {
      console.error("Generate payroll error:", err);
      toast.error("Internal server error.");
    } finally {
      setGenerating(false);
    }
  };

  const handleProcessPayment = async (payrollId: string) => {
    setProcessingPayment(payrollId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payroll/${payrollId}/pay`, {
        method: "PATCH",
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Payroll status updated to PAID!");
        fetchPayrollLedger();
        if (viewingRecord && viewingRecord.id === payrollId) {
          setViewingRecord(data.payroll);
        }
      } else {
        toast.error(data.error || "Failed to mark payroll as paid.");
      }
    } catch (err) {
      console.error("Process payment error:", err);
      toast.error("Internal server error.");
    } finally {
      setProcessingPayment(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (sessionLoading || !sessionData) return null;

  const isHr = sessionData.user.role === "HR";

  // Calculate statistics
  const totalPaid = records.filter(r => r.status === "PAID").reduce((sum, r) => sum + r.netSalary, 0);
  const totalPending = records.filter(r => r.status === "PENDING").reduce((sum, r) => sum + r.netSalary, 0);

  return (
    <div className="flex-grow flex flex-col space-y-6 font-sans text-slate-900 dark:text-white transition-colors duration-150 text-left">
      
      {/* High-Precision Clean CSS Print Overrides */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide all page content except the printable payslip */
          body * {
            visibility: hidden !important;
          }

          html, body {
            background: #ffffff !important;
            color: #111827 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #printable-payslip, #printable-payslip * {
            visibility: visible !important;
          }

          #printable-payslip {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 40px 48px !important;
            background: #ffffff !important;
            color: #111827 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            z-index: 9999999 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          }

          /* Force high contrast text on white paper regardless of dark mode */
          #printable-payslip .print-text-main {
            color: #0f172a !important;
          }

          #printable-payslip .print-text-muted {
            color: #64748b !important;
          }

          #printable-payslip .print-text-success {
            color: #047857 !important;
          }

          #printable-payslip .print-text-danger {
            color: #b91c1c !important;
          }

          #printable-payslip .print-bg-light {
            background-color: #f8fafc !important;
          }

          #printable-payslip .print-border {
            border-color: #e2e8f0 !important;
          }

          .print-hidden {
            display: none !important;
          }
        }
      ` }} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-left">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Salary Ledger</h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
            Central financial statements, payslips & paycheck history
          </p>
        </div>
        {isHr && (
          <button
            onClick={() => setShowGenerateModal(true)}
            className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            Generate Payroll
          </button>
        )}
      </div>

      {/* Finance Overview Widgets for HR */}
      {isHr && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Total Disbursed (Paid)</span>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-extrabold text-slate-950 dark:text-white">${totalPaid.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <CheckCircle className="h-6 w-6 text-emerald-500 opacity-75" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Pending Disbursements</span>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">${totalPending.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <Clock className="h-6 w-6 text-amber-500 opacity-75" />
            </div>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5 border-b border-slate-50 dark:border-zinc-900 pb-3">
          <FileText className="h-4 w-4 text-slate-400" />
          Salary Records
        </h2>

        {loadingRecords ? (
          <div className="py-8 text-center text-slate-400 text-xs font-bold">Loading statements...</div>
        ) : records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-medium text-slate-600 dark:text-zinc-400">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-900 text-[10px] uppercase text-slate-400 dark:text-zinc-500 text-left">
                  {isHr && <th className="py-3 px-2 font-bold">Employee</th>}
                  <th className="py-3 px-2 font-bold">Month</th>
                  <th className="py-3 px-2 font-bold">Base Pay</th>
                  <th className="py-3 px-2 font-bold">Additions</th>
                  <th className="py-3 px-2 font-bold">Deductions</th>
                  <th className="py-3 px-2 font-bold">Net Payout</th>
                  <th className="py-3 px-2 font-bold">Status</th>
                  <th className="py-3 px-2 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-900/60">
                {records.map(rec => {
                  const isPaid = rec.status === "PAID";
                  const statusClass = isPaid
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/40 dark:hover:bg-zinc-900/30 transition-colors">
                      {isHr && <td className="py-3.5 px-2 text-slate-950 dark:text-white font-bold">{rec.user.name}</td>}
                      <td className="py-3.5 px-2 text-slate-700 dark:text-zinc-300 font-semibold">
                        {new Date(rec.month + "-02").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </td>
                      <td className="py-3.5 px-2 text-slate-700 dark:text-zinc-300">${rec.baseSalary.toFixed(2)}</td>
                      <td className="py-3.5 px-2 text-emerald-600 dark:text-emerald-450">+${rec.bonus.toFixed(2)}</td>
                      <td className="py-3.5 px-2 text-rose-600 dark:text-rose-450">-${rec.deductions.toFixed(2)}</td>
                      <td className="py-3.5 px-2 text-slate-950 dark:text-white font-bold">${rec.netSalary.toFixed(2)}</td>
                      <td className="py-3.5 px-2">
                        <span className={`inline-flex items-center text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${statusClass}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <div className="flex justify-end gap-1.5">
                          {isHr && !isPaid && (
                            <button
                              onClick={() => handleProcessPayment(rec.id)}
                              disabled={processingPayment === rec.id}
                              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-bold py-1 px-2.5 rounded-lg cursor-pointer transition-colors"
                            >
                              {processingPayment === rec.id ? "Paying..." : "Pay"}
                            </button>
                          )}
                          <button
                            onClick={() => setViewingRecord(rec)}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-650 dark:text-zinc-400 font-bold py-1 px-2.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                          >
                            <Printer className="h-3 w-3" />
                            Payslip
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs font-bold">No payroll records logged.</div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: GENERATE PAYROLL ENTRY                            */}
      {/* ======================================================== */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl shadow-xl max-w-md w-full p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-zinc-900">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                Generate Employee Payroll
              </h3>
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleGeneratePayroll} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Select Employee</label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.email}) - {emp.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Period (Month)</label>
                  <input
                    type="month"
                    required
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Base Salary ($)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5000"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Bonus Addition ($)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={bonus}
                    onChange={(e) => setBonus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Deductions ($)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={deductions}
                    onChange={(e) => setDeductions(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50 dark:border-zinc-900/60">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
                >
                  {generating ? "Generating..." : "Generate Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: HIGH-FIDELITY PRINTABLE PAYSLIP STATEMENT         */}
      {/* ======================================================== */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="relative bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-2xl w-full p-8 text-left space-y-6 animate-in zoom-in-95 duration-200 my-8">
            
            {/* Modal Actions (Hidden on Print) */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-zinc-900 print-hidden">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Paycheck Statement Preview</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-1.5 px-3.5 rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-xs transition-all hover:scale-105 active:scale-95"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setViewingRecord(null)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Printable Payslip Card (Clean Corporate Invoice Layout) */}
            <div id="printable-payslip" className="space-y-6 text-left">
              
              {/* Header: Company & Title */}
              <div className="flex justify-between items-start pb-5 border-b-2 print-border border-slate-200 dark:border-zinc-800">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm print-bg-light">
                      NC
                    </div>
                    <span className="text-lg font-black tracking-tight print-text-main text-slate-950 dark:text-white">
                      NexaCore Industries Ltd.
                    </span>
                  </div>
                  <p className="text-[11px] print-text-muted text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                    Kha 224 Pragati Sarani, Merul Badda, Dhaka 1212<br />
                    Phone: +880-2-9842 &bull; Email: payroll@nexacore.io
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <div className="inline-block bg-slate-900 text-white dark:bg-white dark:text-zinc-950 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md print-text-main">
                    Official Salary Slip
                  </div>
                  <div className="text-xs font-extrabold print-text-main text-slate-900 dark:text-white mt-1">
                    Period: {new Date(viewingRecord.month + "-02").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </div>
                  <div className="text-[10px] font-semibold print-text-muted text-slate-400">
                    Slip ID: #{viewingRecord.id.slice(-8).toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Employee & Disbursement Metadata Grid */}
              <div className="grid grid-cols-2 gap-6 p-4 rounded-2xl print-bg-light bg-slate-50 dark:bg-zinc-900/50 border print-border border-slate-200/80 dark:border-zinc-800">
                <div className="space-y-1 text-xs">
                  <span className="text-[9px] font-bold print-text-muted text-slate-400 uppercase tracking-widest block">Employee Details</span>
                  <div className="text-sm font-extrabold print-text-main text-slate-950 dark:text-white">{viewingRecord.user.name}</div>
                  <div className="print-text-muted text-slate-600 dark:text-zinc-400 font-medium">{viewingRecord.user.email}</div>
                  <div className="text-[10px] font-bold print-text-main text-slate-700 dark:text-zinc-300">
                    Designation: <span className="uppercase font-black text-indigo-600 dark:text-indigo-400">{viewingRecord.user.role}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-right sm:text-left sm:pl-4 sm:border-l print-border border-slate-200 dark:border-zinc-800">
                  <span className="text-[9px] font-bold print-text-muted text-slate-400 uppercase tracking-widest block">Disbursement Status</span>
                  <div className="flex items-center gap-1.5 sm:justify-start justify-end">
                    <span className={`inline-flex items-center text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      viewingRecord.status === "PAID"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 print-text-success"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400"
                    }`}>
                      {viewingRecord.status}
                    </span>
                  </div>
                  <div className="print-text-muted text-slate-500 dark:text-zinc-400 text-[11px] mt-1">
                    Issue Date: {new Date(viewingRecord.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                  {viewingRecord.paidAt && (
                    <div className="text-[11px] font-bold print-text-success text-emerald-600 dark:text-emerald-400">
                      Disbursed On: {new Date(viewingRecord.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  )}
                </div>
              </div>

              {/* Earnings & Deductions Breakdown Table */}
              <div className="rounded-2xl overflow-hidden border print-border border-slate-200 dark:border-zinc-800">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="print-bg-light bg-slate-100 dark:bg-zinc-900 print-text-main text-slate-700 dark:text-zinc-300 text-[10px] uppercase font-extrabold border-b print-border border-slate-200 dark:border-zinc-800">
                      <th className="py-3 px-4">Earnings / Description</th>
                      <th className="py-3 px-4 text-right">Addition (+)</th>
                      <th className="py-3 px-4 text-right">Deduction (-)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y print-border divide-slate-100 dark:divide-zinc-900 text-slate-800 dark:text-zinc-200 font-semibold">
                    <tr>
                      <td className="py-3 px-4 font-bold print-text-main">Basic Salary Base Pay</td>
                      <td className="py-3 px-4 text-right print-text-main font-bold">${viewingRecord.baseSalary.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right print-text-muted text-slate-400">-</td>
                    </tr>
                    {viewingRecord.bonus > 0 && (
                      <tr>
                        <td className="py-3 px-4 font-bold print-text-success text-emerald-600 dark:text-emerald-400">
                          Performance Bonus & Project Allowances
                        </td>
                        <td className="py-3 px-4 text-right font-bold print-text-success text-emerald-600 dark:text-emerald-400">
                          +${viewingRecord.bonus.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right print-text-muted text-slate-400">-</td>
                      </tr>
                    )}
                    {viewingRecord.deductions > 0 && (
                      <tr>
                        <td className="py-3 px-4 font-bold print-text-danger text-rose-600 dark:text-rose-400">
                          Statutory Taxes & Advance Deductions
                        </td>
                        <td className="py-3 px-4 text-right print-text-muted text-slate-400">-</td>
                        <td className="py-3 px-4 text-right font-bold print-text-danger text-rose-600 dark:text-rose-400">
                          -${viewingRecord.deductions.toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Net Payable Highlight Banner */}
              <div className="flex justify-between items-center p-5 rounded-2xl print-bg-light bg-slate-100/80 dark:bg-zinc-900 border print-border border-slate-200 dark:border-zinc-800">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest print-text-muted text-slate-500">
                    Net Take-Home Pay
                  </span>
                  <p className="text-[11px] print-text-muted text-slate-500 font-medium">
                    Credited directly via Electronic Bank Transfer (BEFTN/NPSB).
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black tracking-tight print-text-main text-slate-950 dark:text-white">
                    ${viewingRecord.netSalary.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Certification & Authorization Seal Footer */}
              <div className="pt-6 border-t-2 print-border border-slate-200 dark:border-zinc-800 flex justify-between items-end text-[10px] print-text-muted text-slate-400">
                <div className="space-y-1">
                  <div className="font-bold print-text-main text-slate-700 dark:text-zinc-300">Authorized by Finance & Accounts</div>
                  <div>This document is an electronically certified payroll receipt generated by NexaCore Systems.</div>
                </div>
                <div className="text-right font-mono text-[9px]">
                  VERIFIED DIGITAL CERTIFICATE
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
