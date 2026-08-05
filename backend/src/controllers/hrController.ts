import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/roleGuard";
import { prisma } from "../config/db";
import bcrypt from "bcryptjs";

export const onboardEmployee = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, role, password } = req.body;

    
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(400).json({ error: "An employee with this email is already registered." });
    }

    
    const hashedPassword = await bcrypt.hash(password, 10);

    
    const newUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name,
          email,
          emailVerified: true,
          role,
        },
      });

      await tx.account.create({
        data: {
          userId: u.id,
          providerId: "credential",
          accountId: email,
          password: hashedPassword,
        },
      });

      return u;
    });

    return res.status(201).json({
      message: "Employee account successfully created.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error("Error onboarding employee [hrController]:", error);
    return res.status(500).json({ error: error?.message || "Internal server error" });
  }
};
export const getHealthCheck = (req: AuthenticatedRequest, res: Response) => {
  res.json({ status: "ok", timestamp: new Date() });
};
