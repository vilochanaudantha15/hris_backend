import rosterModel from "../Models/rosterModel.js";

// Fetch all power plants
const getPowerPlants = async (req, res) => {
  try {
    const plants = await rosterModel.getAllPowerPlants();
    if (!plants.length) {
      return res.status(404).json({ error: "No power plants found" });
    }
    res.status(200).json(plants);
  } catch (error) {
    console.error("Error fetching power plants:", error.message);
    res.status(500).json({ error: "Failed to fetch power plants", details: error.message });
  }
};

// Fetch employees for a specific plant
const getAllEmployees = async (req, res) => {
  try {
    const { plant } = req.query;
    if (!plant) {
      return res.status(400).json({ error: "Missing required query parameter: plant" });
    }
    const employees = await rosterModel.getAllEmployees(plant);
    if (!employees.length) {
      return res.status(404).json({ error: `No employees found for plant: ${plant}` });
    }
    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error.message);
    res.status(500).json({ error: "Failed to fetch employees", details: error.message });
  }
};

// Fetch roster by plant, year, and month
const getRoster = async (req, res) => {
  try {
    const { plant, year, month } = req.query;
    if (!plant || !year || !month) {
      return res.status(400).json({ error: "Missing required query parameters: plant, year, month" });
    }
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 0 || monthNum > 11) {
      return res.status(400).json({ error: "Invalid year or month" });
    }
    const rosters = await rosterModel.getRosterByPlantAndMonth(plant, yearNum, monthNum + 1);
    res.status(200).json(rosters);
  } catch (error) {
    console.error("Error fetching roster:", error.message);
    res.status(500).json({ error: "Failed to fetch roster", details: error.message });
  }
};

// Save or update roster
const saveRoster = async (req, res) => {
  try {
    const { plant, date, shift, supervisorId, laborerIds } = req.body;
    if (!plant || !date || !shift) {
      return res.status(400).json({ error: "Missing required fields: plant, date, shift" });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }
    if (laborerIds && !Array.isArray(laborerIds)) {
      return res.status(400).json({ error: "laborerIds must be an array" });
    }
    const validShifts = ['Morning', 'Day', 'Night'];
    const trimmedShift = shift.trim();
    if (!validShifts.includes(trimmedShift)) {
      return res.status(400).json({ error: `Invalid shift: ${shift}. Must be one of ${validShifts.join(', ')}` });
    }
    await rosterModel.upsertRoster(plant, date, trimmedShift, supervisorId, laborerIds || []);
    res.status(200).json({ message: "Roster saved successfully" });
  } catch (error) {
    console.error("Error saving roster:", error.message);
    res.status(500).json({ error: "Failed to save roster", details: error.message });
  }
};

export default { getPowerPlants, getAllEmployees, getRoster, saveRoster };