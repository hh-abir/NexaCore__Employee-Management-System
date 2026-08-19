import { Response } from "express";
import { prisma } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/roleGuard";
import { createNotification, createRoleNotification } from "../utils/notificationService";
import { BookingStatus, RoomStatus } from "@prisma/client";

const DEFAULT_ROOMS = [
  {
    name: "Silicon Boardroom",
    floor: "Floor 4 (Executive Suite)",
    capacity: 18,
    amenities: ["4K Video Conferencing", "Dual Cisco Smartboards", "Polycom Audio Hub", "High-Speed Ethernet", "Ergonomic Leather Seating"],
    status: "AVAILABLE" as RoomStatus
  },
  {
    name: "Turing Innovation Lab",
    floor: "Floor 3 (Engineering Hub)",
    capacity: 12,
    amenities: ["Dual 65-inch Displays", "Whiteboard Wall", "Apple AirPlay & Miracast", "Acoustic Noise-Cancelling Panels"],
    status: "AVAILABLE" as RoomStatus
  },
  {
    name: "Apollo Brainstorm Pod",
    floor: "Floor 5 (Product & Design)",
    capacity: 6,
    amenities: ["Interactive Touch Display", "Mobile Whiteboard", "Wireless Screen Sharing"],
    status: "AVAILABLE" as RoomStatus
  },
  {
    name: "Quantum Sync Room",
    floor: "Floor 4 (Central)",
    capacity: 8,
    amenities: ["HD Video Bar", "Polycom Conference Phone", "Whiteboard", "Espresso Bar Access"],
    status: "AVAILABLE" as RoomStatus
  }
];

export const getRooms = async (req: AuthenticatedRequest, res: Response) => {
  try {
    let rooms = await prisma.meetingRoom.findMany({
      orderBy: { name: "asc" }
    });

    // Seed default meeting rooms if table is empty
    if (rooms.length === 0) {
      for (const r of DEFAULT_ROOMS) {
        await prisma.meetingRoom.create({ data: r });
      }
      rooms = await prisma.meetingRoom.findMany({
        orderBy: { name: "asc" }
      });
    }

    return res.status(200).json({ rooms });
  } catch (error) {
    console.error("[getRooms Error]:", error);
    return res.status(500).json({ error: "Failed to load meeting rooms." });
  }
};

export const createRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, floor, capacity, amenities, status } = req.body;

    if (req.user!.role !== "HR") {
      return res.status(403).json({ error: "Forbidden: Only HR administrators can add meeting rooms." });
    }

    if (!name || !floor || !capacity) {
      return res.status(400).json({ error: "Room name, floor, and capacity are required." });
    }

    const room = await prisma.meetingRoom.create({
      data: {
        name: name.trim(),
        floor: floor.trim(),
        capacity: parseInt(capacity) || 8,
        amenities: Array.isArray(amenities) ? amenities : [],
        status: (status as RoomStatus) || "AVAILABLE"
      }
    });

    return res.status(201).json({ message: "Meeting room registered successfully.", room });
  } catch (error) {
    console.error("[createRoom Error]:", error);
    return res.status(500).json({ error: "Failed to register meeting room." });
  }
};

export const getBookings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let query: any = {};
    if (userRole !== "HR") {
      query = {
        OR: [
          { userId },
          { status: "APPROVED" }
        ]
      };
    }

    const bookings = await prisma.roomBooking.findMany({
      where: query,
      include: {
        room: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.status(200).json({ bookings });
  } catch (error) {
    console.error("[getBookings Error]:", error);
    return res.status(500).json({ error: "Failed to load room bookings." });
  }
};

export const bookRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomId, title, description, date, startTime, endTime, attendees } = req.body;

    if (!roomId || !title || !date || !startTime || !endTime) {
      return res.status(400).json({ error: "Room, title, date, start time, and end time are required." });
    }

    const room = await prisma.meetingRoom.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return res.status(404).json({ error: "Meeting room not found." });
    }

    if (room.status === "MAINTENANCE") {
      return res.status(400).json({ error: "This room is currently undergoing maintenance and cannot be reserved." });
    }

    // Time validation (startTime must be before endTime)
    if (startTime >= endTime) {
      return res.status(400).json({ error: "Start time must be strictly before end time." });
    }

    // 1. Room Availability Conflict Check against APPROVED bookings
    const roomOverlapping = await prisma.roomBooking.findFirst({
      where: {
        roomId,
        date,
        status: "APPROVED",
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } }
        ]
      }
    });

    if (roomOverlapping) {
      return res.status(400).json({
        error: `Schedule Collision: ${room.name} is already reserved by ${roomOverlapping.title} from ${roomOverlapping.startTime} to ${roomOverlapping.endTime}.`
      });
    }

    // 2. User Concurrency Rule: A user can only book one room at a time for the same time window
    const userConflict = await prisma.roomBooking.findFirst({
      where: {
        userId: req.user!.id,
        date,
        status: { in: ["PENDING", "APPROVED"] },
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } }
        ]
      },
      include: { room: true }
    });

    if (userConflict) {
      return res.status(400).json({
        error: `Booking Limit: You already have an active ${userConflict.status.toLowerCase()} reservation for "${userConflict.room?.name}" from ${userConflict.startTime} to ${userConflict.endTime} on ${date}. You can only book one room at a time.`
      });
    }

    const booking = await prisma.roomBooking.create({
      data: {
        roomId,
        userId: req.user!.id,
        title: title.trim(),
        description: description ? description.trim() : null,
        date,
        startTime,
        endTime,
        attendees: parseInt(attendees) || 2,
        status: "PENDING"
      },
      include: {
        room: true,
        user: { select: { id: true, name: true, email: true } }
      }
    });

    // Notify HR Administrators of new reservation request
    await createRoleNotification(
      ["HR"],
      `Meeting Room Reservation Request: ${room.name}`,
      `${req.user!.name} requested ${room.name} on ${date} (${startTime} - ${endTime}) for "${title}".`,
      "GENERAL",
      "/dashboard/rooms"
    );

    return res.status(201).json({
      message: "Room booking request submitted. HR authorization is pending.",
      booking
    });
  } catch (error) {
    console.error("[bookRoom Error]:", error);
    return res.status(500).json({ error: "Failed to submit room reservation." });
  }
};

export const reviewBooking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookingId = req.params.bookingId as string;
    const { status, reviewNote } = req.body;

    if (req.user!.role !== "HR") {
      return res.status(403).json({ error: "Forbidden: Only HR administrators can approve or reject meeting room reservations." });
    }

    const booking = await prisma.roomBooking.findUnique({
      where: { id: bookingId },
      include: { room: true, user: true }
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking request not found." });
    }

    if (status === "APPROVED") {
      // Re-verify no collision before approving
      const overlapping = await prisma.roomBooking.findFirst({
        where: {
          id: { not: bookingId },
          roomId: booking.roomId,
          date: booking.date,
          status: "APPROVED",
          AND: [
            { startTime: { lt: booking.endTime } },
            { endTime: { gt: booking.startTime } }
          ]
        }
      });

      if (overlapping) {
        return res.status(400).json({
          error: `Cannot approve: A conflicting reservation (${overlapping.title}) was already approved for ${overlapping.startTime} - ${overlapping.endTime}.`
        });
      }
    }

    const updated = await prisma.roomBooking.update({
      where: { id: bookingId },
      data: {
        status: (status as BookingStatus) || booking.status,
        reviewNote: reviewNote !== undefined ? reviewNote.trim() : booking.reviewNote,
        reviewedAt: new Date()
      },
      include: { room: true, user: true }
    });

    // Notify the requester
    await createNotification(
      booking.userId,
      `Meeting Room Booking ${updated.status}: ${booking.room.name}`,
      `Your reservation for ${booking.room.name} on ${booking.date} (${booking.startTime} - ${booking.endTime}) was marked as ${updated.status}.${reviewNote ? ' Note: "' + reviewNote + '"' : ""}`,
      "GENERAL",
      "/dashboard/rooms"
    );

    // If approved, automatically create a CalendarEvent
    if (updated.status === "APPROVED") {
      try {
        const startISO = new Date(`${booking.date}T${booking.startTime}:00`);
        const endISO = new Date(`${booking.date}T${booking.endTime}:00`);

        await prisma.calendarEvent.create({
          data: {
            title: `Meeting: ${booking.room.name} (${booking.title})`,
            description: `Room: ${booking.room.name} (${booking.room.floor}) &bull; Organizer: ${booking.user.name} &bull; ${booking.description || ""}`,
            type: "MEETING",
            startDate: isNaN(startISO.getTime()) ? new Date(booking.date) : startISO,
            endDate: isNaN(endISO.getTime()) ? new Date(booking.date) : endISO,
            userId: booking.userId,
            isGlobal: false
          }
        });
      } catch (calErr) {
        console.warn("Failed to inject calendar meeting entry:", calErr);
      }
    }

    return res.status(200).json({
      message: `Room booking successfully ${updated.status.toLowerCase()}.`,
      booking: updated
    });
  } catch (error) {
    console.error("[reviewBooking Error]:", error);
    return res.status(500).json({ error: "Failed to review room booking." });
  }
};

export const cancelBooking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookingId = req.params.bookingId as string;

    const booking = await prisma.roomBooking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }

    if (booking.userId !== req.user!.id && req.user!.role !== "HR") {
      return res.status(403).json({ error: "Forbidden: You cannot cancel this booking." });
    }

    const updated = await prisma.roomBooking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" }
    });

    return res.status(200).json({ message: "Reservation cancelled successfully.", booking: updated });
  } catch (error) {
    console.error("[cancelBooking Error]:", error);
    return res.status(500).json({ error: "Failed to cancel reservation." });
  }
};
