import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import { validateOnboardEmployee } from "../validators/hrValidators";
import { onboardEmployee } from "../controllers/hrController";

const router = Router();

// Provision employee route: restricted to HR, payload validated via Zod schema
router.post("/employees", roleGuard(["HR"]), validateOnboardEmployee, onboardEmployee);

export default router;
