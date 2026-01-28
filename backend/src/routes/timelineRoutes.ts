import { Router } from "express";
import {
  getMyTimelines,
  getTimeline,
  createTimeline,
  deleteTimeline,
} from "../controllers/timelineController";

const router = Router();

router.get("/", getMyTimelines);
router.get("/:id", getTimeline);
router.post("/", createTimeline);
router.delete("/:id", deleteTimeline);

export default router;
