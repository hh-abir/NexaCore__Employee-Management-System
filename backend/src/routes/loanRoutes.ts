import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import {
  applyLoan,
  getMyLoans,
  getPendingLoans,
  getAllLoans,
  approveLoan,
  rejectLoan
} from "../controllers/loanController";

const router = Router();

router.post("/apply", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), applyLoan);
router.get("/my-loans", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getMyLoans);
router.get("/pending", roleGuard(["HR"]), getPendingLoans);
router.get("/all", roleGuard(["HR"]), getAllLoans);
router.patch("/:id/approve", roleGuard(["HR"]), approveLoan);
router.patch("/:id/reject", roleGuard(["HR"]), rejectLoan);

export default router;
