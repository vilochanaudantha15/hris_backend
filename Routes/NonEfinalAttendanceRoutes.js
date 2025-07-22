import express from "express";
import nonEfinalAttendanceController from "../Controllers/NonEfinalAttendanceController.js";
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

router.get("/non-executives", authenticateToken, nonEfinalAttendanceController.getNonExecutives);
router.get("/summary", authenticateToken, nonEfinalAttendanceController.getNonExecutiveAttendanceSummary);
router.post("/approve", authenticateToken, nonEfinalAttendanceController.approveNonExecutiveAttendance);

export default router;