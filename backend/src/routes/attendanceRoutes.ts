import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import {
  clockIn,
  clockOut,
  getAttendanceStatus,
  getAttendanceHistory
} from "../controllers/attendanceController";

const router = Router();

router.post("/clock-in", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), clockIn);
router.post("/clock-out", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), clockOut);
router.get("/status", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getAttendanceStatus);
router.get("/history", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getAttendanceHistory);

export default router;
