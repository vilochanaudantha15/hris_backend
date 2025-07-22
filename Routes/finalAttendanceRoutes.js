import express from "express";
import finalAttendanceController from "../Controllers/finalAttendanceController.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied, no token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid token" });
  }
};

router.get("/executives", authenticateToken, finalAttendanceController.getExecutives);
router.get("/summary", authenticateToken, finalAttendanceController.getFinalAttendanceSummary);
router.post("/approve", authenticateToken, finalAttendanceController.approveFinalAttendance);

export default router;