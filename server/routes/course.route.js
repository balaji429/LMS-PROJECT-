// HTTP routes for course, lesson, and enrollment operations.
import express from "express";
import { requireAuth, allowRoles } from "../middleware/auth.js";
import { listCourses, listLearners, getCourse, listCourseStudents, createCourse, updateCourse, deleteCourse, addLesson, updateLesson, deleteLesson, uploadCourseResource, deleteCourseResource, enroll, markLessonComplete } from "../controllers/course.controller.js";
import { listQuizzes, createQuiz } from "../controllers/quiz.controller.js";
import { createAnnouncement } from "../controllers/communication.controller.js";
import { uploadFile } from "../middleware/upload.js";

const router = express.Router();
router.use(requireAuth);
router.get("/", listCourses);
router.get("/students", allowRoles("teacher", "admin"), listLearners);
router.get("/:id", getCourse);
router.get("/:id/students", allowRoles("teacher", "admin"), listCourseStudents);
router.get("/:courseId/quizzes", listQuizzes);
router.post("/:courseId/quizzes", allowRoles("teacher", "admin"), createQuiz);
router.post("/:courseId/announcements", allowRoles("teacher", "admin"), createAnnouncement);
router.post("/", allowRoles("teacher", "admin"), createCourse);
router.patch("/:id", allowRoles("teacher", "admin"), updateCourse);
router.delete("/:id", allowRoles("teacher", "admin"), deleteCourse);
router.post("/:id/lessons", allowRoles("teacher", "admin"), addLesson);
router.patch("/:id/lessons/:lessonId", allowRoles("teacher", "admin"), updateLesson);
router.delete("/:id/lessons/:lessonId", allowRoles("teacher", "admin"), deleteLesson);
router.post("/:id/resources", allowRoles("teacher", "admin"), uploadFile.single("file"), uploadCourseResource);
router.delete("/:id/resources/:resourceId", allowRoles("teacher", "admin"), deleteCourseResource);
router.post("/:id/enroll", allowRoles("student"), enroll);
router.post("/:id/lessons/:lessonId/complete", allowRoles("student"), markLessonComplete);
export default router;
