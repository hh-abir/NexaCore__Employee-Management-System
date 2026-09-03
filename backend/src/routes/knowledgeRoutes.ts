import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import {
  getKnowledgeDocuments,
  createKnowledgeDocument,
  deleteKnowledgeDocument
} from "../controllers/knowledgeController";

const router = Router();

router.get("/", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getKnowledgeDocuments);
router.post("/", roleGuard(["HR"]), createKnowledgeDocument);
router.delete("/:id", roleGuard(["HR"]), deleteKnowledgeDocument);

export default router;
