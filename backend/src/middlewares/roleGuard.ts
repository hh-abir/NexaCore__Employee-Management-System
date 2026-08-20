import { Request, Response, NextFunction } from "express";
import { auth } from "../config/auth";
import { fromNodeHeaders } from "better-auth/node";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const roleGuard = (allowedRoles: ("HR" | "PROJECT_MANAGER" | "EMPLOYEE")[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const sessionData = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      if (!sessionData) {
        return res.status(401).json({ error: "Unauthorized: Invalid or missing session." });
      }

      const user = sessionData.user as any;
      const userRole = user.role || "EMPLOYEE";

      if (!allowedRoles.includes(userRole as any)) {
        return res.status(403).json({ 
          error: `Forbidden: This resource is restricted to roles: [${allowedRoles.join(", ")}]. Current role: ${userRole}` 
        });
      }

      // Attach user profile context to Express request
      req.user = {
        id: user.id,
        name: user.name || "",
        email: user.email,
        role: userRole,
      };

      next();
    } catch (error: any) {
      console.error("[roleGuard Error]:", error);
      return res.status(500).json({ error: "Internal server authentication validation error" });
    }
  };
};
