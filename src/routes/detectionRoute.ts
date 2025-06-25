// src/routes/detection.routes.ts

import express from "express";
import {
  runDetection,
  getDetections,
  getDetection,
} from "../controllers/detectionController";
import { authenticate } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/check", authenticate, runDetection);
router.get("/results", authenticate, getDetections);
router.get("/:id", authenticate, getDetection);

export default router;
