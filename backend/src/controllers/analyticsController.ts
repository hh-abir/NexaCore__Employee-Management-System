import { Response } from "express";
import { prisma } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/roleGuard";

export const getAnalyticsOverview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. Workforce & Headcount Metrics
    const totalUsers = await prisma.user.findMany({
      select: { id: true, name: true, role: true, department: true, designation: true, createdAt: true }
    });

    const activeEmployeesCount = totalUsers.filter(u => u.role === "EMPLOYEE").length;
    const projectManagersCount = totalUsers.filter(u => u.role === "PROJECT_MANAGER").length;
    const hrCount = totalUsers.filter(u => u.role === "HR").length;

    // Fetch payroll records for salary distribution
    const payrollRecords = await prisma.payroll.findMany({
      select: { userId: true, month: true, baseSalary: true, bonus: true, netSalary: true }
    });

    const userSalaryMap: Record<string, number> = {};
    payrollRecords.forEach(p => {
      userSalaryMap[p.userId] = p.baseSalary + (p.bonus || 0);
    });

    // Department breakdown computed directly from user database records
    const departmentCounts: Record<string, number> = {};
    const departmentPayroll: Record<string, number> = {};
    totalUsers.forEach(u => {
      const dept = u.department || "Engineering";
      const userSalary = userSalaryMap[u.id] || 0;
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
      departmentPayroll[dept] = (departmentPayroll[dept] || 0) + userSalary;
    });

    const departmentStats = Object.keys(departmentCounts).map(dept => ({
      department: dept,
      headcount: departmentCounts[dept],
      totalSalary: departmentPayroll[dept],
      percentage: totalUsers.length > 0 ? Math.round((departmentCounts[dept] / totalUsers.length) * 100) : 0
    }));

    // 2. Attendance & Punctuality Analytics (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysStr = thirtyDaysAgo.toISOString().slice(0, 10);

    const attendances = await prisma.attendance.findMany({
      where: { date: { gte: thirtyDaysStr } }
    });

    const totalAttendanceLogs = attendances.length;
    const lateLogs = attendances.filter(a => a.isLate).length;
    const onTimeLogs = totalAttendanceLogs - lateLogs;

    // Fetch approved WFH requests in the past 30 days
    const wfhRequests = await prisma.leaveRequest.findMany({
      where: {
        type: "WFH",
        status: "APPROVED",
        startDate: { gte: thirtyDaysAgo }
      }
    });

    const punctualityRate = totalAttendanceLogs > 0 ? Math.round((onTimeLogs / totalAttendanceLogs) * 100) : 100;
    const remoteRatio = totalAttendanceLogs > 0 ? Math.round((wfhRequests.length / totalAttendanceLogs) * 100) : 0;

    // Dynamically compute the last 7 calendar days attendance
    const weeklyAttendanceTrend = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = dayNames[d.getDay()];

      const dayLogs = attendances.filter(a => a.date === dateStr);
      const dayLate = dayLogs.filter(a => a.isLate).length;
      const dayPresent = dayLogs.length - dayLate;

      // Check WFH requests covering this date
      const dayRemote = wfhRequests.filter(w => {
        const start = new Date(w.startDate).toISOString().slice(0, 10);
        const end = new Date(w.endDate).toISOString().slice(0, 10);
        return dateStr >= start && dateStr <= end;
      }).length;

      weeklyAttendanceTrend.push({
        day: dayName,
        date: dateStr,
        present: dayPresent,
        late: dayLate,
        remote: dayRemote
      });
    }

    // 3. Payroll & Compensation Analytics
    const monthlyTotalPayroll = Object.values(departmentPayroll).reduce((sum, val) => sum + val, 0);

    // Compute live 6-month payroll history from payroll collection
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const payrollHistory = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const monthNum = String(targetDate.getMonth() + 1).padStart(2, "0");
      const monthKey = `${year}-${monthNum}`;
      const monthLabel = monthNames[targetDate.getMonth()];

      const monthRecords = payrollRecords.filter(p => p.month === monthKey);
      const grossSalary = monthRecords.reduce((sum, p) => sum + p.baseSalary, 0);
      const bonuses = monthRecords.reduce((sum, p) => sum + (p.bonus || 0), 0);

      payrollHistory.push({
        month: monthLabel,
        monthKey,
        grossSalary,
        bonuses,
        loans: 0
      });
    }

    // Loans metrics
    const loans = await prisma.loan.findMany();
    const totalDisbursedLoans = loans
      .filter(l => l.status === "APPROVED" || l.status === "COMPLETED")
      .reduce((sum, l) => sum + l.amount, 0);

    // 4. Project Sprints & Task Velocity Analytics
    const projects = await prisma.project.findMany({
      include: {
        tasks: true,
        manager: { select: { name: true } },
        employees: { select: { id: true } }
      }
    });

    const activeProjects = projects.filter(p => p.status === "ACTIVE").length;
    const completedProjects = projects.filter(p => p.status === "COMPLETED" || p.status === "PENDING_SETTLEMENT").length;
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

    const allTasks = projects.flatMap(p => p.tasks);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.column === "COMPLETED").length;
    const inProgressTasks = allTasks.filter(t => t.column === "IN_PROGRESS").length;
    const testingTasks = allTasks.filter(t => t.column === "TESTING").length;
    const todoTasks = allTasks.filter(t => t.column === "TODO").length;

    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const taskDistribution = [
      { column: "To Do", count: todoTasks, percentage: totalTasks > 0 ? Math.round((todoTasks / totalTasks) * 100) : 0 },
      { column: "In Progress", count: inProgressTasks, percentage: totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0 },
      { column: "Testing / QA", count: testingTasks, percentage: totalTasks > 0 ? Math.round((testingTasks / totalTasks) * 100) : 0 },
      { column: "Completed", count: completedTasks, percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0 }
    ];

    // Project progress breakdown
    const projectVelocities = projects.map(p => {
      const pTotal = p.tasks.length;
      const pDone = p.tasks.filter(t => t.column === "COMPLETED").length;
      const progress = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : (p.status === "COMPLETED" ? 100 : 0);
      return {
        id: p.id,
        name: p.name,
        category: p.category || "Engineering",
        status: p.status,
        budget: p.budget,
        totalTasks: pTotal,
        completedTasks: pDone,
        progress,
        managerName: p.manager?.name || "Unassigned"
      };
    });

    // 5. Performance Evaluations & Grievance Health
    const evaluations = await prisma.evaluation.findMany();
    const avgReviewScore = evaluations.length > 0
      ? (evaluations.reduce((sum: number, e: { rating: number }) => sum + e.rating, 0) / evaluations.length).toFixed(1)
      : "0.0";

    const grievances = await prisma.grievance.findMany();
    const totalGrievances = grievances.length;
    const resolvedGrievances = grievances.filter(g => g.status === "RESOLVED").length;
    const grievanceResolutionRate = totalGrievances > 0 ? Math.round((resolvedGrievances / totalGrievances) * 100) : 100;

    // 6. Polls & Meeting Rooms usage
    const totalPolls = await prisma.poll.count();
    const totalRoomBookings = await prisma.roomBooking.count();

    return res.status(200).json({
      summary: {
        totalHeadcount: totalUsers.length,
        activeEmployees: activeEmployeesCount,
        projectManagers: projectManagersCount,
        hrAdministrators: hrCount,
        monthlyPayroll: monthlyTotalPayroll,
        activeSprints: activeProjects,
        completedProjects,
        totalProjectBudget: totalBudget,
        taskCompletionRate,
        punctualityRate,
        remoteRatio,
        avgReviewScore: Number(avgReviewScore),
        grievanceResolutionRate,
        totalDisbursedLoans,
        totalPolls,
        totalRoomBookings
      },
      departmentStats,
      weeklyAttendanceTrend,
      payrollHistory,
      taskDistribution,
      projectVelocities
    });
  } catch (error) {
    console.error("[getAnalyticsOverview Error]:", error);
    return res.status(500).json({ error: "Failed to generate analytics report." });
  }
};
