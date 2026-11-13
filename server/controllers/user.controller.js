// Account, authentication, profile, and recovery request handlers.
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import generateToken from "../utils/generateToken.js";
import { AccountToken } from "../models/communication.model.js";
import { emailConfigured, sendAccountEmail } from "../utils/email.js";
import fs from "node:fs";
import path from "node:path";
import { removeUploadedFile, uploadDirectory } from "../middleware/upload.js";

const frontendUrl = () => (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

async function issueAccountToken(user, purpose) {
  const token = crypto.randomBytes(32).toString("hex");
  await AccountToken.deleteMany({ user: user._id, purpose });
  await AccountToken.create({ user: user._id, purpose, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 60 * 60 * 1000) });
  return token;
}

export const register = async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const { password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ success: false, message: "All fields are required." });
  if (password.length < 8) return res.status(400).json({ success: false, message: "Password must contain at least 8 characters." });
  if (await User.exists({ email })) return res.status(409).json({ success: false, message: "An account already exists for this email." });

  try {
    const configuredBootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
    const hasAdmin = await User.exists({ role: "admin" });
    const role = configuredBootstrapEmail === email && !hasAdmin ? "admin" : "student";
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12), role, emailVerified: !emailConfigured() });
    let verificationUrl;
    if (emailConfigured()) {
      const token = await issueAccountToken(user, "verify-email");
      verificationUrl = `${frontendUrl()}/verify-email?token=${token}`;
      try {
        await sendAccountEmail({ to: email, subject: "Verify your SmartLearn account", text: "Confirm your email address to finish setting up your account.", url: verificationUrl });
      } catch (error) {
        await Promise.all([AccountToken.deleteMany({ user: user._id }), User.deleteOne({ _id: user._id })]);
        console.error("Verification email failed:", error.message);
        return res.status(503).json({ success: false, message: "We could not send the verification email. Please try again." });
      }
    }
    return res.status(201).json({
      success: true,
      message: emailConfigured() ? "Account created. Check your email to verify it before logging in." : "Account created successfully.",
      ...(verificationUrl && process.env.NODE_ENV !== "production" ? { verificationUrl } : {}),
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "An account already exists for this email." });
    console.error("Register error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to register." });
  }
};

export const login = async (req, res) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const { password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: "Email and password are required." });
  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.password)) return res.status(401).json({ success: false, message: "Incorrect email or password." });
  if (!user.isActive) return res.status(403).json({ success: false, message: "This account is inactive. Contact an administrator." });
  if (!user.emailVerified) return res.status(403).json({ success: false, message: "Verify your email before signing in." });
  return generateToken(res, user, `Welcome back ${user.name}`);
};

export const me = (req, res) => res.json({ user: req.user });

export const logout = async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $inc: { authVersion: 1 } });
  return res.clearCookie("token", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  }).json({ success: true, message: "Logged out." });
};

export const updateProfile = async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  if (!name) return res.status(400).json({ message: "Name is required." });
  req.user.name = name;
  if (typeof req.body.photoURL === "string") req.user.photoURL = req.body.photoURL.trim().slice(0, 1000);
  await req.user.save();
  res.json({ user: req.user, message: "Profile updated." });
};

export const uploadProfilePhoto = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Choose an image to upload." });
  if (!req.file.mimetype.startsWith("image/")) {
    removeUploadedFile(req.file.filename);
    return res.status(400).json({ message: "Profile photos must be PNG, JPG, or WebP images." });
  }
  const storedName = `profile-${req.user._id}-${req.file.filename}`;
  await fs.promises.rename(req.file.path, path.join(uploadDirectory, storedName));
  const previousPhoto = req.user.photoURL;
  req.user.photoURL = storedName;
  await req.user.save();
  if (previousPhoto?.startsWith(`profile-${req.user._id}-`)) removeUploadedFile(previousPhoto);
  res.json({ user: req.user, message: "Profile photo updated." });
};

export const getProfilePhoto = async (req, res) => {
  const photoOwner = req.params.id === "me" ? req.user : await User.findById(req.params.id).select("photoURL");
  const storedName = photoOwner?.photoURL;
  if (!storedName || !storedName.startsWith(`profile-${photoOwner._id}-`) || path.basename(storedName) !== storedName) return res.status(404).json({ message: "Profile photo not found." });
  const filePath = path.join(uploadDirectory, storedName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: "Profile photo not found." });
  res.setHeader("Cache-Control", "private, max-age=3600");
  res.sendFile(filePath);
};

export const removeProfilePhoto = async (req, res) => {
  const previousPhoto = req.user.photoURL;
  req.user.photoURL = "";
  await req.user.save();
  if (previousPhoto?.startsWith(`profile-${req.user._id}-`)) removeUploadedFile(previousPhoto);
  res.json({ user: req.user, message: "Profile photo removed." });
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || typeof newPassword !== "string" || newPassword.length < 8) return res.status(400).json({ message: "Enter your current password and a new password with at least 8 characters." });
  const user = await User.findById(req.user._id);
  if (!await bcrypt.compare(currentPassword, user.password)) return res.status(400).json({ message: "Current password is incorrect." });
  user.password = await bcrypt.hash(newPassword, 12);
  user.authVersion += 1;
  await user.save();
  return generateToken(res, user, "Password changed successfully.");
};

export const verifyEmail = async (req, res) => {
  const tokenHash = hashToken(req.body.token || "");
  const token = await AccountToken.findOneAndDelete({ purpose: "verify-email", tokenHash, expiresAt: { $gt: new Date() } });
  if (!token) return res.status(400).json({ message: "This verification link is invalid or expired." });
  await User.updateOne({ _id: token.user }, { $set: { emailVerified: true } });
  res.json({ message: "Email verified. You can now sign in." });
};

export const resendVerification = async (req, res) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const user = await User.findOne({ email, emailVerified: false });
  if (user && emailConfigured()) {
    const token = await issueAccountToken(user, "verify-email");
    const url = `${frontendUrl()}/verify-email?token=${token}`;
    await sendAccountEmail({ to: email, subject: "Verify your SmartLearn account", text: "Confirm your email address to activate your account.", url });
  }
  res.json({ message: "If the account needs verification, a new link has been sent." });
};

export const forgotPassword = async (req, res) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const user = await User.findOne({ email, isActive: { $ne: false } });
  let resetUrl;
  if (user) {
    const token = await issueAccountToken(user, "reset-password");
    resetUrl = `${frontendUrl()}/reset-password?token=${token}`;
    await sendAccountEmail({ to: email, subject: "Reset your SmartLearn password", text: "Use this one-time link to reset your password.", url: resetUrl });
  }
  res.json({
    message: "If an account exists for that email, password reset instructions have been sent.",
    ...(user && process.env.NODE_ENV !== "production" && !emailConfigured() ? { resetUrl } : {}),
  });
};

export const resetPassword = async (req, res) => {
  const { token: rawToken, password } = req.body;
  if (typeof password !== "string" || password.length < 8) return res.status(400).json({ message: "Password must contain at least 8 characters." });
  const token = await AccountToken.findOneAndDelete({ purpose: "reset-password", tokenHash: hashToken(rawToken || ""), expiresAt: { $gt: new Date() } });
  if (!token) return res.status(400).json({ message: "This password reset link is invalid or expired." });
  const user = await User.findById(token.user);
  if (!user || !user.isActive) return res.status(400).json({ message: "This password reset link is invalid or expired." });
  user.password = await bcrypt.hash(password, 12);
  user.authVersion += 1;
  await Promise.all([user.save(), AccountToken.deleteMany({ user: user._id })]);
  res.json({ message: "Password reset. Sign in with your new password." });
};

export const listUsers = async (_req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json({ users });
};

export const changeRole = async (req, res) => {
  const { role } = req.body;
  if (!["student", "teacher", "admin"].includes(role)) return res.status(400).json({ message: "Invalid role." });
  if (String(req.user._id) === req.params.id && role !== "admin") return res.status(400).json({ message: "You cannot remove your own admin role." });
  const target = await User.findById(req.params.id).select("role");
  if (!target) return res.status(404).json({ message: "User not found." });
  if (target.role === "admin" && role !== "admin" && await User.countDocuments({ role: "admin", isActive: { $ne: false } }) <= 1) return res.status(400).json({ message: "Keep at least one active administrator." });
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { returnDocument: "after", runValidators: true }).select("-password");
  res.json({ user, message: "Role updated." });
};

export const setUserActive = async (req, res) => {
  if (typeof req.body.isActive !== "boolean") return res.status(400).json({ message: "isActive must be true or false." });
  if (String(req.user._id) === req.params.id && req.body.isActive === false) return res.status(400).json({ message: "You cannot deactivate your own account." });
  const target = await User.findById(req.params.id).select("role isActive");
  if (!target) return res.status(404).json({ message: "User not found." });
  if (target.role === "admin" && req.body.isActive === false && target.isActive !== false && await User.countDocuments({ role: "admin", isActive: { $ne: false } }) <= 1) return res.status(400).json({ message: "Keep at least one active administrator." });
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { returnDocument: "after" }).select("-password");
  if (!user.isActive) await User.updateOne({ _id: user._id }, { $inc: { authVersion: 1 } });
  res.json({ user, message: user.isActive ? "Account activated." : "Account deactivated." });
};
