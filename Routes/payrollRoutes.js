import express from "express";
import payrollController from "../Controllers/payrollController.js";
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
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired, please refresh or login again" });
    }
    res.status(403).json({ error: "Invalid token" });
  }
};

router.get("/employees", authenticateToken, payrollController.getAllEmployees);
router.get("/:employeeId", authenticateToken, payrollController.getPayrollInfo);
router.put("/:employeeId", authenticateToken, payrollController.updatePayrollInfo);

export default router;