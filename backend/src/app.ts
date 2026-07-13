import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth";
import hrRoutes from "./routes/hrRoutes";

dotenv.config();

const app = express();

// CORS configuration to allow Next.js client requests with credentials
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Better Auth handler - mounted BEFORE body parsing middleware
app.all("/api/auth/*path", toNodeHandler(auth));

// Body parsing middleware for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes: aligns path to client endpoint demands (POST /api/hr/employees)
app.use("/api/hr", hrRoutes);

// General status route
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

export default app;
