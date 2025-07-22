import express from "express";
import labourerAttendanceController from "../Controllers/labourerAttendanceController.js";

const router = express.Router();

router.get("/roster", labourerAttendanceController.getRosterData);
router.post("/bulk", labourerAttendanceController.createBulkAttendance);
router.get("/summary", labourerAttendanceController.getAttendanceSummary);

export default router;