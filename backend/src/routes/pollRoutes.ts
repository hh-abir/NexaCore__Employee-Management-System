import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import {
  getPolls,
  createPoll,
  castVote,
  closePoll,
  deletePoll
} from "../controllers/pollController";

const router = Router();

router.get("/", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getPolls);
router.post("/", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), createPoll);
router.post("/:pollId/vote", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), castVote);
router.patch("/:pollId/close", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), closePoll);
router.delete("/:pollId", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), deletePoll);

export default router;
