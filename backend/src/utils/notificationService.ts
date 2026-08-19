import { prisma } from "../config/db";
import { Role } from "@prisma/client";

export type NotificationType = 
  | "ATTENDANCE" 
  | "ANNOUNCEMENT" 
  | "LEAVE" 
  | "PROJECT" 
  | "PAYROLL" 
  | "LOAN" 
  | "EVALUATION" 
  | "GENERAL";

/**
 * Creates a notification for a specific user.
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType = "GENERAL",
  link?: string
) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link: link || null,
        read: false,
      },
    });
  } catch (error) {
    console.error("Failed to create notification for user:", userId, error);
    return null;
  }
}

/**
 * Broadcasts a notification to all active users (e.g. for company announcements).
 */
export async function createGlobalNotification(
  title: string,
  message: string,
  type: NotificationType = "ANNOUNCEMENT",
  link?: string
) {
  try {
    const users = await prisma.user.findMany({ select: { id: true } });
    if (users.length === 0) return;

    const data = users.map((u) => ({
      userId: u.id,
      title,
      message,
      type,
      link: link || null,
      read: false,
    }));

    return await prisma.notification.createMany({
      data,
    });
  } catch (error) {
    console.error("Failed to create global notification:", error);
    return null;
  }
}

/**
 * Sends a notification to all users matching specific roles (e.g. ["HR", "PROJECT_MANAGER"]).
 */
export async function createRoleNotification(
  roles: Role[],
  title: string,
  message: string,
  type: NotificationType = "GENERAL",
  link?: string
) {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: roles } },
      select: { id: true },
    });
    if (users.length === 0) return;

    const data = users.map((u) => ({
      userId: u.id,
      title,
      message,
      type,
      link: link || null,
      read: false,
    }));

    return await prisma.notification.createMany({
      data,
    });
  } catch (error) {
    console.error("Failed to create role notification:", error);
    return null;
  }
}
