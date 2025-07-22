import finalAttendanceModel from "../Models/finalAttendanceModel.js";

const getExecutives = async (req, res) => {
  try {
    const { plantId } = req.query;
    if (!plantId) {
      return res.status(400).json({ error: "Plant ID is required" });
    }
    if (isNaN(plantId)) {
      return res.status(400).json({ error: "Plant ID must be a number" });
    }
    const executives = await finalAttendanceModel.getAllExecutives(Number(plantId));
    if (!executives.length) {
      return res.status(404).json({ error: "No executives found for this plant" });
    }
    res.status(200).json(executives);
  } catch (error) {
    console.error("Error fetching executives:", error.message);
    res.status(500).json({ error: "Failed to fetch executives", details: error.message });
  }
};

const getFinalAttendanceSummary = async (req, res) => {
  try {
    const { plantId, year, month } = req.query;
    if (!plantId || !year || !month) {
      return res.status(400).json({ error: "Plant ID, year, and month are required" });
    }
    if (isNaN(plantId)) {
      return res.status(400).json({ error: "Plant ID must be a number" });
    }
    const summary = await finalAttendanceModel.getFinalAttendanceSummary(Number(plantId), year, month);
    res.status(200).json(summary);
  } catch (error) {
    console.error("Error fetching final attendance summary:", error.message);
    res.status(500).json({ error: "Failed to fetch final attendance summary", details: error.message });
  }
};

const approveFinalAttendance = async (req, res) => {
  try {
    const { plantId, year, month, attendanceData } = req.body;
    if (!plantId || !year || !month || !Array.isArray(attendanceData)) {
      return res.status(400).json({ error: "Plant ID, year, month, and attendance data are required" });
    }
    if (isNaN(plantId)) {
      return res.status(400).json({ error: "Plant ID must be a number" });
    }
    for (const record of attendanceData) {
      if (!record.salary_month || isNaN(record.salary_month) || record.salary_month < 1 || record.salary_month > 12) {
        return res.status(400).json({ error: "Valid salary month (1-12) is required for all records" });
      }
    }
    await finalAttendanceModel.saveFinalAttendance(Number(plantId), year, month, attendanceData);
    res.status(200).json({ message: "Final attendance approved and saved successfully" });
  } catch (error) {
    console.error("Error approving final attendance:", error.message);
    res.status(500).json({ error: "Failed to approve final attendance", details: error.message });
  }
};

export default { getExecutives, getFinalAttendanceSummary, approveFinalAttendance };