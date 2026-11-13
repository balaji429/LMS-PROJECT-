// Course, lesson, enrollment, progress, and resource handlers.
import Course from "../models/course.model.js";
import User from "../models/user.model.js";
import Assignment from "../models/assignment.model.js";
import Resource from "../models/resource.model.js";
import { removeUploadedFile, uploadDirectory } from "../middleware/upload.js";
import path from "node:path";
import { Announcement, CourseMessage } from "../models/communication.model.js";
import { Quiz, QuizAttempt } from "../models/quiz.model.js";

const owns = (course, user) => user.role === "admin" || String(course.instructor?._id || course.instructor) === String(user._id);

export const listCourses = async (req, res) => {
  const query = req.user.role === "admin" ? {} : req.user.role === "teacher" ? { instructor: req.user._id } : { published: true };
  const courses = await Course.find(query).populate("instructor", "name email").sort({ updatedAt: -1 });
  const enrollmentCounts = await User.aggregate([
    { $match: { role: "student" } },
    { $unwind: "$enrolledCourses" },
    { $group: { _id: "$enrolledCourses", count: { $sum: 1 } } },
  ]);
  const countByCourse = new Map(enrollmentCounts.map((entry) => [String(entry._id), entry.count]));
  for (const course of courses) course.set("enrollmentCount", countByCourse.get(String(course._id)) || 0, { strict: false });
  for (const course of courses) course.set("lessonCount", course.lessons.length, { strict: false });
  const resourceCounts = await Resource.aggregate([{ $match: { kind: "course-resource" } }, { $group: { _id: "$course", count: { $sum: 1 } } }]);
  const resourceCountByCourse = new Map(resourceCounts.map((entry) => [String(entry._id), entry.count]));
  for (const course of courses) course.set("resourceCount", resourceCountByCourse.get(String(course._id)) || 0, { strict: false });
  if (req.user.role === "student") {
    const enrolled = new Set(req.user.enrolledCourses.map((id) => String(id)));
    for (const course of courses) if (!enrolled.has(String(course._id))) course.lessons = [];
  }
  res.json({ courses });
};

export const listLearners = async (req, res) => {
  const courseQuery = req.user.role === "admin" ? {} : { instructor: req.user._id };
  const courses = await Course.find(courseQuery).select("title instructor lessons");
  const byId = new Map(courses.map((course) => [String(course._id), course]));
  const students = await User.find({ role: "student", enrolledCourses: { $in: courses.map((course) => course._id) } })
    .select("name email enrolledCourses completedLessons createdAt").sort({ name: 1 });
  const learners = [];
  for (const student of students) {
    for (const courseId of student.enrolledCourses) {
      const course = byId.get(String(courseId));
      if (!course) continue;
      const lessonIds = new Set(course.lessons.map((lesson) => String(lesson._id)));
      learners.push({
        _id: student._id,
        name: student.name,
        email: student.email,
        courseId: course._id,
        courseTitle: course.title,
        completedLessons: student.completedLessons.filter((id) => lessonIds.has(String(id))).length,
        totalLessons: course.lessons.length,
        memberSince: student.createdAt,
      });
    }
  }
  res.json({ learners });
};

export const getCourse = async (req, res) => {
  const course = await Course.findById(req.params.id).populate("instructor", "name email");
  if (!course) return res.status(404).json({ message: "Course not found." });
  course.set("lessonCount", course.lessons.length, { strict: false });
  if (!course.published && !owns(course, req.user)) return res.status(403).json({ message: "This course is not published." });
  if (req.user.role === "student" && !req.user.enrolledCourses.some((id) => String(id) === String(course._id))) course.lessons = [];
  const canViewContent = req.user.role === "admin" || owns(course, req.user) || req.user.enrolledCourses.some((id) => String(id) === String(course._id));
  course.set("resources", canViewContent ? await Resource.find({ course: course._id, kind: "course-resource" }).select("title originalName mimeType size lessonId createdAt") : [], { strict: false });
  const quizzes = canViewContent ? await Quiz.find({ course: course._id, ...(req.user.role === "student" ? { published: true } : {}) }).sort({ createdAt: 1 }) : [];
  course.set("quizzes", quizzes.map((quiz) => {
    const data = quiz.toObject();
    if (req.user.role === "student") data.questions = data.questions.map(({ prompt, options, _id }) => ({ _id, prompt, options }));
    return data;
  }), { strict: false });
  course.set("announcements", canViewContent ? await Announcement.find({ course: course._id }).populate("author", "name").sort({ createdAt: -1 }).limit(20) : [], { strict: false });
  res.json({ course });
};

export const uploadCourseResource = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) { if (req.file) removeUploadedFile(req.file.filename); return res.status(404).json({ message: "Course not found." }); }
  if (!owns(course, req.user)) { if (req.file) removeUploadedFile(req.file.filename); return res.status(403).json({ message: "You cannot add resources to this course." }); }
  if (!req.file) return res.status(400).json({ message: "Choose a file to upload." });
  const lessonId = req.body.lessonId || null;
  if (lessonId && !course.lessons.id(lessonId)) { removeUploadedFile(req.file.filename); return res.status(400).json({ message: "Choose a lesson in this course." }); }
  const resource = await Resource.create({
    course: course._id, lessonId, createdBy: req.user._id, kind: "course-resource",
    title: req.body.title?.trim() || path.parse(req.file.originalname).name,
    originalName: path.basename(req.file.originalname), storedName: req.file.filename,
    mimeType: req.file.mimetype, size: req.file.size,
  });
  res.status(201).json({ resource, message: "Course resource uploaded." });
};

export const deleteCourseResource = async (req, res) => {
  const resource = await Resource.findOne({ _id: req.params.resourceId, course: req.params.id, kind: "course-resource" });
  if (!resource) return res.status(404).json({ message: "Resource not found." });
  const course = await Course.findById(resource.course);
  if (!course || !owns(course, req.user)) return res.status(403).json({ message: "You cannot delete this resource." });
  await resource.deleteOne();
  removeUploadedFile(resource.storedName);
  res.json({ message: "Resource deleted." });
};

export const downloadResource = async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) return res.status(404).json({ message: "File not found." });
  const course = await Course.findById(resource.course);
  if (!course) return res.status(404).json({ message: "Course not found." });
  if (resource.kind === "assignment-submission") {
    if (req.user.role === "student" && String(resource.student) !== String(req.user._id)) return res.status(403).json({ message: "You cannot download this submission." });
    if (req.user.role !== "student" && !owns(course, req.user)) return res.status(403).json({ message: "You cannot download this submission." });
  } else if (req.user.role === "student") {
    if (!req.user.enrolledCourses.some((id) => String(id) === String(course._id))) return res.status(403).json({ message: "Enroll in the course to access this file." });
  } else if (!owns(course, req.user)) return res.status(403).json({ message: "You cannot access this file." });
  res.download(path.join(uploadDirectory, resource.storedName), path.basename(resource.originalName), (error) => {
    if (error && !res.headersSent) res.status(404).json({ message: "File not found on the server." });
  });
};

export const listCourseStudents = async (req, res) => {
  const course = await Course.findById(req.params.id).select("instructor title lessons");
  if (!course) return res.status(404).json({ message: "Course not found." });
  if (!owns(course, req.user)) return res.status(403).json({ message: "You cannot view this course roster." });
  const students = await User.find({ role: "student", enrolledCourses: course._id }).select("name email completedLessons createdAt").sort({ name: 1 });
  const lessonIds = new Set(course.lessons.map((lesson) => String(lesson._id)));
  res.json({ students: students.map((student) => {
    const completed = student.completedLessons.filter((id) => lessonIds.has(String(id))).length;
    return { _id: student._id, name: student.name, email: student.email, memberSince: student.createdAt, completedLessons: completed, totalLessons: course.lessons.length };
  }) });
};

export const createCourse = async (req, res) => {
  const { title, description, category, level } = req.body;
  if (!title?.trim() || !description?.trim()) return res.status(400).json({ message: "Title and description are required." });
  let instructor = req.user._id;
  if (req.user.role === "admin" && req.body.instructorId) {
    const teacher = await User.findOne({ _id: req.body.instructorId, role: "teacher", isActive: { $ne: false } }).select("_id");
    if (!teacher) return res.status(400).json({ message: "Choose an active teacher for this course." });
    instructor = teacher._id;
  }
  const course = await Course.create({ title, description, category, level, instructor });
  res.status(201).json({ course, message: "Course created." });
};

export const updateCourse = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found." });
  if (!owns(course, req.user)) return res.status(403).json({ message: "You cannot edit this course." });
  for (const key of ["title", "description", "category", "level", "published"]) if (req.body[key] !== undefined) course[key] = req.body[key];
  if (req.body.instructorId !== undefined && req.user.role === "admin") {
    const teacher = await User.findOne({ _id: req.body.instructorId, role: "teacher", isActive: { $ne: false } }).select("_id");
    if (!teacher) return res.status(400).json({ message: "Choose an active teacher for this course." });
    course.instructor = teacher._id;
  }
  await course.save();
  res.json({ course, message: "Course updated." });
};

export const deleteCourse = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found." });
  if (!owns(course, req.user)) return res.status(403).json({ message: "You cannot delete this course." });
  const resources = await Resource.find({ course: course._id }).select("storedName");
  await Promise.all([
    Course.deleteOne({ _id: course._id }), Assignment.deleteMany({ course: course._id }), Resource.deleteMany({ course: course._id }),
    Quiz.deleteMany({ course: course._id }), QuizAttempt.deleteMany({ course: course._id }),
    Announcement.deleteMany({ course: course._id }), CourseMessage.deleteMany({ course: course._id }),
    User.updateMany({}, { $pull: { enrolledCourses: course._id, completedLessons: { $in: course.lessons.map((lesson) => lesson._id) } } }),
  ]);
  for (const resource of resources) removeUploadedFile(resource.storedName);
  res.json({ message: "Course deleted." });
};

export const addLesson = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found." });
  if (!owns(course, req.user)) return res.status(403).json({ message: "You cannot edit this course." });
  if (!req.body.title?.trim()) return res.status(400).json({ message: "Lesson title is required." });
  course.lessons.push({ title: req.body.title, moduleTitle: req.body.moduleTitle, description: req.body.description, content: req.body.content, videoUrl: req.body.videoUrl, order: course.lessons.length });
  await course.save();
  res.status(201).json({ course, message: "Lesson added." });
};

export const updateLesson = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found." });
  if (!owns(course, req.user)) return res.status(403).json({ message: "You cannot edit this course." });
  const lesson = course.lessons.id(req.params.lessonId);
  if (!lesson) return res.status(404).json({ message: "Lesson not found." });
  if (req.body.title !== undefined) {
    if (typeof req.body.title !== "string" || !req.body.title.trim()) return res.status(400).json({ message: "Lesson title is required." });
    lesson.title = req.body.title.trim();
  }
  for (const key of ["moduleTitle", "description", "content", "videoUrl"]) {
    if (req.body[key] !== undefined) lesson[key] = String(req.body[key]).trim();
  }
  if (req.body.order !== undefined) {
    const order = Number(req.body.order);
    if (!Number.isInteger(order) || order < 0) return res.status(400).json({ message: "Lesson order must be a non-negative whole number." });
    lesson.order = order;
  }
  course.lessons.sort((left, right) => left.order - right.order);
  await course.save();
  res.json({ course, message: "Lesson updated." });
};

export const deleteLesson = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found." });
  if (!owns(course, req.user)) return res.status(403).json({ message: "You cannot edit this course." });
  const lesson = course.lessons.id(req.params.lessonId);
  if (!lesson) return res.status(404).json({ message: "Lesson not found." });
  const lessonId = lesson._id;
  const resources = await Resource.find({ course: course._id, lessonId }).select("storedName");
  lesson.deleteOne();
  course.lessons.forEach((item, index) => { item.order = index; });
  await Promise.all([
    course.save(),
    User.updateMany({}, { $pull: { completedLessons: lessonId } }),
    Resource.deleteMany({ course: course._id, lessonId }),
  ]);
  for (const resource of resources) removeUploadedFile(resource.storedName);
  res.json({ course, message: "Lesson deleted." });
};

export const enroll = async (req, res) => {
  const course = await Course.findOne({ _id: req.params.id, published: true });
  if (!course) return res.status(404).json({ message: "Published course not found." });
  await User.updateOne({ _id: req.user._id }, { $addToSet: { enrolledCourses: course._id } });
  res.json({ message: "Enrolled successfully." });
};

export const markLessonComplete = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course || !course.lessons.id(req.params.lessonId)) return res.status(404).json({ message: "Lesson not found." });
  const user = await User.findById(req.user._id);
  if (!user.enrolledCourses.some((id) => String(id) === String(course._id))) return res.status(403).json({ message: "Enroll in this course first." });
  await User.updateOne({ _id: user._id }, { $addToSet: { completedLessons: req.params.lessonId } });
  res.json({ message: "Progress saved." });
};
