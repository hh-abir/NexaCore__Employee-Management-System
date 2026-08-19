import { Response } from "express";
import { prisma } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/roleGuard";
import { createNotification, createRoleNotification } from "../utils/notificationService";
import { GrievanceCategory, GrievanceStatus, GrievanceUrgency } from "@prisma/client";

export const submitGrievance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, category, urgency, isAnonymous } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required." });
    }

    const grievance = await prisma.grievance.create({
      data: {
        userId: req.user!.id,
        title: title.trim(),
        description: description.trim(),
        category: (category as GrievanceCategory) || "OTHER",
        urgency: (urgency as GrievanceUrgency) || "MEDIUM",
        isAnonymous: !!isAnonymous,
        status: "OPEN"
      }
    });

    // Notify HR Administrators
    const senderName = isAnonymous ? "An anonymous employee" : (req.user!.name || "An employee");
    await createRoleNotification(
      ["HR"],
      `New Grievance Incident Reported [${grievance.urgency}]`,
      `${senderName} filed a complaint: "${grievance.title}" under ${grievance.category}.`,
      "GENERAL",
      "/dashboard/grievances"
    );

    return res.status(201).json({
      message: "Grievance submitted successfully. HR has been notified.",
      grievance
    });
  } catch (err) {
    console.error("Submit Grievance Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const getMyGrievances = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const grievances = await prisma.grievance.findMany({
      where: {
        userId: req.user!.id
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.status(200).json({ grievances });
  } catch (err) {
    console.error("Fetch My Grievances Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const getAllGrievances = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role !== "HR") {
      return res.status(403).json({ error: "Forbidden: Only HR administrators can access the confidential grievance ledger." });
    }

    const grievances = await prisma.grievance.findMany({
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

    return res.status(200).json({ grievances });
  } catch (err) {
    console.error("Fetch All Grievances Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const updateGrievanceStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, resolutionNote } = req.body;

    if (req.user!.role !== "HR") {
      return res.status(403).json({ error: "Forbidden: Only HR administrators can update grievance statuses." });
    }

    const grievance = await prisma.grievance.findUnique({
      where: { id }
    });

    if (!grievance) {
      return res.status(404).json({ error: "Grievance ticket not found." });
    }

    const isFinished = status === "RESOLVED" || status === "DISMISSED";

    const updated = await prisma.grievance.update({
      where: { id },
      data: {
        status: (status as GrievanceStatus) || grievance.status,
        resolutionNote: resolutionNote !== undefined ? resolutionNote.trim() : grievance.resolutionNote,
        resolvedAt: isFinished ? new Date() : (status === "OPEN" || status === "UNDER_INVESTIGATION" ? null : grievance.resolvedAt)
      }
    });

    // Notify complainant if non-anonymous
    if (!updated.isAnonymous) {
      await createNotification(
        updated.userId,
        `Grievance Ticket Updated: ${updated.status}`,
        `Your grievance "${updated.title}" has been updated to ${updated.status}.${resolutionNote ? ' Resolution Note: "' + resolutionNote + '"' : ""}`,
        "GENERAL",
        "/dashboard/grievances"
      );
    }

    return res.status(200).json({
      message: `Grievance status successfully updated to ${updated.status}.`,
      grievance: updated
    });
  } catch (err) {
    console.error("Update Grievance Status Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};
