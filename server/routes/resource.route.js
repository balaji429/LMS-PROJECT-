// HTTP routes for authenticated course resource downloads.
import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { downloadResource, streamLessonVideo } from "../controllers/course.controller.js";

const router = express.Router();
router.get("/:id/video", requireAuth, streamLessonVideo);
router.get("/:id/download", requireAuth, downloadResource);
export default router;
