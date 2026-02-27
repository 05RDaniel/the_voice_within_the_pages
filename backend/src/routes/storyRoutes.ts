import { Router } from "express";
import {
  getMyStories,
  createStory,
  getStory,
  updateStory,
  deleteStory,
} from "../controllers/storyController";
import {
  getChapters,
  getChapter,
  createChapter,
  updateChapter,
  deleteChapter,
} from "../controllers/chapterController";

const router = Router();

router.get("/", getMyStories);
router.post("/", createStory);
router.get("/:storyId/chapters", getChapters);
router.post("/:storyId/chapters", createChapter);
router.get("/:storyId/chapters/:chapterId", getChapter);
router.put("/:storyId/chapters/:chapterId", updateChapter);
router.delete("/:storyId/chapters/:chapterId", deleteChapter);
router.get("/:id", getStory);
router.put("/:id", updateStory);
router.delete("/:id", deleteStory);

export default router;

