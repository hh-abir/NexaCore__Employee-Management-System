import { Response } from "express";
import { prisma } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/roleGuard";

export const createAnnouncement = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content } = req.body;

    if (req.user!.role !== "HR") {
      return res.status(403).json({ error: "Forbidden: Only HR administrators can create announcements." });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Announcement title is required." });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Announcement content is required." });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        authorId: req.user!.id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return res.status(201).json({ announcement });
  } catch (err) {
    console.error("Error creating announcement:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const getAnnouncements = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return res.status(200).json({ announcements });
  } catch (err) {
    console.error("Error fetching announcements:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};
