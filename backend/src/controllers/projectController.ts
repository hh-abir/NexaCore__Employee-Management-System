import { Response } from "express";
import { prisma } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/roleGuard";






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
        title,
        description,
        column,
        assigneeId: assigneeId !== undefined ? assigneeId : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined
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
