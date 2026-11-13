// HTTP routes for quiz management and student attempts.
import express from "express";
import { requireAuth, allowRoles } from "../middleware/auth.js";
import { submitQuizAttempt } from "../controllers/quiz.controller.js";

const router = express.Router();
router.use(requireAuth);
router.post("/:id/attempt", allowRoles("student"), submitQuizAttempt);
export default router;
