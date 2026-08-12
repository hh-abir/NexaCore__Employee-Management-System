import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth";
import hrRoutes from "./routes/hrRoutes";
import projectRoutes from "./routes/projectRoutes";
import announcementRoutes from "./routes/announcementRoutes";
import attendanceRoutes from "./routes/attendanceRoutes";

dotenv.config();

const app = express();


app.use(
  cors({
    origin: "http://localhost:3000",
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


app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

export default app;
