import express from "express";
import rosterController from "../Controllers/rosterController.js";
import employeeController from "../Controllers/employeeController.js";
const router = express.Router();

// Define API endpoints
router.get("/power-plants", rosterController.getPowerPlants);
router.get("/employees", rosterController.getAllEmployees);
router.get("/roster", rosterController.getRoster);
router.post("/roster", rosterController.saveRoster);
router.post("/employees", employeeController.addEmployee);

export default router;