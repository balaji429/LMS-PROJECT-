// Database-backed integration coverage for learner and staff workflows.
import "dotenv/config";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import bcrypt from "bcryptjs";

process.env.NODE_ENV = "test";
if (!process.env.TEST_MONGO_URI || !process.env.JWT_SECRET) throw new Error("Set TEST_MONGO_URI and JWT_SECRET before running server tests. Use a dedicated test database.");
process.env.MONGO_URI = process.env.TEST_MONGO_URI;
const uploadDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "smartlearn-test-"));
process.env.UPLOAD_DIR = uploadDirectory;

const { app } = await import("../index.js");
const connectDB = (await import("../database/dbConnect.js")).default;
const mongoose = (await import("mongoose")).default;
const User = (await import("../models/user.model.js")).default;
const Course = (await import("../models/course.model.js")).default;
const Assignment = (await import("../models/assignment.model.js")).default;
const Resource = (await import("../models/resource.model.js")).default;
const { Quiz, QuizAttempt } = await import("../models/quiz.model.js");
const { Announcement, CourseMessage, AccountToken } = await import("../models/communication.model.js");

const marker = `workflow-${crypto.randomUUID()}`;
const password = "Workflow-Test-Password-23!";
let server;
let baseUrl;
let admin;
let teacher;
let student;
let courseId;

before(async () => {
  await connectDB();
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  admin = await User.create({ name: "Workflow Admin", email: `${marker}-admin@example.test`, password: await bcrypt.hash(password, 4), role: "admin" });
});

after(async () => {
  if (courseId) {
    await Promise.all([
      Assignment.deleteMany({ course: courseId }), Resource.deleteMany({ course: courseId }), Quiz.deleteMany({ course: courseId }),
      QuizAttempt.deleteMany({ course: courseId }), Announcement.deleteMany({ course: courseId }), CourseMessage.deleteMany({ course: courseId }),
      Course.deleteOne({ _id: courseId }),
    ]);
  }
  const users = [admin?._id, teacher?._id, student?._id].filter(Boolean);
  if (users.length) await Promise.all([User.deleteMany({ _id: { $in: users } }), AccountToken.deleteMany({ user: { $in: users } })]);
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await fs.rm(uploadDirectory, { recursive: true, force: true });
});

async function request(route, { method = "GET", cookie, body, headers = {} } = {}) {
  const isForm = body instanceof FormData;
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: { ...(cookie ? { cookie } : {}), ...(!isForm && body ? { "content-type": "application/json" } : {}), ...headers },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  const data = response.headers.get("content-type")?.includes("application/json") ? await response.json() : response;
  return { response, data, cookie: response.headers.get("set-cookie")?.split(";")[0] };
}

async function login(email, loginPassword = password) {
  const result = await request("/user/login", { method: "POST", body: { email, password: loginPassword } });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  return result.cookie;
}

test("student, teacher, and admin can complete their main LMS workflows", async () => {
  let result = await request("/user/register", { method: "POST", body: { name: "Workflow Teacher", email: `${marker}-teacher@example.test`, password } });
  assert.equal(result.response.status, 201, JSON.stringify(result.data));
  teacher = await User.findOne({ email: `${marker}-teacher@example.test` });
  assert.ok(teacher);
  result = await request(`/user/${teacher._id}/role`, { method: "PATCH", cookie: await login(admin.email), body: { role: "teacher" } });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));

  result = await request("/user/register", { method: "POST", body: { name: "Workflow Student", email: `${marker}-student@example.test`, password } });
  assert.equal(result.response.status, 201, JSON.stringify(result.data));
  student = await User.findOne({ email: `${marker}-student@example.test` });
  let teacherCookie = await login(teacher.email);
  let studentCookie = await login(student.email);
  const adminCookie = await login(admin.email);

  result = await request("/courses", { method: "POST", cookie: teacherCookie, body: { title: "Workflow Course", description: "Course created for API workflow verification", category: "Testing", level: "Beginner" } });
  assert.equal(result.response.status, 201, JSON.stringify(result.data));
  courseId = result.data.course._id;
  result = await request(`/courses/${courseId}/lessons`, { method: "POST", cookie: teacherCookie, body: { title: "First lesson", moduleTitle: "Module One", content: "Lesson content" } });
  assert.equal(result.response.status, 201, JSON.stringify(result.data));
  const lessonId = result.data.course.lessons[0]._id;
  result = await request(`/courses/${courseId}/lessons/${lessonId}`, { method: "PATCH", cookie: teacherCookie, body: { title: "Updated first lesson", content: "Updated lesson content", order: 0 } });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  assert.equal(result.data.course.lessons[0].title, "Updated first lesson");
  result = await request(`/courses/${courseId}/lessons`, { method: "POST", cookie: teacherCookie, body: { title: "Lesson to remove", content: "Temporary lesson" } });
  assert.equal(result.response.status, 201, JSON.stringify(result.data));
  const removableLessonId = result.data.course.lessons[1]._id;
  result = await request(`/courses/${courseId}`, { method: "PATCH", cookie: teacherCookie, body: { published: true } });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  result = await request(`/courses/${courseId}/enroll`, { method: "POST", cookie: studentCookie });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  result = await request(`/courses/${courseId}/lessons/${lessonId}/complete`, { method: "POST", cookie: studentCookie });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  result = await request(`/courses/${courseId}/lessons/${lessonId}`, { method: "PATCH", cookie: teacherCookie, body: { content: "Edited after completion" } });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  result = await request(`/courses/${courseId}/lessons/${removableLessonId}`, { method: "DELETE", cookie: teacherCookie });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  assert.equal(result.data.course.lessons.length, 1, "deleting one lesson keeps the rest of the course lessons");
  assert.ok((await User.findById(student._id)).completedLessons.some((id) => String(id) === String(lessonId)), "editing/deleting a different lesson preserves student progress");
  result = await request(`/courses/${courseId}`, { cookie: studentCookie });
  assert.equal(result.data.course.lessons.length, 1);
  assert.equal(result.data.course.lessons[0].moduleTitle, "Module One");
  const courseFile = new FormData();
  courseFile.set("title", "Course notes");
  courseFile.set("file", new Blob(["course handout"], { type: "text/plain" }), "handout.txt");
  result = await request(`/courses/${courseId}/resources`, { method: "POST", cookie: teacherCookie, body: courseFile });
  assert.equal(result.response.status, 201, JSON.stringify(result.data));
  const courseResourceId = result.data.resource._id;
  result = await request(`/courses/${courseId}`, { cookie: studentCookie });
  assert.equal(result.data.course.resources[0]._id, courseResourceId);
  result = await request(`/resources/${courseResourceId}/download`, { cookie: studentCookie });
  assert.equal(await result.response.text(), "course handout");

  result = await request(`/assignments/course/${courseId}`, { method: "POST", cookie: teacherCookie, body: { title: "Upload task", description: "Answer the task and attach your work", dueDate: "2030-01-01", questions: [{ prompt: "Explain your solution", answerType: "long" }] } });
  assert.equal(result.response.status, 201, JSON.stringify(result.data));
  const assignmentId = result.data.assignment._id;
  const questionId = result.data.assignment.questions[0]._id;
  result = await request(`/assignments/${assignmentId}`, { method: "PATCH", cookie: teacherCookie, body: { title: "Updated upload task", description: "Updated instructions", dueDate: "2031-01-01" } });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  assert.equal(result.data.assignment.questions[0]._id, questionId, "editing metadata preserves the question IDs used by submissions");
  assert.equal(result.data.assignment.title, "Updated upload task");
  result = await request(`/assignments/${assignmentId}`, { method: "DELETE", cookie: teacherCookie });
  assert.equal(result.response.status, 200, "an assignment without submissions can be deleted");
  result = await request(`/assignments/course/${courseId}`, { method: "POST", cookie: teacherCookie, body: { title: "Upload task", description: "Answer the task and attach your work", dueDate: "2030-01-01", questions: [{ prompt: "Explain your solution", answerType: "long" }] } });
  assert.equal(result.response.status, 201, JSON.stringify(result.data));
  const activeAssignmentId = result.data.assignment._id;
  const file = new FormData();
  file.set("text", "My submission");
  file.set("answers", JSON.stringify([{ questionId: result.data.assignment.questions[0]._id, answer: "Here is my solution." }]));
  file.set("file", new Blob(["hello LMS"], { type: "text/plain" }), "notes.txt");
  result = await request(`/assignments/${activeAssignmentId}/submit`, { method: "POST", cookie: studentCookie, body: file });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  result = await request("/assignments", { cookie: teacherCookie });
  assert.ok(result.data.assignments[0].submissions[0].resource);
  assert.equal(result.data.assignments[0].submissions[0].answers[0].answer, "Here is my solution.");
  const resourceId = result.data.assignments[0].submissions[0].resource._id;
  result = await request(`/resources/${resourceId}/download`, { cookie: teacherCookie });
  assert.equal(result.response.status, 200);
  assert.equal(await result.response.text(), "hello LMS");
  const submissionId = (await Assignment.findById(activeAssignmentId)).submissions[0]._id;
  result = await request(`/assignments/${activeAssignmentId}/submissions/${submissionId}`, { method: "PATCH", cookie: teacherCookie, body: { grade: 92, feedback: "Excellent" } });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  const resubmission = new FormData();
  resubmission.set("answers", JSON.stringify([{ questionId: (await Assignment.findById(activeAssignmentId)).questions[0]._id, answer: "Updated solution." }]));
  result = await request(`/assignments/${activeAssignmentId}/submit`, { method: "POST", cookie: studentCookie, body: resubmission });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  const updatedAssignment = await Assignment.findById(activeAssignmentId);
  assert.equal(updatedAssignment.submissions[0].answers[0].answer, "Updated solution.");
  assert.equal(updatedAssignment.submissions[0].grade, null, "resubmitting clears the prior grade for review");
  const imageSubmission = new FormData();
  imageSubmission.set("answers", JSON.stringify([{ questionId: updatedAssignment.questions[0]._id, answer: "Solution with an image." }]));
  imageSubmission.set("file", new Blob(["image bytes"], { type: "image/png" }), "work.png");
  result = await request(`/assignments/${activeAssignmentId}/submit`, { method: "POST", cookie: studentCookie, body: imageSubmission });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  const imageResource = await Resource.findById((await Assignment.findById(activeAssignmentId)).submissions[0].resource);
  assert.equal(imageResource.originalName, "work.png");
  result = await request(`/resources/${imageResource._id}/download`, { cookie: studentCookie });
  assert.equal(result.response.status, 200);
  assert.equal(await result.response.text(), "image bytes");
  result = await request(`/assignments/${activeAssignmentId}`, { method: "DELETE", cookie: teacherCookie });
  assert.equal(result.response.status, 409, "assignments with learner work cannot be deleted");
  const afterProtectedDelete = await Assignment.findById(activeAssignmentId);
  assert.equal(afterProtectedDelete.submissions.length, 1);
  assert.ok(afterProtectedDelete.submissions[0].resource, "blocking deletion preserves learner attachments and grades");

  const quiz = await request(`/courses/${courseId}/quizzes`, { method: "POST", cookie: teacherCookie, body: { title: "Knowledge check", questions: [{ prompt: "Correct?", options: ["Yes", "No"], answerIndex: 0 }] } });
  assert.equal(quiz.response.status, 201, JSON.stringify(quiz.data));
  const quizId = quiz.data.quiz._id;
  result = await request(`/assignments/quizzes/${quizId}`, { method: "PATCH", cookie: teacherCookie, body: { published: true } });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  result = await request(`/courses/${courseId}`, { cookie: studentCookie });
  assert.equal("answerIndex" in result.data.course.quizzes[0].questions[0], false, "students must not receive quiz answer keys before submission");
  result = await request(`/quizzes/${quizId}/attempt`, { method: "POST", cookie: studentCookie, body: { answers: [0] } });
  assert.equal(result.response.status, 201, JSON.stringify(result.data));
  assert.equal(result.data.attempt.score, 100);

  result = await request(`/courses/${courseId}/announcements`, { method: "POST", cookie: teacherCookie, body: { title: "Course update", body: "Read chapter two." } });
  assert.equal(result.response.status, 201, JSON.stringify(result.data));
  const announcementId = result.data.announcement._id;
  result = await request(`/communication/announcements/${announcementId}`, { method: "PATCH", cookie: teacherCookie, body: { title: "Edited course update", body: "Read the updated chapter." } });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  assert.equal(result.data.announcement.title, "Edited course update");
  result = await request("/communication/announcements", { cookie: studentCookie });
  assert.equal(result.data.announcements[0].title, "Edited course update");
  result = await request(`/communication/announcements/${announcementId}`, { method: "DELETE", cookie: teacherCookie });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  result = await request(`/communication/courses/${courseId}/messages`, { method: "POST", cookie: studentCookie, body: { body: "I have a question." } });
  assert.equal(result.response.status, 201, JSON.stringify(result.data));
  result = await request(`/communication/courses/${courseId}/messages`, { cookie: teacherCookie });
  assert.equal(result.data.messages[0].body, "I have a question.");

  result = await request("/user/me/profile", { method: "PATCH", cookie: studentCookie, body: { name: "Updated Workflow Student" } });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  result = await request("/user/me/password", { method: "PATCH", cookie: studentCookie, body: { currentPassword: password, newPassword: "Changed-Test-Password-42!" } });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  result = await request("/user/me", { cookie: studentCookie });
  assert.equal(result.response.status, 401, "changing a password revokes old sessions");
  const changedPassword = "Changed-Test-Password-42!";
  studentCookie = await login(student.email, changedPassword);
  result = await request("/user", { cookie: teacherCookie });
  assert.equal(result.response.status, 403, "teachers cannot access the admin people API");
  result = await request(`/user/${student._id}/status`, { method: "PATCH", cookie: adminCookie, body: { isActive: false } });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  result = await request("/user/me", { cookie: studentCookie });
  assert.equal(result.response.status, 403, "deactivated users lose access immediately");
  result = await request(`/user/${student._id}/status`, { method: "PATCH", cookie: adminCookie, body: { isActive: true } });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  studentCookie = await login(student.email, changedPassword);
  result = await request("/user/logout", { method: "POST", cookie: studentCookie });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  result = await request("/user/me", { cookie: studentCookie });
  assert.equal(result.response.status, 401, "logout revokes the session token");
});
