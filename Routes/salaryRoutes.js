import express from "express";
import salaryController from "../Controllers/salaryController.js";
import { authenticateToken } from "./employeeRoutes.js";

const router = express.Router();

router.get("/salaries", authenticateToken, salaryController.getSalaries);
router.post("/salaries/approve", authenticateToken, salaryController.approveSalaries);

export default router;