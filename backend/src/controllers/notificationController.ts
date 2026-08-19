import { Response } from "express";
import { prisma } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/roleGuard";

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
      prisma.notification.count({
        where: { userId, read: false },
      }),
    ]);

    return res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== userId) {
      return res.status(404).json({ error: "Notification not found." });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return res.status(200).json({ message: "Notification marked as read.", notification: updated });
  } catch (error) {
    console.error("Mark As Read Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return res.status(200).json({ message: "All notifications marked as read." });
  } catch (error) {
    console.error("Mark All As Read Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const clearAllNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    await prisma.notification.deleteMany({
      where: { userId },
    });

    return res.status(200).json({ message: "All notifications cleared." });
  } catch (error) {
    console.error("Clear All Notifications Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
