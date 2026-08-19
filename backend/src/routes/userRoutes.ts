import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import {
  changePassword,
  getUserProfile,
  updateProfile,
  toggleTwoFactor,
  getActiveSessions
} from "../controllers/userController";

const router = Router();

router.get("/profile", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getUserProfile);
router.patch("/profile", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), updateProfile);
router.patch("/two-factor", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), toggleTwoFactor);
router.get("/sessions", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getActiveSessions);
router.post("/change-password", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), changePassword);

export default router;
