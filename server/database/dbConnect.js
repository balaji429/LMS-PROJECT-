// MongoDB connection setup and initial account bootstrap.
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model.js";

dotenv.config();

const connectDB = async () => {
try {
await mongoose.connect(process.env.MONGO_URI);
await User.updateMany({ role: "instructor" }, { $set: { role: "teacher" } });
console.log("MongoDB connected successfully");

} catch (error) {
    console.log("MongoDB connection failed:", error.message);
    throw error;
}

};

export default connectDB;
