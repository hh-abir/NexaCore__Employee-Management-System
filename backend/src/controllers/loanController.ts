import { Response } from "express";
import { prisma } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/roleGuard";
import { createNotification, createRoleNotification } from "../utils/notificationService";

export const applyLoan = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, installments, reason } = req.body;

    if (!amount || !installments || !reason || !reason.trim()) {
      return res.status(400).json({ error: "Loan amount, number of installments, and reason are required." });
    }

    const amountVal = parseFloat(amount);
    const instVal = parseInt(installments);

    if (isNaN(amountVal) || amountVal <= 0) {
      return res.status(400).json({ error: "Loan amount must be a positive number." });
    }

    if (isNaN(instVal) || instVal <= 0) {
      return res.status(400).json({ error: "Number of installments must be a positive integer." });
    }

    // Calculate monthly repayment
    const monthlyRepayment = amountVal / instVal;

    const loan = await prisma.loan.create({
      data: {
        amount: amountVal,
        installments: instVal,
        monthlyRepayment,
        reason: reason.trim(),
        userId: req.user!.id
      }
    });

    // Notify HR of new pending loan application
    await createRoleNotification(
      ["HR"],
      "New Loan Application",
      `${req.user!.name || "An employee"} submitted a loan request of $${amountVal.toFixed(2)} (${instVal} months).`,
      "LOAN",
      "/dashboard/loans"
    );

    return res.status(201).json({ message: "Loan application submitted successfully.", loan });
  } catch (err) {
    console.error("Apply Loan Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const getMyLoans = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const loans = await prisma.loan.findMany({
      where: {
        userId: req.user!.id
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.status(200).json({ loans });
  } catch (err) {
    console.error("Fetch My Loans Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const getPendingLoans = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role !== "HR") {
      return res.status(403).json({ error: "Forbidden: Only HR administrators can review loan applications." });
    }

    const loans = await prisma.loan.findMany({
      where: {
        status: "PENDING"
      },
      orderBy: {
        createdAt: "asc"
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return res.status(200).json({ loans });
  } catch (err) {
    console.error("Fetch Pending Loans Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const approveLoan = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { comment } = req.body;

    if (req.user!.role !== "HR") {
      return res.status(403).json({ error: "Forbidden: Only HR administrators can approve loans." });
    }

    const loan = await prisma.loan.findUnique({
      where: { id }
    });

    if (!loan) {
      return res.status(404).json({ error: "Loan application not found." });
    }

    if (loan.status !== "PENDING") {
      return res.status(400).json({ error: "Loan application has already been reviewed." });
    }

    const updated = await prisma.loan.update({
      where: { id },
      data: {
        status: "ACTIVE", // Active repayment status
        comment: comment ? comment.trim() : null
      }
    });

    // Notify employee
    await createNotification(
      loan.userId,
      "Loan Application Approved",
      `Your company loan request of $${loan.amount.toFixed(2)} (${loan.installments} months) has been approved by HR.`,
      "LOAN",
      "/dashboard/loans"
    );

    return res.status(200).json({ message: "Loan application approved.", loan: updated });
  } catch (err) {
    console.error("Approve Loan Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const rejectLoan = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { comment } = req.body;

    if (req.user!.role !== "HR") {
      return res.status(403).json({ error: "Forbidden: Only HR administrators can reject loans." });
    }

    const loan = await prisma.loan.findUnique({
      where: { id }
    });

    if (!loan) {
      return res.status(404).json({ error: "Loan application not found." });
    }

    if (loan.status !== "PENDING") {
      return res.status(400).json({ error: "Loan application has already been reviewed." });
    }

    const updated = await prisma.loan.update({
      where: { id },
      data: {
        status: "REJECTED",
        comment: comment ? comment.trim() : null
      }
    });

    // Notify employee
    await createNotification(
      loan.userId,
      "Loan Application Rejected",
      `Your company loan request of $${loan.amount.toFixed(2)} was rejected by HR.${comment ? ' Feedback: "' + comment + '"' : ""}`,
      "LOAN",
      "/dashboard/loans"
    );

    return res.status(200).json({ message: "Loan application rejected.", loan: updated });
  } catch (err) {
    console.error("Reject Loan Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const getAllLoans = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role !== "HR") {
      return res.status(403).json({ error: "Forbidden: Only HR administrators can view all company loans." });
    }

    const loans = await prisma.loan.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return res.status(200).json({ loans });
  } catch (err) {
    console.error("Fetch All Loans Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};
