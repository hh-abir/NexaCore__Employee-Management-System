import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import {
  submitGrievance,
  getMyGrievances,
  getAllGrievances,
  updateGrievanceStatus
} from "../controllers/grievanceController";

const router = Router();

router.post("/submit", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), submitGrievance);
router.get("/my-grievances", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getMyGrievances);
router.get("/all", roleGuard(["HR"]), getAllGrievances);
router.patch("/:id/status", roleGuard(["HR"]), updateGrievanceStatus);

export default router;
