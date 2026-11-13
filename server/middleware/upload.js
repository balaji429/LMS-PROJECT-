// Validated local file upload configuration and storage.
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";

export const uploadDirectory = path.resolve(process.env.UPLOAD_DIR || "./uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedTypes = new Map([
  ["application/pdf", ".pdf"],
  ["text/plain", ".txt"],
  ["text/csv", ".csv"],
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"],
  ["application/vnd.openxmlformats-officedocument.presentationml.presentation", ".pptx"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".xlsx"],
]);

const allowedVideoTypes = new Map([
  ["video/mp4", ".mp4"],
  ["video/webm", ".webm"],
  ["video/ogg", ".ogv"],
  ["video/quicktime", ".mov"],
]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => callback(null, `${crypto.randomUUID()}${allowedTypes.get(file.mimetype) || allowedVideoTypes.get(file.mimetype) || ".bin"}`),
});

export const uploadFile = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_UPLOAD_MB || 20) * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      const error = new Error("Unsupported file type. Upload PDF, Office, text, CSV, or image files.");
      error.status = 400;
      return callback(error);
    }
    callback(null, true);
  },
});

// Lesson videos have a separate limit because they are much larger than documents.
export const uploadLessonVideo = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_VIDEO_MB || 500) * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedVideoTypes.has(file.mimetype)) {
      const error = new Error("Unsupported video type. Upload MP4, WebM, OGG, or MOV.");
      error.status = 400;
      return callback(error);
    }
    callback(null, true);
  },
});

export const removeUploadedFile = (storedName) => {
  if (!storedName || path.basename(storedName) !== storedName) return;
  fs.promises.unlink(path.join(uploadDirectory, storedName)).catch(() => {});
};
