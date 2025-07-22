import express from "express";
import holidayController from "../Controllers/holidayController.js";

const router = express.Router();

// Define API endpoints
router.get("/holidays", holidayController.getHolidays);
router.post("/holidays", holidayController.addHoliday);

export default router;