import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getRandomQuote = async (req: Request, res: Response) => {
  try {
    const lang = (req.query.lang as string) || "es";
    
    // Get all quotes for the language
    const quotes = await prisma.quote.findMany({
      where: { lang },
    });

    if (quotes.length === 0) {
      return res.status(404).json({ error: "No quotes found for this language" });
    }

    // Return a random quote
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];

    res.json({
      id: quote.id,
      quote: quote.quote,
      author: quote.author,
      lang: quote.lang,
    });
  } catch (error) {
    console.error("Error fetching quote:", error);
    res.status(500).json({ error: "Error fetching quote" });
  }
};

export const getAllQuotes = async (req: Request, res: Response) => {
  try {
    const lang = req.query.lang as string;
    
    const quotes = await prisma.quote.findMany({
      where: lang ? { lang } : undefined,
      orderBy: { createdAt: "desc" },
    });

    res.json(quotes);
  } catch (error) {
    console.error("Error fetching quotes:", error);
    res.status(500).json({ error: "Error fetching quotes" });
  }
};

