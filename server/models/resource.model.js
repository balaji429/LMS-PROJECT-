// Mongoose schema for course resource file metadata.
import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, default: null },
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", default: null, index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  kind: { type: String, enum: ["course-resource", "assignment-submission", "lesson-video"], required: true },
  title: { type: String, required: true, trim: true },
  originalName: { type: String, required: true },
  storedName: { type: String, required: true, unique: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
}, { timestamps: true });

const Resource = mongoose.model("Resource", resourceSchema);
export default Resource;
