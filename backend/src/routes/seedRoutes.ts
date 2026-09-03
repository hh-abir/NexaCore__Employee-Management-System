import { Router } from "express";
import { resetAndSeedDatabase } from "../controllers/seedController";

const router = Router();

router.post("/reset-and-seed", resetAndSeedDatabase);

export default router;
