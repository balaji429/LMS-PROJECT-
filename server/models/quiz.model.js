// Mongoose schemas for quizzes and learner attempts.
import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  prompt: { type: String, required: true, trim: true },
  options: { type: [String], validate: (items) => items.length >= 2 && items.length <= 6 },
  answerIndex: { type: Number, required: true, min: 0 },
  explanation: { type: String, default: "" },
}, { _id: true });

const quizSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  title: { type: String, required: true, trim: true },
  instructions: { type: String, default: "" },
  questions: { type: [questionSchema], validate: (items) => items.length > 0 },
  published: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export const Quiz = mongoose.model("Quiz", quizSchema);

const quizAttemptSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  answers: [{ type: Number }],
  score: { type: Number, min: 0, max: 100, required: true },
  correctCount: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  completedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);
