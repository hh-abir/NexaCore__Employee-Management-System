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






router.post("/", roleGuard(["HR"]), createProject);


router.get("/managers", roleGuard(["HR"]), getManagers);


router.patch("/:projectId/approve", roleGuard(["PROJECT_MANAGER"]), approveProject);


router.get("/free-employees", roleGuard(["HR", "PROJECT_MANAGER"]), getFreeEmployees);


router.get("/my-projects", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getMyProjects);






router.get("/:projectId/tasks", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getProjectTasks);


router.post("/:projectId/tasks", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), createTask);


router.patch("/tasks/:taskId", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), updateTask);


router.delete("/tasks/:taskId", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), deleteTask);






router.get("/:projectId/channels", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getProjectChannels);


router.get("/channels/:channelId/messages", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getChannelMessages);


router.post("/channels/:channelId/messages", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), postChannelMessage);

export default router;
