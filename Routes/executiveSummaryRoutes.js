import express from "express";
import executiveSummaryController from "../Controllers/executiveSummaryController.js";
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

router.get("/power-plants", executiveSummaryController.getPowerPlants);
router.get("/summary", authenticateToken, executiveSummaryController.getExecutiveSummary);
router.post("/approve", authenticateToken, executiveSummaryController.approveExecutiveSummary);

export default router;