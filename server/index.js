import express from "express";
import dotenv from "dotenv";
import connectDB from "./database/dbConnect.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 8080;

const startServer = async () => {
try {
await connectDB();

    app.listen(PORT, () => {
        console.log(`Server listening at port ${PORT}`);
    });

} catch (error) {
    console.log("Server startup failed:", error.message);
}


}; 

startServer();
