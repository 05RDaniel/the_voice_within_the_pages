import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getContents = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const contents = await prisma.content.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json({ contents });
  } catch (error) {
    console.error("Get contents error:", error);
    res.status(500).json({ error: "Error al obtener contenidos" });
  }
};

export const createContent = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const { title, text } = req.body;

    if (!title || !text) {
      return res.status(400).json({ error: "Título y texto son requeridos" });
    }

    const content = await prisma.content.create({
      data: {
        title,
        text,
        userId,
      },
    });

    res.status(201).json({ content });
  } catch (error) {
    console.error("Create content error:", error);
    res.status(500).json({ error: "Error al crear contenido" });
  }
};

