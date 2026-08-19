import { Response } from "express";
import { prisma } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/roleGuard";
import { createNotification, createRoleNotification } from "../utils/notificationService";

export const requestLeave = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, startDate, endDate, reason } = req.body;

    if (!type || !startDate || !endDate || !reason || !reason.trim()) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (type !== "LEAVE" && type !== "WFH") {
      return res.status(400).json({ error: "Invalid leave type. Must be LEAVE or WFH." });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid date format." });
    }

    if (start > end) {
      return res.status(400).json({ error: "Start date cannot be after end date." });
    }

    const request = await prisma.leaveRequest.create({
      data: {
        type,
        startDate: start,
        endDate: end,
        reason: reason.trim(),
        userId: req.user!.id
      }
    });

    // Notify HR and Project Managers of new pending leave application
    await createRoleNotification(
      ["HR", "PROJECT_MANAGER"],
      `New ${type} Application`,
      `${req.user!.name || "An employee"} submitted a new ${type} request for review.`,
      "LEAVE",
      "/dashboard/leaves"
    );

    return res.status(201).json({ message: "Request submitted successfully.", request });
  } catch (err) {
    console.error("Submit Request Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const getMyRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requests = await prisma.leaveRequest.findMany({
      where: {
        userId: req.user!.id
      },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return res.status(200).json({ requests });
  } catch (err) {
    console.error("Fetch My Requests Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const getPendingRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    let requests = [];

    if (req.user!.role === "HR") {
      // HR can view all pending requests
      requests = await prisma.leaveRequest.findMany({
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
              email: true,
              role: true
            }
          }
        }
      });
    } else if (req.user!.role === "PROJECT_MANAGER") {
      // PMs can view pending requests for employees assigned to their projects
      const managedProjects = await prisma.project.findMany({
        where: {
          managerId: req.user!.id
        },
        select: {
          employeeIds: true
        }
      });

      // Flatten and extract unique employee IDs
      const employeeIds = Array.from(
        new Set(managedProjects.flatMap(p => p.employeeIds))
      );

      requests = await prisma.leaveRequest.findMany({
        where: {
          status: "PENDING",
          userId: { in: employeeIds }
        },
        orderBy: {
          createdAt: "asc"
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
    } else {
      return res.status(403).json({ error: "Forbidden: Only HR and Project Managers can access the pending requests queue." });
    }

    return res.status(200).json({ requests });
  } catch (err) {
    console.error("Fetch Pending Requests Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const approveRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { comment } = req.body;

    const request = await prisma.leaveRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return res.status(404).json({ error: "Request not found." });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({ error: "Request has already been reviewed." });
    }

    // Role check
    if (req.user!.role !== "HR" && req.user!.role !== "PROJECT_MANAGER") {
      return res.status(403).json({ error: "Forbidden." });
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        comment: comment ? comment.trim() : null,
        approverId: req.user!.id
      }
    });

    // Notify employee of approval
    await createNotification(
      request.userId,
      `${request.type} Request Approved`,
      `Your ${request.type} application (${new Date(request.startDate).toLocaleDateString()} - ${new Date(request.endDate).toLocaleDateString()}) has been approved by ${req.user!.name || "Manager"}.`,
      "LEAVE",
      "/dashboard/leaves"
    );

    return res.status(200).json({ message: "Request approved.", request: updated });
  } catch (err) {
    console.error("Approve Request Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const rejectRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { comment } = req.body;

    const request = await prisma.leaveRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return res.status(404).json({ error: "Request not found." });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({ error: "Request has already been reviewed." });
    }

    if (req.user!.role !== "HR" && req.user!.role !== "PROJECT_MANAGER") {
      return res.status(403).json({ error: "Forbidden." });
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        comment: comment ? comment.trim() : null,
        approverId: req.user!.id
      }
    });

    // Notify employee of rejection
    await createNotification(
      request.userId,
      `${request.type} Request Rejected`,
      `Your ${request.type} application was not approved by ${req.user!.name || "Manager"}.${comment ? ' Comment: "' + comment + '"' : ""}`,
      "LEAVE",
      "/dashboard/leaves"
    );

    return res.status(200).json({ message: "Request rejected.", request: updated });
  } catch (err) {
    console.error("Reject Request Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const deleteRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const request = await prisma.leaveRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return res.status(404).json({ error: "Request not found." });
    }

    if (request.userId !== req.user!.id) {
      return res.status(403).json({ error: "Forbidden: You can only delete your own requests." });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({ error: "Only pending requests can be deleted." });
    }

    await prisma.leaveRequest.delete({
      where: { id }
    });

    return res.status(200).json({ message: "Request cancelled and deleted successfully." });
  } catch (err) {
    console.error("Delete Request Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const getAllLeaveRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    let requests = [];

    if (req.user!.role === "HR") {
      // HR can view all leave requests (Pending, Approved, Rejected) across the entire company
      requests = await prisma.leaveRequest.findMany({
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
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });
    } else if (req.user!.role === "PROJECT_MANAGER") {
      // PMs can view leave requests of their project team members + their own
      const managedProjects = await prisma.project.findMany({
        where: {
          managerId: req.user!.id
        },
        select: {
          employeeIds: true
        }
      });

      const employeeIds = Array.from(
        new Set([...managedProjects.flatMap(p => p.employeeIds), req.user!.id])
      );

      requests = await prisma.leaveRequest.findMany({
        where: {
          userId: { in: employeeIds }
        },
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
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });
    } else {
      return res.status(403).json({ error: "Forbidden: Access restricted to HR and Project Managers." });
    }

    return res.status(200).json({ requests });
  } catch (err) {
    console.error("Fetch All Leave Requests Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};
