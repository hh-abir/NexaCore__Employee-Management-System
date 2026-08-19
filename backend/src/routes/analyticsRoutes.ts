import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import { getAnalyticsOverview } from "../controllers/analyticsController";

const router = Router();

router.get("/overview", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getAnalyticsOverview);

export default router;
