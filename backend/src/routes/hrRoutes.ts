import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import { validateOnboardEmployee } from "../validators/hrValidators";
import { onboardEmployee } from "../controllers/hrController";

const router = Router();


router.post("/employees", roleGuard(["HR"]), validateOnboardEmployee, onboardEmployee);

export default router;
