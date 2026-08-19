import { Response } from "express";
import { prisma } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/roleGuard";
import bcrypt from "bcryptjs";

export const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        department: true,
        designation: true,
        bio: true,
        location: true,
        emergencyContact: true,
        twoFactorEnabled: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    return res.status(200).json({ user });
  } catch (err) {
    console.error("Get Profile Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, phone, department, designation, bio, location, emergencyContact } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        name: name ? name.trim() : undefined,
        phone: phone !== undefined ? phone.trim() : undefined,
        department: department !== undefined ? department.trim() : undefined,
        designation: designation !== undefined ? designation.trim() : undefined,
        bio: bio !== undefined ? bio.trim() : undefined,
        location: location !== undefined ? location.trim() : undefined,
        emergencyContact: emergencyContact !== undefined ? emergencyContact.trim() : undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        department: true,
        designation: true,
        bio: true,
        location: true,
        emergencyContact: true,
        twoFactorEnabled: true,
        createdAt: true
      }
    });

    return res.status(200).json({
      message: "Profile information updated successfully.",
      user: updated
    });
  } catch (err) {
    console.error("Update Profile Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const toggleTwoFactor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { enabled } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        twoFactorEnabled: !!enabled
      },
      select: {
        id: true,
        twoFactorEnabled: true
      }
    });

    return res.status(200).json({
      message: `Two-factor authentication ${updated.twoFactorEnabled ? "enabled" : "disabled"}.`,
      twoFactorEnabled: updated.twoFactorEnabled
    });
  } catch (err) {
    console.error("Toggle 2FA Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const getActiveSessions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true
      }
    });

    return res.status(200).json({ sessions });
  } catch (err) {
    console.error("Fetch Sessions Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required." });
    }

    const account = await prisma.account.findFirst({
      where: {
        userId: req.user!.id,
        providerId: "credential"
      }
    });

    if (!account || !account.password) {
      return res.status(400).json({ error: "Account credentials not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, account.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect current password." });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.account.update({
      where: { id: account.id },
      data: { password: hashed }
    });

    return res.status(200).json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Change Password Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};
