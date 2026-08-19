import { Response } from "express";
import { prisma } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/roleGuard";
import { createRoleNotification } from "../utils/notificationService";
import { CalendarEventType } from "@prisma/client";

export const getCalendarEvents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // 1. Fetch Global Holidays, Company Events & Personal Scheduled Events
    const customEvents = await prisma.calendarEvent.findMany({
      where: {
        OR: [
          { isGlobal: true },
          { userId }
        ]
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { startDate: "asc" }
    });

    // 2. Fetch Project Deadlines & Milestones
    let projectsQuery: any = {};
    if (userRole === "EMPLOYEE") {
      projectsQuery = { employeeIds: { has: userId } };
    } else if (userRole === "PROJECT_MANAGER") {
      projectsQuery = {
        OR: [
          { managerId: userId },
          { employeeIds: { has: userId } }
        ]
      };
    }

    const projects = await prisma.project.findMany({
      where: projectsQuery,
      include: {
        manager: { select: { id: true, name: true } },
        employees: { select: { id: true, name: true } }
      }
    });

    const projectEvents: any[] = [];
    projects.forEach(p => {
      if (p.endDate) {
        projectEvents.push({
          id: `proj-end-${p.id}`,
          title: `Deadline: ${p.name}`,
          description: p.description || `Target completion for ${p.name} (Budget: $${p.budget?.toLocaleString()})`,
          type: "PROJECT_DEADLINE",
          startDate: p.endDate.toISOString(),
          endDate: p.endDate.toISOString(),
          isGlobal: false,
          meta: {
            projectId: p.id,
            client: p.client,
            priority: p.priority,
            category: p.category,
            status: p.status
          }
        });
      }
      if (p.startDate) {
        projectEvents.push({
          id: `proj-start-${p.id}`,
          title: `Kickoff: ${p.name}`,
          description: `Kickoff milestone for project ${p.name}`,
          type: "PROJECT_DEADLINE",
          startDate: p.startDate.toISOString(),
          endDate: p.startDate.toISOString(),
          isGlobal: false,
          meta: {
            projectId: p.id,
            status: p.status
          }
        });
      }
    });

    // 3. Fetch Kanban Task Due Dates
    let tasksQuery: any = {
      dueDate: { not: null }
    };

    if (userRole === "EMPLOYEE") {
      tasksQuery.assigneeId = userId;
    } else if (userRole === "PROJECT_MANAGER") {
      const pmProjectIds = projects.map(p => p.id);
      tasksQuery.OR = [
        { assigneeId: userId },
        { projectId: { in: pmProjectIds } }
      ];
    }

    const tasks = await prisma.task.findMany({
      where: tasksQuery,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } }
      }
    });

    const taskEvents = tasks.map(t => ({
      id: `task-${t.id}`,
      title: `Task Due: ${t.title}`,
      description: t.description || `Kanban task assigned to ${t.assignee?.name || "Team member"} in ${t.project?.name}`,
      type: "TASK_DUE",
      startDate: t.dueDate!.toISOString(),
      endDate: t.dueDate!.toISOString(),
      isGlobal: false,
      meta: {
        taskId: t.id,
        column: t.column,
        projectName: t.project?.name,
        assigneeName: t.assignee?.name
      }
    }));

    // 4. Fetch Approved Leaves & Remote WFH Schedules
    let leavesQuery: any = {
      status: "APPROVED"
    };

    if (userRole === "EMPLOYEE") {
      leavesQuery.userId = userId;
    } else if (userRole === "PROJECT_MANAGER") {
      // Team members on PM's projects + PM's own leaves
      const teamMemberIds = Array.from(new Set(projects.flatMap(p => p.employeeIds)));
      teamMemberIds.push(userId);
      leavesQuery.userId = { in: teamMemberIds };
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: leavesQuery,
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    const leaveEvents = leaves.map(l => ({
      id: `leave-${l.id}`,
      title: `${l.user.name} (${l.type})`,
      description: `Approved ${l.type === "WFH" ? "Remote Work" : "Time Off"}: ${l.reason}`,
      type: l.type === "WFH" ? "WFH" : "LEAVE",
      startDate: l.startDate.toISOString(),
      endDate: l.endDate.toISOString(),
      isGlobal: false,
      meta: {
        leaveId: l.id,
        employeeName: l.user.name,
        leaveType: l.type
      }
    }));

    // Combine all sources
    const allEvents = [
      ...customEvents.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        type: e.type,
        startDate: e.startDate.toISOString(),
        endDate: e.endDate.toISOString(),
        isGlobal: e.isGlobal,
        meta: {
          authorName: e.user?.name || "System"
        }
      })),
      ...projectEvents,
      ...taskEvents,
      ...leaveEvents
    ];

    return res.status(200).json({ events: allEvents });
  } catch (error) {
    console.error("[getCalendarEvents Error]:", error);
    return res.status(500).json({ error: "Failed to load calendar events." });
  }
};

export const createCalendarEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, type, startDate, endDate, isGlobal } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ error: "Title, start date, and end date are required." });
    }

    if (isGlobal && req.user!.role !== "HR") {
      return res.status(403).json({ error: "Forbidden: Only HR administrators can create company-wide global events and holidays." });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        type: (type as CalendarEventType) || "COMPANY_EVENT",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isGlobal: !!isGlobal,
        userId: req.user!.id
      }
    });

    // If global event or holiday, broadcast notification
    if (event.isGlobal) {
      await createRoleNotification(
        ["HR", "PROJECT_MANAGER", "EMPLOYEE"],
        `Company Calendar Update: ${event.title}`,
        `${req.user!.name} scheduled a company-wide ${event.type.toLowerCase().replace("_", " ")} on ${new Date(event.startDate).toLocaleDateString()}.`,
        "ANNOUNCEMENT",
        "/dashboard/calendar"
      );
    }

    return res.status(201).json({ message: "Calendar event scheduled successfully.", event });
  } catch (error) {
    console.error("[createCalendarEvent Error]:", error);
    return res.status(500).json({ error: "Failed to create calendar event." });
  }
};

export const deleteCalendarEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const event = await prisma.calendarEvent.findUnique({
      where: { id }
    });

    if (!event) {
      return res.status(404).json({ error: "Calendar event not found." });
    }

    if (event.userId !== req.user!.id && req.user!.role !== "HR") {
      return res.status(403).json({ error: "Forbidden: You cannot delete this calendar event." });
    }

    await prisma.calendarEvent.delete({
      where: { id }
    });

    return res.status(200).json({ message: "Event removed from calendar." });
  } catch (error) {
    console.error("[deleteCalendarEvent Error]:", error);
    return res.status(500).json({ error: "Failed to delete calendar event." });
  }
};
