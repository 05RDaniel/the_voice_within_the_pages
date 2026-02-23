import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const createNote = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const { timelineId, name, description, position, color } = req.body;

    if (!timelineId || !name || position === undefined) {
      return res.status(400).json({ error: "Timeline, nombre y posición son requeridos" });
    }

    const pos = parseFloat(position);
    if (isNaN(pos) || pos < 1) {
      return res.status(400).json({ error: "La posición debe ser al menos 1" });
    }

    const timeline = await prisma.timeline.findUnique({
      where: { id: timelineId },
      include: {
        story: { select: { authorId: true } },
      },
    });

    if (!timeline) {
      return res.status(404).json({ error: "Línea temporal no encontrada" });
    }

    if (timeline.story.authorId !== userId) {
      return res.status(403).json({ error: "No tienes permiso para añadir notas a esta línea temporal" });
    }

    const note = await prisma.note.create({
      data: {
        name,
        description: description != null && description !== "" ? String(description) : null,
        position: pos,
        color: color != null && color !== "" && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : null,
        timelineId,
      },
    });

    res.status(201).json({ note });
  } catch (error) {
    console.error("Create note error:", error);
    res.status(500).json({ error: "Error al crear la nota" });
  }
};

export const updateNote = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const id = req.params.id as string;
    const { name, description, position, color } = req.body;

    const existingNote = await prisma.note.findUnique({
      where: { id },
      include: {
        timeline: {
          include: {
            story: { select: { authorId: true } },
          },
        },
      },
    });

    if (!existingNote) {
      return res.status(404).json({ error: "Nota no encontrada" });
    }

    if (existingNote.timeline.story.authorId !== userId) {
      return res.status(403).json({ error: "No tienes permiso para editar esta nota" });
    }

    const updateData: { name?: string; description?: string | null; position?: number; color?: string | null } = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description === "" ? null : description;
    if (position !== undefined) {
      const pos = parseFloat(position);
      if (isNaN(pos) || pos < 1) {
        return res.status(400).json({ error: "La posición debe ser al menos 1" });
      }
      updateData.position = pos;
    }
    if (color !== undefined) updateData.color = color === "" || !/^#[0-9A-Fa-f]{6}$/.test(color) ? null : color;

    const note = await prisma.note.update({
      where: { id },
      data: updateData,
    });

    res.json({ note });
  } catch (error) {
    console.error("Update note error:", error);
    res.status(500).json({ error: "Error al actualizar la nota" });
  }
};

export const deleteNote = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const id = req.params.id as string;

    const note = await prisma.note.findUnique({
      where: { id },
      include: {
        timeline: {
          include: {
            story: { select: { authorId: true } },
          },
        },
      },
    });

    if (!note) {
      return res.status(404).json({ error: "Nota no encontrada" });
    }

    if (note.timeline.story.authorId !== userId) {
      return res.status(403).json({ error: "No tienes permiso para eliminar esta nota" });
    }

    await prisma.note.delete({
      where: { id },
    });

    res.json({ message: "Nota eliminada exitosamente" });
  } catch (error) {
    console.error("Delete note error:", error);
    res.status(500).json({ error: "Error al eliminar la nota" });
  }
};
