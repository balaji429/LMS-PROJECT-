// Mongoose schemas for announcements and course discussions.
import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true, trim: true },
}, { timestamps: true });

export const Announcement = mongoose.model("Announcement", announcementSchema);

const messageSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  body: { type: String, required: true, trim: true, maxlength: 5000 },
}, { timestamps: true });

export const CourseMessage = mongoose.model("CourseMessage", messageSchema);

const accountTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  purpose: { type: String, enum: ["verify-email", "reset-password"], required: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });
accountTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const AccountToken = mongoose.model("AccountToken", accountTokenSchema);
