import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import { validateOnboardEmployee } from "../validators/hrValidators";
import { onboardEmployee, getAllEmployees, getHRSummary } from "../controllers/hrController";

const router = Router();

router.post("/employees", roleGuard(["HR"]), validateOnboardEmployee, onboardEmployee);
router.get("/employees", roleGuard(["HR"]), getAllEmployees);
router.get("/summary", roleGuard(["HR"]), getHRSummary);

export default router;
