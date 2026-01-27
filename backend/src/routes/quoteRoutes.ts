import { Router } from "express";
import { getRandomQuote, getAllQuotes } from "../controllers/quoteController";

const router = Router();

// GET /api/quotes/random - Get a random quote
router.get("/random", getRandomQuote);

// GET /api/quotes - Get all quotes
router.get("/", getAllQuotes);

export default router;

