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
        content: true,
        visibility: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ stories });
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

    const { title, content, visibility } = req.body;

    if (!title) {
      return res.status(400).json({ error: "El título es requerido" });
    }

    // Validate visibility
    const validVisibilities = ["PUBLIC", "PRIVATE", "UNLISTED"];
    const storyVisibility = validVisibilities.includes(visibility) ? visibility : "PRIVATE";

    const story = await prisma.story.create({
      data: {
        title,
        content: content || '',
        visibility: storyVisibility,
        authorId: userId,
        timelines: {
          create: {}
        }
      },
      select: {
        id: true,
        title: true,
        content: true,
        visibility: true,
        createdAt: true,
        updatedAt: true,
        timelines: {
          select: {
            id: true,
          }
        }
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
      },
    });

    if (!story) {
      return res.status(404).json({ error: "Historia no encontrada" });
    }

    // Check access permissions
    if (story.visibility === "PRIVATE" && story.authorId !== userId) {
      return res.status(403).json({ error: "No tienes acceso a esta historia" });
    }

    res.json({ story });
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
    const { title, content, visibility } = req.body;

    // Check if story exists and belongs to user
    const existingStory = await prisma.story.findUnique({
      where: { id },
    });

    if (!existingStory) {
      return res.status(404).json({ error: "Historia no encontrada" });
    }

    if (existingStory.authorId !== userId) {
      return res.status(403).json({ error: "No tienes permiso para editar esta historia" });
    }

    // Validate visibility if provided
    const validVisibilities = ["PUBLIC", "PRIVATE", "UNLISTED"];
    const updateData: any = {};
    
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (visibility && validVisibilities.includes(visibility)) {
      updateData.visibility = visibility;
    }

    const story = await prisma.story.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        content: true,
        visibility: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ story });
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

