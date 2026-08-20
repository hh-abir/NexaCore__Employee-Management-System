import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import { getAnalyticsOverview } from "../controllers/analyticsController";

const router = Router();

router.get("/overview", roleGuard(["HR"]), getAnalyticsOverview);

export default router;
