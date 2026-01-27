import { Router } from "express";
import { 
  getMyStories, 
  createStory, 
  getStory, 
  updateStory, 
  deleteStory 
} from "../controllers/storyController";

const router = Router();

router.get("/", getMyStories);
router.post("/", createStory);
router.get("/:id", getStory);
router.put("/:id", updateStory);
router.delete("/:id", deleteStory);

export default router;

