import express from "express";
import executiveAttendanceController from "../Controllers/executiveAttendanceController.js";

const router = express.Router();

router.post("/", executiveAttendanceController.createExecutiveAttendance);
router.post("/upload", executiveAttendanceController.uploadExecutiveAttendanceExcel);
router.get("/summary", executiveAttendanceController.getExecutiveAttendanceSummary);

export default router;