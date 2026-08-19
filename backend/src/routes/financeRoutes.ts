import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import {
  getFinanceSummary,
  createExpense,
  deleteExpense,
  updateBudget
} from "../controllers/financeController";

const router = Router();

// Strictly restricted to HR administrators
router.get("/summary", roleGuard(["HR"]), getFinanceSummary);
router.post("/expenses", roleGuard(["HR"]), createExpense);
router.delete("/expenses/:id", roleGuard(["HR"]), deleteExpense);
router.patch("/budget", roleGuard(["HR"]), updateBudget);

export default router;
