import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import {
  createEvaluation,
  getMyEvaluations,
  getEmployeeEvaluations
} from "../controllers/evaluationController";

const router = Router();

router.post("/", roleGuard(["HR", "PROJECT_MANAGER"]), createEvaluation);
router.get("/my-evaluations", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getMyEvaluations);
router.get("/employee/:userId", roleGuard(["HR", "PROJECT_MANAGER"]), getEmployeeEvaluations);

export default router;
