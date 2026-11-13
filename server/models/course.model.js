// Mongoose schemas for courses, lessons, and learner progress.
import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  moduleTitle: { type: String, default: "Course lessons", trim: true },
  videoUrl: { type: String, default: "" },
  videoResourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  content: { type: String, default: "" },
  order: { type: Number, default: 0 },
}, { timestamps: true });

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, default: "General", trim: true },
  level: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
  published: { type: Boolean, default: false },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lessons: [lessonSchema],
}, { timestamps: true });

const Course = mongoose.model("Course", courseSchema);
export default Course;
