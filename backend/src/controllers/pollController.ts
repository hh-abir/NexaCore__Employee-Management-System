import { Response } from "express";
import { prisma } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/roleGuard";
import { createNotification, createRoleNotification } from "../utils/notificationService";
import { PollStatus, PollTarget } from "@prisma/client";

export const getPolls = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { projectId } = req.query;

    let projectIds: string[] = [];
    if (userRole === "EMPLOYEE") {
      const userProjects = await prisma.project.findMany({
        where: { employeeIds: { has: userId } },
        select: { id: true }
      });
      projectIds = userProjects.map(p => p.id);
    } else if (userRole === "PROJECT_MANAGER") {
      const pmProjects = await prisma.project.findMany({
        where: {
          OR: [
            { managerId: userId },
            { employeeIds: { has: userId } }
          ]
        },
        select: { id: true }
      });
      projectIds = pmProjects.map(p => p.id);
    }

    let whereClause: any = {};
    if (projectId) {
      whereClause = { projectId: projectId as string };
    } else if (userRole === "HR") {
      whereClause = {};
    } else {
      whereClause = {
        OR: [
          { target: "COMPANY_WIDE" },
          { target: "PROJECT", projectId: { in: projectIds } }
        ]
      };
    }

    const rawPolls = await prisma.poll.findMany({
      where: whereClause,
      include: {
        author: { select: { id: true, name: true, email: true, role: true } },
        project: { select: { id: true, name: true } },
        options: {
          include: {
            votes: { select: { userId: true } }
          }
        },
        votes: { select: { id: true, userId: true, optionId: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    // Auto-seed initial company-wide poll if DB is fresh
    if (rawPolls.length === 0 && userRole === "HR") {
      const seeded = await prisma.poll.create({
        data: {
          title: "Corporate Work Model & Hybrid Schedule Preference",
          description: "Help HR and leadership define our upcoming quarterly workplace flexibility guidelines.",
          target: "COMPANY_WIDE",
          status: "ACTIVE",
          allowMultiple: false,
          authorId: userId,
          options: {
            create: [
              { text: "3 Days Office / 2 Days Remote (Balanced Hybrid)" },
              { text: "Full Remote with Monthly In-Person Syncs" },
              { text: "4-Day Work Week (Compressed 36h Workload)" },
              { text: "Standard 5-Day On-Campus Schedule" }
            ]
          }
        },
        include: {
          author: { select: { id: true, name: true, email: true, role: true } },
          project: { select: { id: true, name: true } },
          options: { include: { votes: { select: { userId: true } } } },
          votes: { select: { id: true, userId: true, optionId: true } }
        }
      });
      rawPolls.push(seeded);
    }

    // Format poll stats, percentages, and user voting state
    const polls = rawPolls.map(poll => {
      const totalVotes = poll.votes.length;
      const uniqueVoters = new Set(poll.votes.map(v => v.userId)).size;
      const userVotes = poll.votes.filter(v => v.userId === userId);
      const userVotedOptionIds = userVotes.map(v => v.optionId);
      const hasVoted = userVotes.length > 0;

      const isExpired = poll.expiresAt ? new Date(poll.expiresAt).getTime() < Date.now() : false;

      const formattedOptions = poll.options.map(opt => {
        const optionVotesCount = opt.votes.length;
        const percentage = totalVotes > 0 ? Math.round((optionVotesCount / totalVotes) * 100) : 0;

        return {
          id: opt.id,
          text: opt.text,
          votesCount: optionVotesCount,
          percentage,
          isUserSelected: userVotedOptionIds.includes(opt.id)
        };
      });

      return {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        target: poll.target,
        status: isExpired ? "CLOSED" : poll.status,
        allowMultiple: poll.allowMultiple,
        expiresAt: poll.expiresAt ? poll.expiresAt.toISOString() : null,
        createdAt: poll.createdAt.toISOString(),
        author: poll.author,
        project: poll.project,
        options: formattedOptions,
        totalVotes,
        uniqueVoters,
        hasVoted,
        userVotedOptionIds
      };
    });

    return res.status(200).json({ polls });
  } catch (error) {
    console.error("[getPolls Error]:", error);
    return res.status(500).json({ error: "Failed to load polls." });
  }
};

export const createPoll = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, target, projectId, options, allowMultiple, expiresAt } = req.body;

    if (!title || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: "Poll title and at least 2 voting options are required." });
    }

    const pollTarget = (target as PollTarget) || "COMPANY_WIDE";

    // Permission checks
    if (pollTarget === "COMPANY_WIDE" && req.user!.role !== "HR") {
      return res.status(403).json({ error: "Forbidden: Only HR administrators can create company-wide surveys." });
    }

    let linkedProject: any = null;
    if (pollTarget === "PROJECT") {
      if (!projectId) {
        return res.status(400).json({ error: "A valid projectId is required for project polls." });
      }

      linkedProject = await prisma.project.findUnique({
        where: { id: projectId },
        include: { employees: { select: { id: true } } }
      });

      if (!linkedProject) {
        return res.status(404).json({ error: "Project not found." });
      }

      if (req.user!.role === "EMPLOYEE" && linkedProject.managerId !== req.user!.id && !linkedProject.employeeIds.includes(req.user!.id)) {
        return res.status(403).json({ error: "Forbidden: You are not assigned to this project." });
      }
    }

    const poll = await prisma.poll.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        target: pollTarget,
        status: "ACTIVE",
        projectId: pollTarget === "PROJECT" ? projectId : null,
        allowMultiple: !!allowMultiple,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        authorId: req.user!.id,
        options: {
          create: options.map((opt: string) => ({
            text: opt.trim()
          }))
        }
      },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } },
        options: true,
        project: { select: { id: true, name: true } }
      }
    });

    // Send notifications
    if (poll.target === "COMPANY_WIDE") {
      await createRoleNotification(
        ["HR", "PROJECT_MANAGER", "EMPLOYEE"],
        `New Company Survey: ${poll.title}`,
        `${req.user!.name} launched a company-wide poll. Cast your vote now!`,
        "ANNOUNCEMENT",
        "/dashboard/polls"
      );
    } else if (linkedProject) {
      const recipientIds = Array.from(new Set([...linkedProject.employeeIds, linkedProject.managerId]));
      for (const uid of recipientIds) {
        if (uid !== req.user!.id) {
          await createNotification(
            uid,
            `New Project Poll: ${linkedProject.name}`,
            `A new poll "${poll.title}" was launched for ${linkedProject.name}.`,
            "PROJECT",
            "/dashboard/polls"
          );
        }
      }
    }

    return res.status(201).json({ message: "Poll published successfully.", poll });
  } catch (error) {
    console.error("[createPoll Error]:", error);
    return res.status(500).json({ error: "Failed to create poll." });
  }
};

export const castVote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pollId = req.params.pollId as string;
    const { optionIds } = req.body;
    const userId = req.user!.id;

    if (!optionIds || (Array.isArray(optionIds) && optionIds.length === 0)) {
      return res.status(400).json({ error: "Please select at least one option to cast your vote." });
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: true,
        project: true
      }
    });

    if (!poll) {
      return res.status(404).json({ error: "Poll not found." });
    }

    if (poll.status === "CLOSED" || (poll.expiresAt && new Date(poll.expiresAt).getTime() < Date.now())) {
      return res.status(400).json({ error: "Voting is closed for this poll." });
    }

    // Check project permission if project-specific
    if (poll.target === "PROJECT" && poll.project && req.user!.role !== "HR") {
      const isMember = poll.project.managerId === userId || poll.project.employeeIds.includes(userId);
      if (!isMember) {
        return res.status(403).json({ error: "Forbidden: You are not a member of this project." });
      }
    }

    const selectedIds: string[] = Array.isArray(optionIds) ? optionIds : [optionIds];

    if (!poll.allowMultiple && selectedIds.length > 1) {
      return res.status(400).json({ error: "This poll only allows selecting a single option." });
    }

    // Verify all optionIds belong to this poll
    const validOptionIds = poll.options.map(o => o.id);
    for (const id of selectedIds) {
      if (!validOptionIds.includes(id)) {
        return res.status(400).json({ error: "Invalid option selected for this poll." });
      }
    }

    // Delete existing votes by this user for this poll
    await prisma.pollVote.deleteMany({
      where: { pollId, userId }
    });

    // Insert new votes
    for (const optId of selectedIds) {
      await prisma.pollVote.create({
        data: {
          pollId,
          optionId: optId,
          userId
        }
      });
    }

    return res.status(200).json({ message: "Vote recorded successfully!" });
  } catch (error) {
    console.error("[castVote Error]:", error);
    return res.status(500).json({ error: "Failed to submit vote." });
  }
};

export const closePoll = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pollId = req.params.pollId as string;

    const poll = await prisma.poll.findUnique({
      where: { id: pollId }
    });

    if (!poll) {
      return res.status(404).json({ error: "Poll not found." });
    }

    if (poll.authorId !== req.user!.id && req.user!.role !== "HR") {
      return res.status(403).json({ error: "Forbidden: You cannot close this poll." });
    }

    const updated = await prisma.poll.update({
      where: { id: pollId },
      data: { status: "CLOSED" }
    });

    return res.status(200).json({ message: "Poll closed successfully.", poll: updated });
  } catch (error) {
    console.error("[closePoll Error]:", error);
    return res.status(500).json({ error: "Failed to close poll." });
  }
};

export const deletePoll = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pollId = req.params.pollId as string;

    const poll = await prisma.poll.findUnique({
      where: { id: pollId }
    });

    if (!poll) {
      return res.status(404).json({ error: "Poll not found." });
    }

    if (poll.authorId !== req.user!.id && req.user!.role !== "HR") {
      return res.status(403).json({ error: "Forbidden: You cannot delete this poll." });
    }

    await prisma.poll.delete({
      where: { id: pollId }
    });

    return res.status(200).json({ message: "Poll deleted successfully." });
  } catch (error) {
    console.error("[deletePoll Error]:", error);
    return res.status(500).json({ error: "Failed to delete poll." });
  }
};
