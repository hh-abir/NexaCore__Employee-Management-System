import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/roleGuard";
import { prisma } from "../config/db";
import { createRoleNotification } from "../utils/notificationService";

export const getKnowledgeDocuments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, search } = req.query;

    const whereClause: any = {};

    if (category && category !== "ALL") {
      whereClause.category = category as string;
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      whereClause.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } }
      ];
    }

    const documents = await prisma.knowledgeDocument.findMany({
      where: whereClause,
      include: {
        author: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.status(200).json({ documents });
  } catch (error: any) {
    console.error("[getKnowledgeDocuments Error]:", error);
    return res.status(500).json({ error: "Failed to fetch knowledge base documents." });
  }
};

export const createKnowledgeDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, category, fileUrl } = req.body;
    const authorId = req.user!.id;

    if (!title || !fileUrl) {
      return res.status(400).json({ error: "Title and Google Drive / PDF Document URL are required." });
    }

    const document = await prisma.knowledgeDocument.create({
      data: {
        title: title.trim(),
        description: description?.trim() || "",
        category: category || "POLICY",
        fileUrl: fileUrl.trim(),
        authorId
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    // Notify organization
    await createRoleNotification(
      ["EMPLOYEE", "PROJECT_MANAGER", "HR"],
      `New Resource Added: ${title}`,
      `HR published a new knowledge base resource under ${category || "General Policies"}.`,
      "GENERAL",
      "/dashboard"
    ).catch(err => console.warn("Failed to create knowledge notification:", err));

    return res.status(201).json({
      message: "Knowledge base resource published successfully.",
      document
    });
  } catch (error: any) {
    console.error("[createKnowledgeDocument Error]:", error);
    return res.status(500).json({ error: "Failed to publish knowledge document." });
  }
};

export const deleteKnowledgeDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const documentId = req.params.id as string;

    const existing = await prisma.knowledgeDocument.findUnique({
      where: { id: documentId }
    });

    if (!existing) {
      return res.status(404).json({ error: "Knowledge document not found." });
    }

    await prisma.knowledgeDocument.delete({
      where: { id: documentId }
    });

    return res.status(200).json({ message: "Resource removed successfully." });
  } catch (error: any) {
    console.error("[deleteKnowledgeDocument Error]:", error);
    return res.status(500).json({ error: "Failed to delete knowledge document." });
  }
};
