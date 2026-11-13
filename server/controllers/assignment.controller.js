// Assignment creation, submission, and grading handlers.
import Assignment from "../models/assignment.model.js";
import Course from "../models/course.model.js";
import User from "../models/user.model.js";
import Resource from "../models/resource.model.js";
import { removeUploadedFile } from "../middleware/upload.js";
import path from "node:path";

const canManage = (course, user) => user.role === "admin" || String(course.instructor) === String(user._id);

export const listAssignments = async (req, res) => {
  const courses = req.user.role === "admin" ? await Course.find().select("_id") : req.user.role === "teacher" ? await Course.find({ instructor: req.user._id }).select("_id") : await Course.find({ _id: { $in: req.user.enrolledCourses } }).select("_id");
  const assignments = await Assignment.find({ course: { $in: courses.map((c) => c._id) } }).populate("course", "title").populate("submissions.student", "name email").populate("submissions.resource", "title originalName").sort({ dueDate: 1 });
  if (req.user.role === "student") {
    for (const assignment of assignments) assignment.submissions = assignment.submissions.filter((submission) => String(submission.student?._id || submission.student) === String(req.user._id));
  }
  res.json({ assignments });
};

export const createAssignment = async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return res.status(404).json({ message: "Course not found." });
  if (!canManage(course, req.user)) return res.status(403).json({ message: "You cannot manage this course." });
  if (!req.body.title?.trim() || !req.body.description?.trim()) return res.status(400).json({ message: "Title and instructions are required." });
  const questions = req.body.questions ?? [];
  if (!Array.isArray(questions) || questions.length > 30 || questions.some((question) => !question.prompt?.trim() || !["short", "long"].includes(question.answerType || "long"))) {
    return res.status(400).json({ message: "Add up to 30 questions or tasks with a prompt and a supported answer type." });
  }
  const assignment = await Assignment.create({ course: course._id, title: req.body.title, description: req.body.description, dueDate: req.body.dueDate || null, questions });
  res.status(201).json({ assignment, message: "Assignment created." });
};

export const updateAssignment = async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ message: "Assignment not found." });
  const course = await Course.findById(assignment.course);
  if (!canManage(course, req.user)) return res.status(403).json({ message: "You cannot edit this assignment." });
  for (const key of ["title", "description"]) {
    if (req.body[key] !== undefined) {
      if (typeof req.body[key] !== "string" || !req.body[key].trim()) return res.status(400).json({ message: "Assignment title and instructions are required." });
      assignment[key] = req.body[key].trim();
    }
  }
  if (req.body.dueDate !== undefined) {
    if (!req.body.dueDate) assignment.dueDate = null;
    else {
      const dueDate = new Date(req.body.dueDate);
      if (Number.isNaN(dueDate.getTime())) return res.status(400).json({ message: "Enter a valid due date." });
      assignment.dueDate = dueDate;
    }
  }
  await assignment.save();
  res.json({ assignment, message: "Assignment updated." });
};

export const deleteAssignment = async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ message: "Assignment not found." });
  const course = await Course.findById(assignment.course);
  if (!canManage(course, req.user)) return res.status(403).json({ message: "You cannot delete this assignment." });
  if (assignment.submissions.length) return res.status(409).json({ message: "This assignment has student submissions. Keep it so submitted work and grades remain available." });
  await assignment.deleteOne();
  res.json({ message: "Assignment deleted." });
};

export const submitAssignment = async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) { if (req.file) removeUploadedFile(req.file.filename); return res.status(404).json({ message: "Assignment not found." }); }
  const user = await User.findById(req.user._id);
  if (!user.enrolledCourses.some((id) => String(id) === String(assignment.course))) { if (req.file) removeUploadedFile(req.file.filename); return res.status(403).json({ message: "Enroll in the course before submitting." }); }
  let submittedAnswers = req.body.answers;
  if (typeof submittedAnswers === "string") {
    try { submittedAnswers = JSON.parse(submittedAnswers); }
    catch { if (req.file) removeUploadedFile(req.file.filename); return res.status(400).json({ message: "Answers could not be read. Please try again." }); }
  }
  const questions = assignment.questions || [];
  let answers = [];
  if (questions.length) {
    if (!Array.isArray(submittedAnswers) || submittedAnswers.length !== questions.length) {
      if (req.file) removeUploadedFile(req.file.filename);
      return res.status(400).json({ message: "Answer every question or task before submitting." });
    }
    answers = [];
    for (const question of questions) {
      const submitted = submittedAnswers.find((answer) => String(answer.questionId) === String(question._id));
      if (!submitted || typeof submitted.answer !== "string" || !submitted.answer.trim()) {
        if (req.file) removeUploadedFile(req.file.filename);
        return res.status(400).json({ message: `Answer this question before submitting: ${question.prompt}` });
      }
      answers.push({ questionId: question._id, answer: submitted.answer.trim().slice(0, 20000) });
    }
  }
  if (!answers.length && !req.body.text?.trim() && !req.file) {
    return res.status(400).json({ message: "Write a response, answer the questions, or attach a file." });
  }
  const prior = assignment.submissions.find((s) => String(s.student) === String(req.user._id));
  let resource;
  if (req.file) resource = await Resource.create({ course: assignment.course, assignment: assignment._id, student: req.user._id, createdBy: req.user._id, kind: "assignment-submission", title: path.parse(req.file.originalname).name, originalName: path.basename(req.file.originalname), storedName: req.file.filename, mimeType: req.file.mimetype, size: req.file.size });
  if (prior) {
    prior.text = req.body.text || "";
    prior.answers = answers;
    prior.submittedAt = new Date();
    prior.grade = null;
    prior.feedback = "";
    if (resource) {
      if (prior.resource) { const oldResource = await Resource.findById(prior.resource); if (oldResource) { removeUploadedFile(oldResource.storedName); await oldResource.deleteOne(); } }
      prior.resource = resource._id;
    }
  } else assignment.submissions.push({ student: req.user._id, text: req.body.text || "", answers, resource: resource?._id || null });
  await assignment.save();
  res.json({ assignment, message: "Submission saved." });
};

export const gradeSubmission = async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ message: "Assignment not found." });
  const course = await Course.findById(assignment.course);
  if (!canManage(course, req.user)) return res.status(403).json({ message: "You cannot grade this course." });
  const submission = assignment.submissions.id(req.params.submissionId);
  if (!submission) return res.status(404).json({ message: "Submission not found." });
  const grade = Number(req.body.grade);
  if (!Number.isFinite(grade) || grade < 0 || grade > 100) return res.status(400).json({ message: "Grade must be between 0 and 100." });
  submission.grade = grade;
  submission.feedback = req.body.feedback || "";
  await assignment.save();
  res.json({ assignment, message: "Submission graded." });
};
