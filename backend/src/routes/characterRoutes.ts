import { Router } from "express";
import { createCharacter, updateCharacter, deleteCharacter } from "../controllers/characterController";

const router = Router();

router.post("/", createCharacter);
router.put("/:id", updateCharacter);
router.delete("/:id", deleteCharacter);

export default router;
