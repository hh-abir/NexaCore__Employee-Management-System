import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth";
import hrRoutes from "./routes/hrRoutes";
import projectRoutes from "./routes/projectRoutes";
import announcementRoutes from "./routes/announcementRoutes";
import attendanceRoutes from "./routes/attendanceRoutes";
import leaveRoutes from "./routes/leaveRoutes";
import payrollRoutes from "./routes/payrollRoutes";
import loanRoutes from "./routes/loanRoutes";
import evaluationRoutes from "./routes/evaluationRoutes";
import userRoutes from "./routes/userRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import grievanceRoutes from "./routes/grievanceRoutes";
import calendarRoutes from "./routes/calendarRoutes";
import roomRoutes from "./routes/roomRoutes";
import pollRoutes from "./routes/pollRoutes";
import certificateRoutes from "./routes/certificateRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import financeRoutes from "./routes/financeRoutes";

dotenv.config();

const app = express();
app.set("trust proxy", 1);


const allowedOrigins = [
  "http://localhost:3000",
  "https://nexa-core-ems.vercel.app",
  process.env.FRONTEND_URL,
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app") || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);


app.all("/api/auth/*path", toNodeHandler(auth));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/api/hr", hrRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/evaluations", evaluationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/grievances", grievanceRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/finance", financeRoutes);


app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

export default app;
