// Mongoose schemas for assignments and student submissions.
import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, default: "", trim: true },
  answers: [{ questionId: mongoose.Schema.Types.ObjectId, answer: { type: String, trim: true } }],
  submittedAt: { type: Date, default: Date.now },
  grade: { type: Number, min: 0, max: 100, default: null },
  feedback: { type: String, default: "" },
  resource: { type: mongoose.Schema.Types.ObjectId, ref: "Resource", default: null },
}, { timestamps: true });

const questionSchema = new mongoose.Schema({
  prompt: { type: String, required: true, trim: true },
  answerType: { type: String, enum: ["short", "long"], default: "long" },
}, { _id: true });

const assignmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  dueDate: { type: Date, default: null },
  questions: { type: [questionSchema], default: [] },
  submissions: [submissionSchema],
}, { timestamps: true });

const Assignment = mongoose.model("Assignment", assignmentSchema);
export default Assignment;
