import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export const onboardEmployeeSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long." }),
  email: z.string().email({ message: "Please provide a valid corporate email address." }),
  role: z.string().refine(val => ["HR", "PROJECT_MANAGER", "EMPLOYEE"].includes(val), {
    message: "Role must be one of: HR, PROJECT_MANAGER, or EMPLOYEE."
  }),
  password: z.string().min(6, { message: "Default password must be at least 6 characters long." }),
  department: z.string().optional(),
  designation: z.string().optional(),
  phone: z.string().optional(),
  salary: z.union([z.number(), z.string()]).optional(),
});

export const validateOnboardEmployee = (req: Request, res: Response, next: NextFunction) => {
  const result = onboardEmployeeSchema.safeParse(req.body);
  if (!result.success) {
    const errorMessages = result.error.issues.map((err) => err.message);
    return res.status(400).json({ error: errorMessages.join(" ") });
  }
  next();
};
