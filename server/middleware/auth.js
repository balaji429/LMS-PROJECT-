// Authentication and role-based access control middleware.
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith("token="))?.slice(6);
    if (!token) return res.status(401).json({ message: "Please log in." });
    const payload = jwt.verify(decodeURIComponent(token), process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select("-password");
    if (!user) return res.status(401).json({ message: "Account not found." });
    if (!user.isActive) return res.status(403).json({ message: "This account is inactive. Contact an administrator." });
    if ((payload.version || 0) !== (user.authVersion || 0)) return res.status(401).json({ message: "Your session has ended. Please log in again." });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Your session has expired. Please log in again." });
  }
};

export const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: "You do not have permission to do that." });
  next();
};
