import { Router } from "express";
import {
  createNote,
  updateNote,
  deleteNote,
} from "../controllers/noteController";

const router = Router();

router.post("/", createNote);
router.put("/:id", updateNote);
router.delete("/:id", deleteNote);

export default router;
