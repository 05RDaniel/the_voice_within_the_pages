import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const validVisibilities = ["PUBLIC", "PRIVATE"] as const;

function param(req: Request, key: string): string | undefined {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : v;
}

export const getChapters = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: "No autenticado" });

    const storyId = param(req, "storyId");
    if (!storyId) return res.status(400).json({ error: "storyId requerido" });
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true, authorId: true, visibility: true },
    });
    if (!story) return res.status(404).json({ error: "Historia no encontrada" });
    if (story.visibility === "PRIVATE" && story.authorId !== userId) {
      return res.status(403).json({ error: "No tienes acceso a esta historia" });
    }

    const chapters = await prisma.chapter.findMany({
      where: { storyId },
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
    });
    res.json({ chapters });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los capítulos" });
  }
};

export const getChapter = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: "No autenticado" });

    const storyId = param(req, "storyId");
    const chapterId = param(req, "chapterId");
    if (!storyId || !chapterId) return res.status(400).json({ error: "storyId y chapterId requeridos" });
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId, storyId },
      include: { story: { select: { authorId: true, visibility: true } } },
    });
    if (!chapter) return res.status(404).json({ error: "Capítulo no encontrado" });
    const storyRel = (chapter as { story: { authorId: string; visibility: string } }).story;
    if (storyRel.visibility === "PRIVATE" && storyRel.authorId !== userId) {
      return res.status(403).json({ error: "No tienes acceso" });
    }
    const { story: _, ...chapterData } = chapter as typeof chapter & { story: unknown };
    res.json({ chapter: chapterData });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el capítulo" });
  }
};

export const createChapter = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: "No autenticado" });

    const storyId = param(req, "storyId");
    if (!storyId) return res.status(400).json({ error: "storyId requerido" });
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { authorId: true },
    });
    if (!story) return res.status(404).json({ error: "Historia no encontrada" });
    if (story.authorId !== userId) {
      return res.status(403).json({ error: "No tienes permiso para añadir capítulos" });
    }

    const { name, content, visibility } = req.body;
    if (!name || content === undefined) {
      return res.status(400).json({ error: "Nombre y contenido son requeridos" });
    }

    const count = await prisma.chapter.count({ where: { storyId } });
    const visibilityVal = validVisibilities.includes(visibility) ? visibility : "PRIVATE";

    const chapter = await prisma.chapter.create({
      data: {
        storyId,
        name: String(name).trim(),
        content: String(content),
        visibility: visibilityVal,
        order: count,
      },
      select: {
        id: true,
        name: true,
        content: true,
        visibility: true,
        order: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.status(201).json({ chapter });
  } catch (error) {
    res.status(500).json({ error: "Error al crear el capítulo" });
  }
};

export const updateChapter = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: "No autenticado" });

    const storyId = param(req, "storyId");
    const chapterId = param(req, "chapterId");
    if (!storyId || !chapterId) return res.status(400).json({ error: "storyId y chapterId requeridos" });
    const existing = await prisma.chapter.findUnique({
      where: { id: chapterId, storyId },
      include: { story: { select: { authorId: true } } },
    });
    if (!existing) return res.status(404).json({ error: "Capítulo no encontrado" });
    if ((existing as { story: { authorId: string } }).story.authorId !== userId) {
      return res.status(403).json({ error: "No tienes permiso para editar este capítulo" });
    }

    const { name, content, visibility, order } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (content !== undefined) updateData.content = String(content);
    if (visibility !== undefined && validVisibilities.includes(visibility)) {
      updateData.visibility = visibility;
    }
    if (typeof order === "number") updateData.order = order;

    const chapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: updateData,
      select: {
        id: true,
        name: true,
        content: true,
        visibility: true,
        order: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ chapter });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el capítulo" });
  }
};

export const deleteChapter = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: "No autenticado" });

    const storyId = param(req, "storyId");
    const chapterId = param(req, "chapterId");
    if (!storyId || !chapterId) return res.status(400).json({ error: "storyId y chapterId requeridos" });
    const existing = await prisma.chapter.findUnique({
      where: { id: chapterId, storyId },
      include: { story: { select: { authorId: true } } },
    });
    if (!existing) return res.status(404).json({ error: "Capítulo no encontrado" });
    if ((existing as { story: { authorId: string } }).story.authorId !== userId) {
      return res.status(403).json({ error: "No tienes permiso para eliminar este capítulo" });
    }

    await prisma.chapter.delete({ where: { id: chapterId } });
    res.json({ message: "Capítulo eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el capítulo" });
  }
};
