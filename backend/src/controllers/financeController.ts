import { Response } from "express";
import { prisma } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/roleGuard";
import { ExpenseCategory, ExpenseStatus } from "@prisma/client";

export const getFinanceSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. Fetch or create Budget
    let budget = await prisma.financeBudget.findFirst({
      where: { fiscalYear: 2026, quarter: "Q3" }
    });

    if (!budget) {
      budget = await prisma.financeBudget.create({
        data: {
          fiscalYear: 2026,
          quarter: "Q3",
          allocated: 250000.0,
          reserveFund: 50000.0
        }
      });
    }

    // 2. Fetch or auto-seed Expenses
    let expenses = await prisma.financeExpense.findMany({
      include: {
        recordedBy: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { date: "desc" }
    });

    if (expenses.length === 0) {
      const initialExpenses = [
        {
          title: "AWS Multi-Region Production Cluster & S3 Storage",
          amount: 4850.0,
          category: "CLOUD_INFRASTRUCTURE" as ExpenseCategory,
          vendor: "Amazon Web Services Inc.",
          invoiceRef: "INV-AWS-2026-081",
          status: "APPROVED" as ExpenseStatus,
          date: "2026-08-01",
          notes: "Primary cloud infra, Kubernetes clusters, and backups.",
          recordedById: req.user!.id
        },
        {
          title: "GitHub Enterprise Cloud & Copilot Business Licenses",
          amount: 2200.0,
          category: "SAAS_SUBSCRIPTIONS" as ExpenseCategory,
          vendor: "GitHub / Microsoft",
          invoiceRef: "INV-GH-882194",
          status: "APPROVED" as ExpenseStatus,
          date: "2026-08-05",
          notes: "Annual developer tooling licenses for engineering division.",
          recordedById: req.user!.id
        },
        {
          title: "Google Workspace & Slack Enterprise Grid",
          amount: 1450.0,
          category: "SAAS_SUBSCRIPTIONS" as ExpenseCategory,
          vendor: "Google LLC / Slack",
          invoiceRef: "INV-GW-90123",
          status: "APPROVED" as ExpenseStatus,
          date: "2026-08-07",
          notes: "Corporate communications and cloud productivity suite.",
          recordedById: req.user!.id
        },
        {
          title: "Apple MacBook Pro M3 Max & Dell UltraSharp Monitors",
          amount: 14200.0,
          category: "HARDWARE_EQUIPMENT" as ExpenseCategory,
          vendor: "Apple Business Direct",
          invoiceRef: "INV-APL-77120",
          status: "APPROVED" as ExpenseStatus,
          date: "2026-08-10",
          notes: "Hardware upgrades for newly onboarded senior engineers.",
          recordedById: req.user!.id
        },
        {
          title: "NexaCore Q3 Engineering Hackathon & Innovation Summit",
          amount: 6800.0,
          category: "TEAM_EVENTS" as ExpenseCategory,
          vendor: "Grand Hyatt Banquets",
          invoiceRef: "INV-EVT-4401",
          status: "APPROVED" as ExpenseStatus,
          date: "2026-08-14",
          notes: "Quarterly hackathon prize pool, catering, and venue rental.",
          recordedById: req.user!.id
        },
        {
          title: "HQ Office High-Speed Dedicated Fiber & Facility Operations",
          amount: 3200.0,
          category: "OFFICE_OPERATIONS" as ExpenseCategory,
          vendor: "Metro Fiber & Realty Co.",
          invoiceRef: "INV-FAC-1092",
          status: "APPROVED" as ExpenseStatus,
          date: "2026-08-16",
          notes: "Dedicated fiber link, power backup, and facilities maintenance.",
          recordedById: req.user!.id
        }
      ];

      for (const item of initialExpenses) {
        await prisma.financeExpense.create({ data: item });
      }

      expenses = await prisma.financeExpense.findMany({
        include: {
          recordedBy: {
            select: { id: true, name: true, email: true, role: true }
          }
        },
        orderBy: { date: "desc" }
      });
    }

    // 3. Financial Metrics Calculations
    const totalExpensesYtd = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Monthly payroll calculation from payroll records
    const payrolls = await prisma.payroll.findMany({ select: { baseSalary: true, bonus: true } });
    const monthlyPayroll = payrolls.length > 0 
      ? payrolls.reduce((sum, p) => sum + (p.baseSalary + (p.bonus || 0)), 0)
      : 38500;

    const monthlyOpExBurn = Math.round(totalExpensesYtd / 3) + monthlyPayroll;
    const remainingBudget = Math.max(0, budget.allocated - totalExpensesYtd);
    const totalLiquidity = remainingBudget + budget.reserveFund;
    const runwayMonths = monthlyOpExBurn > 0 ? (totalLiquidity / monthlyOpExBurn).toFixed(1) : "12.0";

    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const categoryBreakdown = Object.keys(categoryTotals).map(cat => ({
      category: cat,
      label: cat.replace(/_/g, " "),
      amount: categoryTotals[cat],
      percentage: totalExpensesYtd > 0 ? Math.round((categoryTotals[cat] / totalExpensesYtd) * 100) : 0
    }));

    // Project financial stats
    const projects = await prisma.project.findMany({
      select: { id: true, name: true, budget: true, status: true }
    });
    const totalAllocatedProjectBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

    return res.status(200).json({
      budget: {
        fiscalYear: budget.fiscalYear,
        quarter: budget.quarter,
        allocated: budget.allocated,
        reserveFund: budget.reserveFund,
        totalExpensesYtd,
        remainingBudget,
        totalLiquidity,
        monthlyOpExBurn,
        runwayMonths: Number(runwayMonths)
      },
      categoryBreakdown,
      projectFinances: {
        totalAllocatedProjectBudget,
        activeProjectsCount: projects.filter(p => p.status === "ACTIVE").length,
        completedProjectsCount: projects.filter(p => p.status === "COMPLETED").length
      },
      expenses
    });
  } catch (error) {
    console.error("[getFinanceSummary Error]:", error);
    return res.status(500).json({ error: "Failed to load corporate finance summary." });
  }
};

export const createExpense = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, amount, category, vendor, invoiceRef, date, notes } = req.body;

    if (!title || !amount || !category) {
      return res.status(400).json({ error: "Title, amount, and category are required." });
    }

    const expense = await prisma.financeExpense.create({
      data: {
        title: title.trim(),
        amount: parseFloat(amount),
        category: category as ExpenseCategory,
        vendor: vendor ? vendor.trim() : null,
        invoiceRef: invoiceRef ? invoiceRef.trim() : null,
        status: "APPROVED",
        date: date || new Date().toISOString().slice(0, 10),
        notes: notes ? notes.trim() : null,
        recordedById: req.user!.id
      },
      include: {
        recordedBy: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    return res.status(201).json({ message: "Expense recorded in ledger.", expense });
  } catch (error) {
    console.error("[createExpense Error]:", error);
    return res.status(500).json({ error: "Failed to record expense." });
  }
};

export const deleteExpense = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    await prisma.financeExpense.delete({
      where: { id }
    });

    return res.status(200).json({ message: "Expense removed from ledger." });
  } catch (error) {
    console.error("[deleteExpense Error]:", error);
    return res.status(500).json({ error: "Failed to delete expense." });
  }
};

export const updateBudget = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { allocated, reserveFund, quarter, fiscalYear } = req.body;

    let budget = await prisma.financeBudget.findFirst({
      where: { fiscalYear: fiscalYear || 2026, quarter: quarter || "Q3" }
    });

    if (budget) {
      budget = await prisma.financeBudget.update({
        where: { id: budget.id },
        data: {
          allocated: allocated !== undefined ? parseFloat(allocated) : budget.allocated,
          reserveFund: reserveFund !== undefined ? parseFloat(reserveFund) : budget.reserveFund
        }
      });
    } else {
      budget = await prisma.financeBudget.create({
        data: {
          fiscalYear: fiscalYear || 2026,
          quarter: quarter || "Q3",
          allocated: parseFloat(allocated) || 250000.0,
          reserveFund: parseFloat(reserveFund) || 50000.0
        }
      });
    }

    return res.status(200).json({ message: "Budget parameters updated successfully.", budget });
  } catch (error) {
    console.error("[updateBudget Error]:", error);
    return res.status(500).json({ error: "Failed to update budget parameters." });
  }
};
