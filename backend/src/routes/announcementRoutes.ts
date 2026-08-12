import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import {
  createAnnouncement,
  getAnnouncements
} from "../controllers/announcementController";

const router = Router();

router.post("/", roleGuard(["HR"]), createAnnouncement);
router.get("/", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getAnnouncements);

export default router;
