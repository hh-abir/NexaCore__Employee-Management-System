import { Response } from "express";
import { prisma } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/roleGuard";
import { createNotification, createRoleNotification } from "../utils/notificationService";






export const createProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      name, 
      description, 
      managerId,
      employeeIds, 
      budget, 
      client, 
      startDate, 
      endDate, 
      priority, 
      category 
    } = req.body;

    if (req.user!.role !== "HR") {
      return res.status(403).json({ error: "Forbidden: Only HR administrators can create projects." });
    }

    if (!name) {
      return res.status(400).json({ error: "Project name is required." });
    }

    if (!managerId) {
      return res.status(400).json({ error: "Project Manager assignment is required." });
    }

    const assignedIds = Array.isArray(employeeIds) ? employeeIds : [];

    if (assignedIds.length > 5) {
      return res.status(400).json({ error: "A project can have a maximum of 5 employees." });
    }

    
    if (assignedIds.length > 0) {
      const employees = await prisma.user.findMany({
        where: { id: { in: assignedIds } },
        include: {
          projects: {
            where: { status: "ACTIVE" }
          }
        }
      });

      for (const employee of employees) {
        if (employee.projects.length >= 2) {
          return res.status(400).json({ 
            error: `Employee "${employee.name}" is already assigned to ${employee.projects.length} active projects (limit is 2).` 
          });
        }
      }
    }

    
    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: "PENDING",
        managerId,
        employeeIds: assignedIds,
        budget: budget ? parseFloat(budget) : 0.0,
        client: client || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        priority: priority || "MEDIUM",
        category: category || null,
        
        employees: {
          connect: assignedIds.map((id: string) => ({ id }))
        },
        channels: {
          create: [
            { name: "general" },
            { name: "announcements" },
            { name: "technical" }
          ]
        }
      },
      include: {
        channels: true,
        employees: { select: { id: true, name: true, email: true } }
      }
    });

    // 1. Notify Assigned Project Manager
    await createNotification(
      managerId,
      "New Project Assigned: Approval Required",
      `HR assigned you as Project Manager for "${project.name}". Please review and approve to activate the workspace.`,
      "PROJECT",
      "/dashboard/active-projects"
    );

    // 2. Notify Assigned Team Members
    for (const empId of assignedIds) {
      await createNotification(
        empId,
        "Allocated to New Project",
        `You have been allocated to the project "${project.name}". It is currently awaiting Project Manager activation.`,
        "PROJECT",
        "/dashboard/active-projects"
      );
    }

    return res.status(201).json({ message: "Project created successfully.", project });
  } catch (error: any) {
    console.error("[createProject Error]:", error);
    return res.status(500).json({ error: "Failed to create project." });
  }
};


export const getFreeEmployees = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employees = await prisma.user.findMany({
      where: { role: "EMPLOYEE" },
      include: {
        projects: {
          where: { status: "ACTIVE" }
        }
      }
    });

    
    const freeEmployees = employees.filter(emp => emp.projects.length < 2);

    return res.status(200).json({ 
      employees: freeEmployees.map(emp => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        activeProjectsCount: emp.projects.length
      }))
    });
  } catch (error: any) {
    console.error("[getFreeEmployees Error]:", error);
    return res.status(500).json({ error: "Failed to query available employees." });
  }
};


export const getMyProjects = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let projects;

    if (userRole === "HR") {
      
      projects = await prisma.project.findMany({
        include: {
          manager: { select: { id: true, name: true, email: true } },
          employees: { select: { id: true, name: true, email: true } },
          channels: true
        }
      });
    } else if (userRole === "EMPLOYEE") {
      
      projects = await prisma.project.findMany({
        where: {
          employeeIds: { has: userId },
          status: "ACTIVE"
        },
        include: {
          manager: { select: { id: true, name: true, email: true } },
          employees: { select: { id: true, name: true, email: true } },
          channels: true
        }
      });
    } else {
      
      projects = await prisma.project.findMany({
        where: {
          OR: [
            { managerId: userId },
            { employeeIds: { has: userId } }
          ]
        },
        include: {
          manager: { select: { id: true, name: true, email: true } },
          employees: { select: { id: true, name: true, email: true } },
          channels: true
        }
      });
    }

    return res.status(200).json({ projects });
  } catch (error: any) {
    console.error("[getMyProjects Error]:", error);
    return res.status(500).json({ error: "Failed to load projects." });
  }
};


export const getManagers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const managers = await prisma.user.findMany({
      where: { role: "PROJECT_MANAGER" },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    return res.status(200).json({ managers });
  } catch (error: any) {
    console.error("[getManagers Error]:", error);
    return res.status(500).json({ error: "Failed to load project managers list." });
  }
};


export const approveProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const pmId = req.user!.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }

    if (project.managerId !== pmId) {
      return res.status(403).json({ error: "Forbidden: Only the assigned Project Manager can approve this project." });
    }

    if (project.status !== "PENDING") {
      return res.status(400).json({ error: `Project is already in status: ${project.status}` });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { status: "ACTIVE" },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        employees: { select: { id: true, name: true, email: true } },
        channels: true
      }
    });

    // Notify HR
    await createRoleNotification(
      ["HR"],
      "Project Workspace Activated",
      `Project Manager ${req.user!.name} approved and activated "${updatedProject.name}".`,
      "PROJECT",
      "/dashboard/active-projects"
    );

    // Notify Team Members
    for (const empId of updatedProject.employeeIds) {
      await createNotification(
        empId,
        "Project Workspace is Now Live",
        `Project "${updatedProject.name}" has been activated. You can now collaborate on tasks and project channels.`,
        "PROJECT",
        "/dashboard/active-projects"
      );
    }

    return res.status(200).json({ message: "Project approved successfully.", project: updatedProject });
  } catch (error: any) {
    console.error("[approveProject Error]:", error);
    return res.status(500).json({ error: "Failed to approve project." });
  }
};

// ==========================================
// 2. Kanban Tasks Board Management
// ==========================================

// Get all tasks for a specific project
export const getProjectTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = req.params.projectId as string;

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.status(200).json({ tasks });
  } catch (error: any) {
    console.error("[getProjectTasks Error]:", error);
    return res.status(500).json({ error: "Failed to retrieve project tasks." });
  }
};

// Create a task inside a project
export const createTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const { title, description, assigneeId, dueDate, column } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Task title is required." });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        column: column || "TODO",
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } }
      }
    });

    return res.status(201).json({ message: "Task created successfully.", task });
  } catch (error: any) {
    console.error("[createTask Error]:", error);
    return res.status(500).json({ error: "Failed to create task." });
  }
};

// Update task metadata or column positioning (Kanban drag-and-drop)
export const updateTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const taskId = req.params.taskId as string;
    const { title, description, column, assigneeId, dueDate } = req.body;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        column: column !== undefined ? column : undefined,
        assigneeId: assigneeId !== undefined ? (assigneeId ? assigneeId : null) : undefined,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } }
      }
    });

    return res.status(200).json({ message: "Task updated successfully.", task: updatedTask });
  } catch (error: any) {
    console.error("[updateTask Error]:", error);
    return res.status(500).json({ error: "Failed to update task." });
  }
};

// Delete a task
export const deleteTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const taskId = req.params.taskId as string;

    await prisma.task.delete({
      where: { id: taskId }
    });

    return res.status(200).json({ message: "Task deleted successfully." });
  } catch (error: any) {
    console.error("[deleteTask Error]:", error);
    return res.status(500).json({ error: "Failed to delete task." });
  }
};

// ==========================================
// 3. Project Live Channels Chat
// ==========================================

// Get list of channels inside a project
export const getProjectChannels = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = req.params.projectId as string;

    const channels = await prisma.channel.findMany({
      where: { projectId },
      orderBy: { name: "asc" }
    });

    return res.status(200).json({ channels });
  } catch (error: any) {
    console.error("[getProjectChannels Error]:", error);
    return res.status(500).json({ error: "Failed to retrieve project channels." });
  }
};

// Get message logs of a specific channel
export const getChannelMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const channelId = req.params.channelId as string;

    const messages = await prisma.message.findMany({
      where: { channelId },
      include: {
        sender: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: "asc" }
    });

    return res.status(200).json({ messages });
  } catch (error: any) {
    console.error("[getChannelMessages Error]:", error);
    return res.status(500).json({ error: "Failed to retrieve messages." });
  }
};

// Post a new text message inside a channel
export const postChannelMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const channelId = req.params.channelId as string;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Message content cannot be empty." });
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId: req.user!.id,
        channelId
      },
      include: {
        sender: { select: { id: true, name: true, email: true } }
      }
    });

    return res.status(201).json({ message });
  } catch (error: any) {
    console.error("[postChannelMessage Error]:", error);
    return res.status(500).json({ error: "Failed to send message." });
  }
};

// PM or HR marks project as completed / requests budget settlement
export const requestProjectCompletion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        employees: { select: { id: true, name: true, email: true } }
      }
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }

    if (userRole !== "HR" && project.managerId !== userId) {
      return res.status(403).json({ error: "Forbidden: Only the assigned Project Manager or HR can request completion." });
    }

    if (project.status === "COMPLETED") {
      return res.status(400).json({ error: "Project is already completed and settled." });
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { status: "PENDING_SETTLEMENT" },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        employees: { select: { id: true, name: true, email: true } }
      }
    });

    // Notify HR of completion & pending settlement
    await createRoleNotification(
      ["HR"],
      "Project Completion & Settlement Requested",
      `Project Manager ${project.manager.name} marked "${project.name}" as completed. Budget of $${project.budget.toLocaleString()} is pending HR review & payout transfer.`,
      "PROJECT",
      "/dashboard"
    );

    return res.status(200).json({ message: "Project completion requested. Awaiting HR settlement.", project: updated });
  } catch (error: any) {
    console.error("[requestProjectCompletion Error]:", error);
    return res.status(500).json({ error: "Failed to request project completion." });
  }
};

// HR approves project completion and transfers/disburses project budget / bonus
export const settleProjectPayout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const { bonusPercentage, bonusAmountPerMember } = req.body;

    if (req.user!.role !== "HR") {
      return res.status(403).json({ error: "Forbidden: Only HR administrators can settle project payouts." });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        employees: { select: { id: true, name: true, email: true } }
      }
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }

    if (project.payoutApproved && project.status === "COMPLETED") {
      return res.status(400).json({ error: "Project budget has already been settled and disbursed." });
    }

    const teamSize = project.employees.length || 1;
    let bonusPerMember = 0;

    if (bonusAmountPerMember !== undefined && !isNaN(parseFloat(bonusAmountPerMember))) {
      bonusPerMember = parseFloat(bonusAmountPerMember);
    } else if (bonusPercentage !== undefined && !isNaN(parseFloat(bonusPercentage))) {
      const totalBonusPool = (project.budget * parseFloat(bonusPercentage)) / 100;
      bonusPerMember = totalBonusPool / teamSize;
    }

    // Update project
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "COMPLETED",
        payoutApproved: true,
        payoutBonus: bonusPerMember
      },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        employees: { select: { id: true, name: true, email: true } }
      }
    });

    // Notify Project Manager
    await createNotification(
      project.managerId,
      "Project Completion & Budget Settled",
      `HR has approved completion and transferred budget for "${project.name}" ($${project.budget.toLocaleString()}).`,
      "PROJECT",
      "/dashboard/active-projects"
    );

    // Auto-generate official digital certificate for PM and all team members
    const allParticipants = [project.manager, ...project.employees].filter(Boolean);
    for (const participant of allParticipants) {
      const timestamp = Date.now().toString(36).toUpperCase();
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      const code = `NEXA-PROJ-${timestamp}-${rand}`;

      await prisma.certificate.create({
        data: {
          certificateCode: code,
          title: `Project Completion: ${project.name}`,
          type: "PROJECT_COMPLETION",
          description: `Awarded for successful engineering milestone delivery and deployment of ${project.name} (${project.category || "Software Development"}).`,
          recipientId: participant.id,
          projectId: project.id,
          issuerId: req.user!.id,
          pmSignature: project.manager?.name || "Project Lead",
          hrSignature: "NexaCore Board of Directors"
        }
      }).catch(err => console.warn("Failed to auto-issue certificate:", err));
    }

    return res.status(200).json({ 
      message: "Project budget payout and completion approved successfully. Digital certificates issued.", 
      project: updated,
      bonusPerMember
    });
  } catch (error: any) {
    console.error("[settleProjectPayout Error]:", error);
    return res.status(500).json({ error: "Failed to settle project payout." });
  }
};

// Project Manager Dashboard Summary API
export const getPMSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pmId = req.user!.id;
    if (req.user!.role !== "PROJECT_MANAGER" && req.user!.role !== "HR") {
      return res.status(403).json({ error: "Forbidden: Only Project Managers or HR can access the PM dashboard." });
    }

    const projects = await prisma.project.findMany({
      where: req.user!.role === "PROJECT_MANAGER" ? { managerId: pmId } : {},
      include: {
        employees: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
        tasks: true,
        channels: true
      },
      orderBy: { createdAt: "desc" }
    });

    const activeProjects = projects.filter(p => p.status === "ACTIVE");
    const pendingProjects = projects.filter(p => p.status === "PENDING");
    const completedProjects = projects.filter(p => p.status === "COMPLETED");

    // All distinct team members
    const teamMemberMap = new Map();
    projects.forEach(p => {
      p.employees?.forEach(e => {
        teamMemberMap.set(e.id, e);
      });
      (p as any).employeeIds?.forEach((id: string) => {
        if (!teamMemberMap.has(id.toString())) {
          teamMemberMap.set(id.toString(), { id: id.toString() });
        }
      });
    });
    const teamMemberIds = Array.from(teamMemberMap.keys());

    // Aggregate tasks
    const allTasks = projects.flatMap(p => p.tasks || []);
    const todoTasks = allTasks.filter(t => t.column === "TODO").length;
    const inProgressTasks = allTasks.filter(t => t.column === "IN_PROGRESS").length;
    const testingTasks = allTasks.filter(t => t.column === "TESTING").length;
    const completedTasks = allTasks.filter(t => t.column === "COMPLETED").length;

    // Team pending leave requests
    const pendingTeamLeaves = await prisma.leaveRequest.findMany({
      where: req.user!.role === "HR" 
        ? { status: "PENDING" } 
        : {
            userId: { in: teamMemberIds },
            status: "PENDING"
          },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.status(200).json({
      metrics: {
        totalProjects: projects.length,
        activeProjectsCount: activeProjects.length,
        pendingProjectsCount: pendingProjects.length,
        completedProjectsCount: completedProjects.length,
        teamMembersCount: teamMemberMap.size,
        totalTasksCount: allTasks.length,
        todoTasks,
        inProgressTasks,
        testingTasks,
        completedTasks,
        pendingTeamLeavesCount: pendingTeamLeaves.length
      },
      projects,
      pendingProjects,
      pendingTeamLeaves
    });
  } catch (error) {
    console.error("[getPMSummary Error]:", error);
    return res.status(500).json({ error: "Failed to load PM dashboard metrics." });
  }
};

