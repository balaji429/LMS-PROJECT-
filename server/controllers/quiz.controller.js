// Quiz management, attempts, and scoring handlers.
import Course from "../models/course.model.js";
import User from "../models/user.model.js";
import { Quiz, QuizAttempt } from "../models/quiz.model.js";

const owns = (course, user) => user.role === "admin" || String(course.instructor) === String(user._id);
const enrolled = (courseId, user) => user.enrolledCourses.some((id) => String(id) === String(courseId));

const clientQuiz = (quiz, showAnswers) => {
  const value = quiz.toObject ? quiz.toObject() : quiz;
  if (!showAnswers) value.questions = value.questions.map(({ prompt, options, _id }) => ({ _id, prompt, options }));
  return value;
};

export const listQuizzes = async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course || (!course.published && !owns(course, req.user))) return res.status(404).json({ message: "Course not found." });
  if (req.user.role === "student" && !enrolled(course._id, req.user)) return res.status(403).json({ message: "Enroll in this course to access its quizzes." });
  const quizzes = await Quiz.find({ course: course._id, ...(req.user.role === "student" ? { published: true } : {}) }).sort({ createdAt: 1 });
  res.json({ quizzes: quizzes.map((quiz) => clientQuiz(quiz, req.user.role !== "student")) });
};

export const createQuiz = async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return res.status(404).json({ message: "Course not found." });
  if (!owns(course, req.user)) return res.status(403).json({ message: "You cannot manage this course." });
  const { title, instructions = "", questions } = req.body;
  if (!title?.trim() || !Array.isArray(questions) || questions.length < 1 || questions.length > 50) return res.status(400).json({ message: "Add a title and between 1 and 50 questions." });
  for (const [index, question] of questions.entries()) {
    if (!question.prompt?.trim() || !Array.isArray(question.options) || question.options.length < 2 || question.options.length > 6 || question.options.some((item) => !String(item).trim()) || !Number.isInteger(question.answerIndex) || question.answerIndex < 0 || question.answerIndex >= question.options.length) {
      return res.status(400).json({ message: `Question ${index + 1} needs a prompt, 2–6 choices, and one correct choice.` });
    }
  }
  const quiz = await Quiz.create({ course: course._id, title, instructions, questions, createdBy: req.user._id });
  res.status(201).json({ quiz: clientQuiz(quiz, true), message: "Quiz created as a draft." });
};

export const updateQuiz = async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ message: "Quiz not found." });
  const course = await Course.findById(quiz.course);
  if (!owns(course, req.user)) return res.status(403).json({ message: "You cannot manage this quiz." });
  if (typeof req.body.published === "boolean") quiz.published = req.body.published;
  await quiz.save();
  res.json({ quiz: clientQuiz(quiz, true), message: quiz.published ? "Quiz published." : "Quiz unpublished." });
};

export const submitQuizAttempt = async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz || !quiz.published) return res.status(404).json({ message: "Quiz not found." });
  const user = await User.findById(req.user._id);
  if (!enrolled(quiz.course, user)) return res.status(403).json({ message: "Enroll in the course before taking this quiz." });
  const answers = req.body.answers;
  if (!Array.isArray(answers) || answers.length !== quiz.questions.length || answers.some((answer, index) => !Number.isInteger(answer) || answer < 0 || answer >= quiz.questions[index].options.length)) return res.status(400).json({ message: "Submit one valid answer for every question." });
  const correctCount = answers.reduce((count, answer, index) => count + Number(answer === quiz.questions[index].answerIndex), 0);
  const attempt = await QuizAttempt.create({ quiz: quiz._id, course: quiz.course, student: user._id, answers, correctCount, totalQuestions: quiz.questions.length, score: Math.round(correctCount / quiz.questions.length * 100) });
  res.status(201).json({
    attempt,
    results: quiz.questions.map((question, index) => ({ prompt: question.prompt, selectedIndex: answers[index], correctIndex: question.answerIndex, correct: answers[index] === question.answerIndex, explanation: question.explanation })),
    message: `Quiz submitted. You scored ${attempt.score}%.`,
  });
};

export const listQuizAttempts = async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ message: "Quiz not found." });
  const course = await Course.findById(quiz.course);
  const isOwner = owns(course, req.user);
  if (req.user.role !== "student" && !isOwner) return res.status(403).json({ message: "You cannot view these results." });
  const attempts = await QuizAttempt.find({ quiz: quiz._id, ...(!isOwner ? { student: req.user._id } : {}) }).populate("student", "name email").sort({ completedAt: -1 });
  res.json({ attempts });
};
