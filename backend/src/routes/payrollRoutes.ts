import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import {
  generatePayroll,
  getPayrollLedger,
  payPayroll
} from "../controllers/payrollController";

const router = Router();

router.post("/generate", roleGuard(["HR"]), generatePayroll);
router.get("/ledger", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getPayrollLedger);
router.patch("/:id/pay", roleGuard(["HR"]), payPayroll);

export default router;
