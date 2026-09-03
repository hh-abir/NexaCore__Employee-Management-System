import { Request, Response } from "express";
import { runDatabaseSeed } from "../services/seedService";

export const resetAndSeedDatabase = async (req: Request, res: Response) => {
  try {
    const result = await runDatabaseSeed();
    return res.status(200).json({
      message: "Database purged and populated with rich Bangladeshi demo data successfully!",
      result
    });
  } catch (error: any) {
    console.error("[Seed Controller Error]:", error);
    return res.status(500).json({
      error: "Failed to reset and seed database.",
      details: error?.message || "Internal server error."
    });
  }
};
