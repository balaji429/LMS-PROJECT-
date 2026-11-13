// HTTP routes for assignment and submission operations.
import express from "express";
import { requireAuth, allowRoles } from "../middleware/auth.js";
import { listAssignments, createAssignment, updateAssignment, deleteAssignment, submitAssignment, gradeSubmission } from "../controllers/assignment.controller.js";
import { uploadFile } from "../middleware/upload.js";
import { listQuizAttempts, updateQuiz } from "../controllers/quiz.controller.js";

const router = express.Router();
router.use(requireAuth);
router.get("/", listAssignments);
router.post("/course/:courseId", allowRoles("teacher", "admin"), createAssignment);
router.patch("/:id", allowRoles("teacher", "admin"), updateAssignment);
router.delete("/:id", allowRoles("teacher", "admin"), deleteAssignment);
router.post("/:id/submit", allowRoles("student"), uploadFile.single("file"), submitAssignment);
router.patch("/:id/submissions/:submissionId", allowRoles("teacher", "admin"), gradeSubmission);
router.patch("/quizzes/:id", allowRoles("teacher", "admin"), updateQuiz);
router.get("/quizzes/:id/attempts", listQuizAttempts);
export default router;
