import { Router } from "express";
import { getContents, createContent } from "../controllers/contentController";

const router = Router();

router.get("/", getContents);
router.post("/", createContent);

export default router;

