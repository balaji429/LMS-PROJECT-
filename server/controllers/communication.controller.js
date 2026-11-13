// Announcement and course discussion request handlers.
import Course from "../models/course.model.js";
import { Announcement, CourseMessage } from "../models/communication.model.js";

const canAccess = (course, user) => user.role === "admin" || String(course.instructor) === String(user._id) || (user.role === "student" && user.enrolledCourses.some((id) => String(id) === String(course._id)));
const canManage = (course, user) => Boolean(course) && (user.role === "admin" || String(course.instructor) === String(user._id));

export const listAnnouncements = async (req, res) => {
  const courses = req.user.role === "admin" ? await Course.find().select("_id") : req.user.role === "teacher" ? await Course.find({ instructor: req.user._id }).select("_id") : await Course.find({ _id: { $in: req.user.enrolledCourses } }).select("_id");
  const announcements = await Announcement.find({ course: { $in: courses.map((course) => course._id) } }).populate("course", "title").populate("author", "name role").sort({ createdAt: -1 }).limit(100);
  res.json({ announcements });
};

export const createAnnouncement = async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return res.status(404).json({ message: "Course not found." });
  if (!canManage(course, req.user)) return res.status(403).json({ message: "You cannot post announcements for this course." });
  const { title, body } = req.body;
  if (!title?.trim() || !body?.trim()) return res.status(400).json({ message: "Announcement title and message are required." });
  const announcement = await Announcement.create({ course: course._id, author: req.user._id, title, body });
  res.status(201).json({ announcement, message: "Announcement posted." });
};

export const deleteAnnouncement = async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) return res.status(404).json({ message: "Announcement not found." });
  const course = await Course.findById(announcement.course);
  if (!canManage(course, req.user) || (req.user.role !== "admin" && String(announcement.author) !== String(req.user._id))) return res.status(403).json({ message: "You can manage only your own announcements." });
  await announcement.deleteOne();
  res.json({ message: "Announcement deleted." });
};

export const updateAnnouncement = async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) return res.status(404).json({ message: "Announcement not found." });
  const course = await Course.findById(announcement.course);
  if (!canManage(course, req.user) || (req.user.role !== "admin" && String(announcement.author) !== String(req.user._id))) return res.status(403).json({ message: "You can manage only your own announcements." });
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  const body = typeof req.body.body === "string" ? req.body.body.trim() : "";
  if (!title || !body) return res.status(400).json({ message: "Announcement title and message are required." });
  announcement.title = title;
  announcement.body = body;
  await announcement.save();
  await announcement.populate("course", "title");
  await announcement.populate("author", "name role");
  res.json({ announcement, message: "Announcement updated." });
};

export const listMessages = async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return res.status(404).json({ message: "Course not found." });
  if (!canAccess(course, req.user)) return res.status(403).json({ message: "Enroll in this course to join its discussion." });
  const messages = await CourseMessage.find({ course: course._id }).populate("sender", "name role photoURL").sort({ createdAt: 1 }).limit(300);
  res.json({ messages });
};

export const createMessage = async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course || !canAccess(course, req.user)) return res.status(403).json({ message: "Enroll in this course to join its discussion." });
  const body = typeof req.body.body === "string" ? req.body.body.trim() : "";
  if (!body) return res.status(400).json({ message: "Write a message before sending." });
  const message = await CourseMessage.create({ course: course._id, sender: req.user._id, body });
  await message.populate("sender", "name role photoURL");
  res.status(201).json({ data: message, message: "Message sent." });
};
