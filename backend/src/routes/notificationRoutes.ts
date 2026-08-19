import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
} from "../controllers/notificationController";

const router = Router();

router.get("/", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getNotifications);
router.patch("/read-all", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), markAllAsRead);
router.patch("/:id/read", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), markAsRead);
router.delete("/clear-all", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), clearAllNotifications);

export default router;
