// HTTP routes for announcements and course discussions.
import express from "express";
import { requireAuth, allowRoles } from "../middleware/auth.js";
import { createMessage, deleteAnnouncement, updateAnnouncement, listAnnouncements, listMessages } from "../controllers/communication.controller.js";

const router = express.Router();
router.use(requireAuth);
router.get("/announcements", listAnnouncements);
router.patch("/announcements/:id", allowRoles("teacher", "admin"), updateAnnouncement);
router.delete("/announcements/:id", allowRoles("teacher", "admin"), deleteAnnouncement);
router.get("/courses/:courseId/messages", listMessages);
router.post("/courses/:courseId/messages", createMessage);
export default router;
