import rosterLabourerSalaryModel from "../Models/rosterLabourerSalaryModel.js";

// Fetch total hours worked by laborers for a specific plant, year, and month
const getLaborerHours = async (req, res) => {
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
    const laborerHours = await rosterLabourerSalaryModel.getLaborerHours(plant, yearNum, monthNum + 1);
    if (!laborerHours.length) {
      return res.status(404).json({ error: "No laborers found for the specified roster" });
    }
    res.status(200).json(laborerHours);
  } catch (error) {
    console.error("Error fetching laborer hours:", error.message);
    res.status(500).json({ error: "Failed to fetch laborer hours", details: error.message });
  }
};

export default { getLaborerHours };