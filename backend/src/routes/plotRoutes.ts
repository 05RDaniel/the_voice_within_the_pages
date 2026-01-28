import { Router } from "express";
import {
  createPlot,
  updatePlot,
  deletePlot,
} from "../controllers/plotController";

const router = Router();

router.post("/", createPlot);
router.put("/:id", updatePlot);
router.delete("/:id", deletePlot);

export default router;
