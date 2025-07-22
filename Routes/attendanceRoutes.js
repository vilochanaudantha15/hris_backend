import express from "express";
import attendanceController from "../Controllers/attendanceController.js";

const router = express.Router();

router.post("/", attendanceController.createAttendance);
router.post("/upload", attendanceController.uploadAttendanceExcel);
router.get("/summary", attendanceController.getAttendanceSummary);

export default router;