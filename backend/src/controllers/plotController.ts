import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const createPlot = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const { timelineId, name, start, end } = req.body;

    if (!timelineId || !name || start === undefined || end === undefined) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    if (start > end) {
      return res.status(400).json({ error: "El inicio no puede ser mayor que el final" });
    }

    if (start < 1) {
      return res.status(400).json({ error: "El inicio debe ser al menos 1" });
    }

    // Verify timeline belongs to user
    const timeline = await prisma.timeline.findUnique({
      where: { id: timelineId },
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
      return res.status(403).json({ error: "No tienes permiso para añadir tramas a esta línea temporal" });
    }

    const plot = await prisma.plot.create({
      data: {
        name,
        start: parseFloat(start),
        end: parseFloat(end),
        timelineId
      }
    });

    res.status(201).json({ plot });
  } catch (error) {
    console.error("Create plot error:", error);
    res.status(500).json({ error: "Error al crear la trama" });
  }
};

export const updatePlot = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const id = req.params.id as string;
    const { name, start, end } = req.body;

    // Verify plot exists and belongs to user
    const existingPlot = await prisma.plot.findUnique({
      where: { id },
      include: {
        timeline: {
          include: {
            story: {
              select: {
                authorId: true
              }
            }
          }
        }
      }
    });

    if (!existingPlot) {
      return res.status(404).json({ error: "Trama no encontrada" });
    }

    if (existingPlot.timeline.story.authorId !== userId) {
      return res.status(403).json({ error: "No tienes permiso para editar esta trama" });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (start !== undefined) updateData.start = parseFloat(start);
    if (end !== undefined) updateData.end = parseFloat(end);

    if (updateData.start && updateData.end && updateData.start > updateData.end) {
      return res.status(400).json({ error: "El inicio no puede ser mayor que el final" });
    }

    const plot = await prisma.plot.update({
      where: { id },
      data: updateData
    });

    res.json({ plot });
  } catch (error) {
    console.error("Update plot error:", error);
    res.status(500).json({ error: "Error al actualizar la trama" });
  }
};

export const deletePlot = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const id = req.params.id as string;

    // Verify plot exists and belongs to user
    const plot = await prisma.plot.findUnique({
      where: { id },
      include: {
        timeline: {
          include: {
            story: {
              select: {
                authorId: true
              }
            }
          }
        }
      }
    });

    if (!plot) {
      return res.status(404).json({ error: "Trama no encontrada" });
    }

    if (plot.timeline.story.authorId !== userId) {
      return res.status(403).json({ error: "No tienes permiso para eliminar esta trama" });
    }

    await prisma.plot.delete({
      where: { id }
    });

    res.json({ message: "Trama eliminada exitosamente" });
  } catch (error) {
    console.error("Delete plot error:", error);
    res.status(500).json({ error: "Error al eliminar la trama" });
  }
};
