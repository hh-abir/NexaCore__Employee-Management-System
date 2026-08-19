import { Request, Response } from "express";
import { prisma } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/roleGuard";
import { createNotification } from "../utils/notificationService";
import { CertificateType } from "@prisma/client";

export const generateCertificateCode = (type = "CERT") => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NEXA-${type}-${timestamp}-${randomHex}`;
};

export const getCertificates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let whereClause: any = {};
    if (userRole === "EMPLOYEE") {
      whereClause = { recipientId: userId };
    } else if (userRole === "PROJECT_MANAGER") {
      whereClause = {
        OR: [
          { recipientId: userId },
          { issuerId: userId }
        ]
      };
    } else if (userRole === "HR") {
      whereClause = {};
    }

    const certificates = await prisma.certificate.findMany({
      where: whereClause,
      include: {
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            designation: true,
            department: true
          }
        },
        issuer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            category: true,
            budget: true
          }
        }
      },
      orderBy: { issuedAt: "desc" }
    });

    return res.status(200).json({ certificates });
  } catch (error) {
    console.error("[getCertificates Error]:", error);
    return res.status(500).json({ error: "Failed to load certificates." });
  }
};

export const verifyCertificate = async (req: Request, res: Response) => {
  try {
    const code = req.params.code as string;

    const certificate = await prisma.certificate.findUnique({
      where: { certificateCode: code.toUpperCase().trim() },
      include: {
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            designation: true,
            department: true
          }
        },
        issuer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });

    if (!certificate) {
      return res.status(404).json({
        isValid: false,
        error: "Certificate not found. The verification code is invalid or has been revoked."
      });
    }

    return res.status(200).json({
      isValid: true,
      certificate
    });
  } catch (error) {
    console.error("[verifyCertificate Error]:", error);
    return res.status(500).json({ error: "Failed to verify certificate." });
  }
};

export const issueCertificate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { recipientId, title, type, description, projectId, pmSignature, hrSignature } = req.body;

    if (req.user!.role !== "HR" && req.user!.role !== "PROJECT_MANAGER") {
      return res.status(403).json({ error: "Forbidden: Only HR administrators and Project Managers can issue certificates." });
    }

    if (!recipientId || !title) {
      return res.status(400).json({ error: "Recipient and certificate title are required." });
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId }
    });

    if (!recipient) {
      return res.status(404).json({ error: "Recipient user not found." });
    }

    const code = generateCertificateCode(type === "PROJECT_COMPLETION" ? "PROJ" : "AWARD");

    const certificate = await prisma.certificate.create({
      data: {
        certificateCode: code,
        title: title.trim(),
        type: (type as CertificateType) || "PROJECT_COMPLETION",
        description: description ? description.trim() : null,
        recipientId,
        projectId: projectId || null,
        issuerId: req.user!.id,
        pmSignature: pmSignature || req.user!.name,
        hrSignature: hrSignature || "NexaCore Executive Board"
      },
      include: {
        recipient: { select: { id: true, name: true, email: true } },
        issuer: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } }
      }
    });

    // Notify recipient
    await createNotification(
      recipientId,
      `Official Credential Issued: ${title}`,
      `You have been awarded the "${title}" certificate. Verification Code: ${code}.`,
      "GENERAL",
      "/dashboard/certificates"
    );

    return res.status(201).json({
      message: "Certificate issued and verified successfully.",
      certificate
    });
  } catch (error) {
    console.error("[issueCertificate Error]:", error);
    return res.status(500).json({ error: "Failed to issue certificate." });
  }
};

export const deleteCertificate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const cert = await prisma.certificate.findUnique({
      where: { id }
    });

    if (!cert) {
      return res.status(404).json({ error: "Certificate not found." });
    }

    if (cert.issuerId !== req.user!.id && req.user!.role !== "HR") {
      return res.status(403).json({ error: "Forbidden: You cannot delete this certificate." });
    }

    await prisma.certificate.delete({
      where: { id }
    });

    return res.status(200).json({ message: "Certificate revoked successfully." });
  } catch (error) {
    console.error("[deleteCertificate Error]:", error);
    return res.status(500).json({ error: "Failed to revoke certificate." });
  }
};
