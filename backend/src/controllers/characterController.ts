import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const createCharacter = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const { storyId, name, description } = req.body;
    if (!storyId || !name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Historia y nombre son requeridos" });
    }

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { authorId: true },
    });
    if (!story) {
      return res.status(404).json({ error: "Historia no encontrada" });
    }
    if (story.authorId !== userId) {
      return res.status(403).json({ error: "No tienes permiso para añadir personajes a esta historia" });
    }

    const character = await prisma.character.create({
      data: {
        storyId,
        name: name.trim(),
        description: description != null && description !== "" ? String(description).trim() : null,
      },
    });
    res.status(201).json({ character });
  } catch (error) {
    console.error("Create character error:", error);
    res.status(500).json({ error: "Error al crear el personaje" });
  }
};

export const updateCharacter = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const id = req.params.id as string;
    const { name, description } = req.body;

    const existing = await prisma.character.findUnique({
      where: { id },
      include: { story: { select: { authorId: true } } },
    });
    if (!existing) {
      return res.status(404).json({ error: "Personaje no encontrado" });
    }
    if (existing.story.authorId !== userId) {
      return res.status(403).json({ error: "No tienes permiso para editar este personaje" });
    }

    const updateData: { name?: string; description?: string | null } = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (description !== undefined) updateData.description = description === "" ? null : (description && String(description).trim()) || null;

    const character = await prisma.character.update({
      where: { id },
      data: updateData,
    });
    res.json({ character });
  } catch (error) {
    console.error("Update character error:", error);
    res.status(500).json({ error: "Error al actualizar el personaje" });
  }
};

export const deleteCharacter = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const id = req.params.id as string;
    const existing = await prisma.character.findUnique({
      where: { id },
      include: { story: { select: { authorId: true } } },
    });
    if (!existing) {
      return res.status(404).json({ error: "Personaje no encontrado" });
    }
    if (existing.story.authorId !== userId) {
      return res.status(403).json({ error: "No tienes permiso para eliminar este personaje" });
    }

    await prisma.character.delete({ where: { id } });
    res.json({ message: "Personaje eliminado" });
  } catch (error) {
    console.error("Delete character error:", error);
    res.status(500).json({ error: "Error al eliminar el personaje" });
  }
};
