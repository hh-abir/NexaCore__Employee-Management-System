import { Response } from "express";
import { prisma } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/roleGuard";
import { createNotification } from "../utils/notificationService";

export const createEvaluation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, rating, feedback } = req.body;

    if (req.user!.role !== "HR" && req.user!.role !== "PROJECT_MANAGER") {
      return res.status(403).json({ error: "Forbidden: Only HR and Project Managers can create performance evaluations." });
    }

    if (!userId || rating === undefined || !feedback || !feedback.trim()) {
      return res.status(400).json({ error: "Employee ID, rating (1-5), and feedback are required." });
    }

    const ratingVal = parseInt(rating);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ error: "Rating must be an integer between 1 and 5." });
    }

    const employee = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found." });
    }

    const evaluation = await prisma.evaluation.create({
      data: {
        userId,
        rating: ratingVal,
        feedback: feedback.trim(),
        pmId: req.user!.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        pm: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Notify evaluated employee
    await createNotification(
      userId,
      "Performance Review Logged",
      `You received a ${ratingVal}-star performance assessment from ${req.user!.name || "Manager"}.`,
      "EVALUATION",
      "/dashboard/evaluations"
    );

    return res.status(201).json({ message: "Performance evaluation submitted successfully.", evaluation });
  } catch (err) {
    console.error("Create Evaluation Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const getMyEvaluations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const evaluations = await prisma.evaluation.findMany({
      where: {
        userId: req.user!.id
      },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        pm: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return res.status(200).json({ evaluations });
  } catch (err) {
    console.error("Fetch My Evaluations Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const getEmployeeEvaluations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.params.userId as string;

    if (req.user!.role !== "HR" && req.user!.role !== "PROJECT_MANAGER") {
      return res.status(403).json({ error: "Forbidden: Only HR and Project Managers can view employee evaluations." });
    }

    const evaluations = await prisma.evaluation.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        pm: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return res.status(200).json({ evaluations });
  } catch (err) {
    console.error("Fetch Employee Evaluations Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};
