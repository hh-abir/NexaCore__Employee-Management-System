import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import {
  getCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent
} from "../controllers/calendarController";

const router = Router();

router.get("/events", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getCalendarEvents);
router.post("/events", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), createCalendarEvent);
router.delete("/events/:id", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), deleteCalendarEvent);

export default router;
