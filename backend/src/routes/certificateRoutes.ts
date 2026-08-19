import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import {
  getCertificates,
  verifyCertificate,
  issueCertificate,
  deleteCertificate
} from "../controllers/certificateController";

const router = Router();

// Public / Authenticated Verification endpoint
router.get("/verify/:code", verifyCertificate);

// Protected Certificate Management
router.get("/", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getCertificates);
router.post("/issue", roleGuard(["HR", "PROJECT_MANAGER"]), issueCertificate);
router.delete("/:id", roleGuard(["HR", "PROJECT_MANAGER"]), deleteCertificate);

export default router;
