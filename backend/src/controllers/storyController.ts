import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getMyStories = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const stories = await prisma.story.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        chapters: { select: { visibility: true } },
      },
    });

    const storiesWithVisibility = stories.map((s) => {
      const visibility = (s.chapters as any[]).some((c) => c.visibility === "PUBLIC") ? "PUBLIC" : "PRIVATE";
      const { chapters: _, ...rest } = s;
      return { ...rest, visibility };
    });

    res.json({ stories: storiesWithVisibility });
  } catch (error) {
    console.error("Get stories error:", error);
    res.status(500).json({ error: "Error al obtener las historias" });
  }
};

export const createStory = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: "El título es requerido" });
    }

    const story = await prisma.story.create({
      data: {
        title,
        visibility: "PRIVATE",
        authorId: userId,
        timelines: {
          create: {}
        }
      },
      select: {
        id: true,
        title: true,
        visibility: true,
        createdAt: true,
        updatedAt: true,
        timelines: { select: { id: true } },
      },
    });

    res.status(201).json({ story });
  } catch (error) {
    console.error("Create story error:", error);
    res.status(500).json({ error: "Error al crear la historia" });
  }
};

export const getStory = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;
    const id = req.params.id as string;

    const story = await prisma.story.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        chapters: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            name: true,
            content: true,
            visibility: true,
            order: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        timelines: {
          select: {
            id: true,
            name: true,
            _count: { select: { plots: true, notes: true } },
          },
        },
        characters: true,
      },
    });

    if (!story) {
      return res.status(404).json({ error: "Historia no encontrada" });
    }

    const storyVisibility = (story.chapters as any[]).some((c) => c.visibility === "PUBLIC") ? "PUBLIC" : "PRIVATE";
    const storyResponse = { ...story, visibility: storyVisibility };

    if (storyVisibility === "PRIVATE" && story.authorId !== userId) {
      return res.status(403).json({ error: "No tienes acceso a esta historia" });
    }

    res.json({ story: storyResponse });
  } catch (error) {
    console.error("Get story error:", error);
    res.status(500).json({ error: "Error al obtener la historia" });
  }
};

export const updateStory = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const id = req.params.id as string;
    const { title } = req.body;

    const existingStory = await prisma.story.findUnique({
      where: { id },
      include: { chapters: { select: { visibility: true } } },
    });

    if (!existingStory) {
      return res.status(404).json({ error: "Historia no encontrada" });
    }

    if (existingStory.authorId !== userId) {
      return res.status(403).json({ error: "No tienes permiso para editar esta historia" });
    }

    const updateData: any = {};
    if (title) updateData.title = title;

    const updated = await prisma.story.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        chapters: { select: { visibility: true } },
      },
    });

    const visibility = (updated.chapters as any[]).some((c) => c.visibility === "PUBLIC") ? "PUBLIC" : "PRIVATE";
    const { chapters: _, ...story } = updated;
    res.json({ story: { ...story, visibility } });
  } catch (error) {
    console.error("Update story error:", error);
    res.status(500).json({ error: "Error al actualizar la historia" });
  }
};

export const deleteStory = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const id = req.params.id as string;

    // Check if story exists and belongs to user
    const existingStory = await prisma.story.findUnique({
      where: { id },
    });

    if (!existingStory) {
      return res.status(404).json({ error: "Historia no encontrada" });
    }

    if (existingStory.authorId !== userId) {
      return res.status(403).json({ error: "No tienes permiso para eliminar esta historia" });
    }

    await prisma.story.delete({
      where: { id },
    });

    res.json({ message: "Historia eliminada exitosamente" });
  } catch (error) {
    console.error("Delete story error:", error);
    res.status(500).json({ error: "Error al eliminar la historia" });
  }
};

