import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import {
  clockIn,
  clockOut,
  getAttendanceStatus,
  getAttendanceHistory,
  createManualAttendance,
  deleteAttendanceRecord
} from "../controllers/attendanceController";

const router = Router();

router.post("/clock-in", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), clockIn);
router.post("/clock-out", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), clockOut);
router.get("/status", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getAttendanceStatus);
router.get("/history", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getAttendanceHistory);
router.post("/manual-entry", roleGuard(["HR"]), createManualAttendance);
router.delete("/:id", roleGuard(["HR"]), deleteAttendanceRecord);

export default router;
