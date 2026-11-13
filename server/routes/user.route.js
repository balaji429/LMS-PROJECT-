// HTTP routes for account and user management operations.
import express from "express";
import { register, login, me, logout, listUsers, changeRole, setUserActive, updateProfile, uploadProfilePhoto, getProfilePhoto, removeProfilePhoto, changePassword, forgotPassword, resetPassword, verifyEmail, resendVerification } from "../controllers/user.controller.js";
import { requireAuth, allowRoles } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { uploadFile } from "../middleware/upload.js";

const router = express.Router();

// Signup route
router.post("/register", rateLimit({ limit: 8 }), register);

// Login route
router.post("/login", rateLimit({ limit: 10 }), login);
router.post("/forgot-password", rateLimit({ limit: 5 }), forgotPassword);
router.post("/reset-password", rateLimit({ limit: 8 }), resetPassword);
router.post("/verify-email", rateLimit({ limit: 12 }), verifyEmail);
router.post("/resend-verification", rateLimit({ limit: 5 }), resendVerification);
router.get("/me", requireAuth, me);
router.patch("/me/profile", requireAuth, updateProfile);
router.post("/me/photo", requireAuth, uploadFile.single("photo"), uploadProfilePhoto);
router.delete("/me/photo", requireAuth, removeProfilePhoto);
router.get("/me/photo", requireAuth, getProfilePhoto);
router.get("/:id/photo", requireAuth, getProfilePhoto);
router.patch("/me/password", requireAuth, rateLimit({ limit: 5 }), changePassword);
router.post("/logout", requireAuth, logout);
router.get("/", requireAuth, allowRoles("admin"), listUsers);
router.patch("/:id/role", requireAuth, allowRoles("admin"), changeRole);
router.patch("/:id/status", requireAuth, allowRoles("admin"), setUserActive);

export default router;
