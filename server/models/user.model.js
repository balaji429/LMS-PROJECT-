// Mongoose schema for LMS user accounts and sessions.
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ["student", "teacher", "admin"],
        default: "student"
    },

    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: true },
    authVersion: { type: Number, default: 0 },

    enrolledCourses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course"
        }
    ],

    completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],

    photoURL: {
        type: String,
        default: ""
    }

}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;
