import { Response } from "express";
import { prisma } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/roleGuard";
import { createNotification } from "../utils/notificationService";

// Coordinates for BRAC University campus (Merul Badda, Dhaka)
const BRAC_LAT = 23.7725;
const BRAC_LON = 90.4254;
const ALLOWED_RADIUS_METERS = 200;

// Haversine Formula for distance checking
function isInsideBrac(lat: number, lon: number): boolean {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat * Math.PI) / 180;
  const phi2 = (BRAC_LAT * Math.PI) / 180;
  const deltaPhi = ((BRAC_LAT - lat) * Math.PI) / 180;
  const deltaLambda = ((BRAC_LON - lon) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  console.log(`Calculated distance to BRAC University: ${distance.toFixed(1)}m`);
  return distance <= ALLOWED_RADIUS_METERS;
}

export const clockIn = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "GPS coordinates (latitude & longitude) are required to verify location." });
    }

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);

    if (isNaN(latNum) || isNaN(lonNum)) {
      return res.status(400).json({ error: "Invalid coordinate numbers." });
    }

    // Geofencing verification
    if (!isInsideBrac(latNum, lonNum)) {
      return res.status(403).json({ error: "Access Denied: You must be physically present at the BRAC University campus to clock in." });
    }

    const todayStr = new Date().toLocaleDateString("sv-SE"); // sv-SE outputs "YYYY-MM-DD"

    const existingLog = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: req.user!.id,
          date: todayStr
        }
      }
    });

    if (existingLog) {
      return res.status(400).json({ error: "You have already clocked in for today." });
    }

    const now = new Date();
    // Shift starts at 9:00 AM
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const isLate = hours > 9 || (hours === 9 && minutes > 0);

    const log = await prisma.attendance.create({
      data: {
        userId: req.user!.id,
        date: todayStr,
        clockIn: now,
        isLate
      }
    });

    // Notify employee of verified check-in
    await createNotification(
      req.user!.id,
      "Attendance Verified",
      `Clock-in confirmed at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ${isLate ? "(Late check-in recorded)" : "(On-time)"}. Geofence verified at BRAC University.`,
      "ATTENDANCE",
      "/dashboard/attendance"
    );

    return res.status(201).json({ message: "Successfully clocked in.", attendance: log });
  } catch (err) {
    console.error("Clock In Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const clockOut = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "GPS coordinates (latitude & longitude) are required to verify location." });
    }

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);

    if (isNaN(latNum) || isNaN(lonNum)) {
      return res.status(400).json({ error: "Invalid coordinate numbers." });
    }

    // Geofencing verification
    if (!isInsideBrac(latNum, lonNum)) {
      return res.status(403).json({ error: "Access Denied: You must be physically present at the BRAC University campus to clock out." });
    }

    const todayStr = new Date().toLocaleDateString("sv-SE");

    const existingLog = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: req.user!.id,
          date: todayStr
        }
      }
    });

    if (!existingLog) {
      return res.status(400).json({ error: "You have not clocked in for today yet." });
    }

    if (existingLog.clockOut) {
      return res.status(400).json({ error: "You have already clocked out for today." });
    }

    const now = new Date();
    const diffMs = now.getTime() - existingLog.clockIn.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    const hoursWorked = Math.round(hours * 100) / 100; // Round to 2 decimal places

    const updated = await prisma.attendance.update({
      where: { id: existingLog.id },
      data: {
        clockOut: now,
        hoursWorked
      }
    });

    return res.status(200).json({ message: "Successfully clocked out.", attendance: updated });
  } catch (err) {
    console.error("Clock Out Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const getAttendanceStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const todayStr = new Date().toLocaleDateString("sv-SE");

    const log = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: req.user!.id,
          date: todayStr
        }
      }
    });

    return res.status(200).json({
      clockedIn: !!log,
      clockedOut: !!log?.clockOut,
      record: log
    });
  } catch (err) {
    console.error("Fetch Status Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const getAttendanceHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user!.role;
    let history;

    if (userRole === "HR") {
      // HR sees all employees' attendance records across the entire company
      history = await prisma.attendance.findMany({
        orderBy: {
          clockIn: "desc"
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });
    } else {
      // Employees and PMs see their own check-ins
      history = await prisma.attendance.findMany({
        where: {
          userId: req.user!.id
        },
        orderBy: {
          clockIn: "desc"
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });
    }

    return res.status(200).json({ history });
  } catch (err) {
    console.error("Fetch History Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};
