// Authentication cookie and signed session token helper.
import jwt from "jsonwebtoken";

const generateToken = (res, user, message) => {
    const token = jwt.sign(
        { userId: user._id, version: user.authVersion || 0 },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    return res
        .status(200)
        .cookie("token", token, {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000
        })
        .json({
            success: true,
            message,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
};

export default generateToken;
