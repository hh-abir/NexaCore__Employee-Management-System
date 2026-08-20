import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/roleGuard";
import { prisma } from "../config/db";
import bcrypt from "bcryptjs";

export const onboardEmployee = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, role, password, department, designation, phone, salary } = req.body;

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
          name: name.trim(),
          email: email.trim().toLowerCase(),
          emailVerified: true,
          role,
          department: department ? department.trim() : "Engineering",
          designation: designation ? designation.trim() : "Software Engineer",
          phone: phone ? phone.trim() : null,
        },
      });

      await tx.account.create({
        data: {
          userId: u.id,
          providerId: "credential",
          accountId: email.trim().toLowerCase(),
          password: hashedPassword,
        },
      });

      // Create initial salary record if provided
      if (salary && parseFloat(salary) > 0) {
        const numSalary = parseFloat(salary);
        const currentMonth = new Date().toISOString().slice(0, 7);
        await tx.payroll.create({
          data: {
            userId: u.id,
            month: currentMonth,
            baseSalary: numSalary,
            bonus: 0.0,
            deductions: 0.0,
            netSalary: numSalary,
            status: "PENDING",
          }
        });
      }

      return u;
    });

    return res.status(201).json({
      message: "Employee account successfully provisioned.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        designation: newUser.designation,
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

export const getAllEmployees = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        designation: true,
        phone: true,
        createdAt: true,
      }
    });
    return res.status(200).json({ employees: users });
  } catch (err) {
    console.error("Fetch employees error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const getHRSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [
      totalEmployees,
      totalProjects,
      activeProjectsCount,
      pendingLeavesCount,
      pendingLoansCount,
      payrollRecords,
      pendingSettlements,
      pendingLeaves,
      pendingLoans
    ] = await Promise.all([
      prisma.user.count({ where: { role: "EMPLOYEE" } }),
      prisma.project.count(),
      prisma.project.count({ where: { status: "ACTIVE" } }),
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
      prisma.loan.count({ where: { status: "PENDING" } }),
      prisma.payroll.findMany({ select: { netSalary: true, status: true } }),
      prisma.project.findMany({
        where: {
          OR: [
            { status: "PENDING_SETTLEMENT" },
            { status: "ACTIVE" }
          ]
        },
        include: {
          manager: { select: { id: true, name: true, email: true } },
          employees: { select: { id: true, name: true, email: true } }
        },
        orderBy: { updatedAt: "desc" }
      }),
      prisma.leaveRequest.findMany({
        where: { status: "PENDING" },
        include: {
          user: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 5
      }),
      prisma.loan.findMany({
        where: { status: "PENDING" },
        include: {
          user: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 5
      })
    ]);

    const totalDisbursed = payrollRecords
      .filter(p => p.status === "PAID")
      .reduce((sum, p) => sum + p.netSalary, 0);

    const totalPendingPayroll = payrollRecords
      .filter(p => p.status === "PENDING")
      .reduce((sum, p) => sum + p.netSalary, 0);

    return res.status(200).json({
      metrics: {
        totalEmployees,
        totalProjects,
        activeProjectsCount,
        pendingLeavesCount,
        pendingLoansCount,
        totalDisbursed,
        totalPendingPayroll
      },
      pendingSettlements,
      pendingLeaves,
      pendingLoans
    });
  } catch (err) {
    console.error("Get HR Summary Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};
