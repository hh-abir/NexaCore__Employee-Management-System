import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import {
  requestLeave,
  getMyRequests,
  getPendingRequests,
  getAllLeaveRequests,
  approveRequest,
  rejectRequest,
  deleteRequest
} from "../controllers/leaveController";

const router = Router();

router.post("/request", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), requestLeave);
router.get("/my-requests", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getMyRequests);
router.get("/pending", roleGuard(["HR", "PROJECT_MANAGER"]), getPendingRequests);
router.get("/all", roleGuard(["HR", "PROJECT_MANAGER"]), getAllLeaveRequests);
router.patch("/:id/approve", roleGuard(["HR", "PROJECT_MANAGER"]), approveRequest);
router.patch("/:id/reject", roleGuard(["HR", "PROJECT_MANAGER"]), rejectRequest);
router.delete("/:id", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), deleteRequest);

export default router;
