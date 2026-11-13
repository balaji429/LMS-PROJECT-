// Express API entry point, middleware setup, and route registration.
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./database/dbConnect.js";
import userRoute from "./routes/user.route.js";
import courseRoute from "./routes/course.route.js";
import assignmentRoute from "./routes/assignment.route.js";
import quizRoute from "./routes/quiz.route.js";
import communicationRoute from "./routes/communication.route.js";
import resourceRoute from "./routes/resource.route.js";
import { rateLimit } from "./middleware/rateLimit.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 8080;
const configuredClient = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = new Set([configuredClient]);
if (process.env.NODE_ENV !== "production") {
    allowedOrigins.add("http://localhost:5173");
    allowedOrigins.add("http://127.0.0.1:5173");
}

// Middleware
app.disable("x-powered-by");
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (process.env.NODE_ENV === "production") res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
});

app.use(cors({
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)),
    credentials: true
}));
app.use((req, res, next) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && req.headers.origin && !allowedOrigins.has(req.headers.origin)) {
        return res.status(403).json({ message: "Request origin is not allowed." });
    }
    next();
});
app.use(express.json({ limit: "1mb" }));
app.use("/api/v1", rateLimit({ windowMs: 60 * 1000, limit: 300 }));

// User Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/courses", courseRoute);
app.use("/api/v1/assignments", assignmentRoute);
app.use("/api/v1/quizzes", quizRoute);
app.use("/api/v1/communication", communicationRoute);
app.use("/api/v1/resources", resourceRoute);
app.get("/api/v1/health", (_req, res) => res.json({ status: "ok", database: mongoose.connection.readyState === 1 }));
app.use((err, _req, res, _next) => {
    console.error("Request failed:", err.message);
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : err.name === "ValidationError" || err.status === 400 || err.statusCode === 400 ? 400 : err.status || 500;
    res.status(status).json({ message: status === 500 ? "Something went wrong." : err.message || "Invalid request." });
});

// Start Server
const startServer = async () => {
    try {
        if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required.");
        if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required.");
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server listening at port ${PORT}`);
        });

    } catch (error) {
        console.log("Server startup failed:", error.message);
    }
};

if (process.env.NODE_ENV !== "test") startServer();

export { app, startServer };
