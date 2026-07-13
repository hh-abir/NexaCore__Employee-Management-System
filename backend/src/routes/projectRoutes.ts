import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import {
  createProject,
  getFreeEmployees,
  getMyProjects,
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  getProjectChannels,
  getChannelMessages,
  postChannelMessage,
  getManagers,
  approveProject
} from "../controllers/projectController";

const router = Router();

// ==========================================
// 1. Projects Management Routes
// ==========================================

// Create a new project (restricted to HR only)
router.post("/", roleGuard(["HR"]), createProject);

// Retrieve all project managers (restricted to HR)
router.get("/managers", roleGuard(["HR"]), getManagers);

// Approve a project (restricted to PROJECT_MANAGER)
router.patch("/:projectId/approve", roleGuard(["PROJECT_MANAGER"]), approveProject);

// Retrieve all employees who are "free" (assigned to less than 2 active projects)
router.get("/free-employees", roleGuard(["HR", "PROJECT_MANAGER"]), getFreeEmployees);

// Load all active projects relating to the logged-in session account
router.get("/my-projects", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getMyProjects);

// ==========================================
// 2. Kanban Tasks Board Routes
// ==========================================

// Get all tasks inside a project
router.get("/:projectId/tasks", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getProjectTasks);

// Create a task inside a project
router.post("/:projectId/tasks", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), createTask);

// Update task metadata or Kanban column coordinates
router.patch("/tasks/:taskId", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), updateTask);

// Delete a task
router.delete("/tasks/:taskId", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), deleteTask);

// ==========================================
// 3. Project Channels Chat Routes
// ==========================================

// Get list of chat channels in a project
router.get("/:projectId/channels", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getProjectChannels);

// Get message history of a specific channel
router.get("/channels/:channelId/messages", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getChannelMessages);

// Send a new chat message into a channel
router.post("/channels/:channelId/messages", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), postChannelMessage);

export default router;
