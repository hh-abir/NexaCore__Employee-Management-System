import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import {
  getRooms,
  createRoom,
  getBookings,
  bookRoom,
  reviewBooking,
  cancelBooking
} from "../controllers/roomController";

const router = Router();

router.get("/", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getRooms);
router.post("/", roleGuard(["HR"]), createRoom);

router.get("/bookings", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), getBookings);
router.post("/bookings", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), bookRoom);
router.patch("/bookings/:bookingId/review", roleGuard(["HR"]), reviewBooking);
router.patch("/bookings/:bookingId/cancel", roleGuard(["HR", "PROJECT_MANAGER", "EMPLOYEE"]), cancelBooking);

export default router;
