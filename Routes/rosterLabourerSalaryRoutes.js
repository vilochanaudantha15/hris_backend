import express from "express";
import rosterLabourerSalaryController from "../Controllers/rosterLabourerSalaryController.js";

const router = express.Router();

// Define API endpoint for laborer hours
router.get("/laborer-hours", rosterLabourerSalaryController.getLaborerHours);

export default router;