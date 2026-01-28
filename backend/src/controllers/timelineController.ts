import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getMyTimelines = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const timelines = await prisma.timeline.findMany({
      where: {
        story: {
          authorId: userId
        }
      },
      include: {
        story: {
          select: {
            id: true,
            title: true,
          }
        },
        plots: {
          select: {
            id: true,
            name: true,
            start: true,
            end: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json({ timelines });
  } catch (error) {
    console.error("Get timelines error:", error);
    res.status(500).json({ error: "Error al obtener las líneas temporales" });
  }
};

export const getTimeline = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;
    const id = req.params.id as string;

    const timeline = await prisma.timeline.findUnique({
      where: { id },
      include: {
        story: {
          select: {
            id: true,
            title: true,
            authorId: true,
          }
        },
        plots: {
          select: {
            id: true,
            name: true,
            start: true,
            end: true,
          },
          orderBy: {
            start: "asc"
          }
        }
      }
    });

    if (!timeline) {
      return res.status(404).json({ error: "Línea temporal no encontrada" });
    }

    // Check access
    if (timeline.story.authorId !== userId) {
      return res.status(403).json({ error: "No tienes acceso a esta línea temporal" });
    }

    res.json({ timeline });
  } catch (error) {
    console.error("Get timeline error:", error);
    res.status(500).json({ error: "Error al obtener la línea temporal" });
  }
};

export const createTimeline = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const { storyId } = req.body;

    if (!storyId) {
      return res.status(400).json({ error: "El ID de la historia es requerido" });
    }

    // Verify story belongs to user
    const story = await prisma.story.findUnique({
      where: { id: storyId }
    });

    if (!story) {
      return res.status(404).json({ error: "Historia no encontrada" });
    }

    if (story.authorId !== userId) {
      return res.status(403).json({ error: "No tienes permiso para añadir líneas temporales a esta historia" });
    }

    const timeline = await prisma.timeline.create({
      data: {
        storyId
      },
      include: {
        story: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    });

    res.status(201).json({ timeline });
  } catch (error) {
    console.error("Create timeline error:", error);
    res.status(500).json({ error: "Error al crear la línea temporal" });
  }
};

export const deleteTimeline = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const id = req.params.id as string;

    const timeline = await prisma.timeline.findUnique({
      where: { id },
      include: {
        story: {
          select: {
            authorId: true
          }
        }
      }
    });

    if (!timeline) {
      return res.status(404).json({ error: "Línea temporal no encontrada" });
    }

    if (timeline.story.authorId !== userId) {
      return res.status(403).json({ error: "No tienes permiso para eliminar esta línea temporal" });
    }

    await prisma.timeline.delete({
      where: { id }
    });

    res.json({ message: "Línea temporal eliminada exitosamente" });
  } catch (error) {
    console.error("Delete timeline error:", error);
    res.status(500).json({ error: "Error al eliminar la línea temporal" });
  }
};
