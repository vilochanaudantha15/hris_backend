import nonEfinalAttendanceModel from "../Models/NonEfinalAttendanceModel.js";

const getNonExecutives = async (req, res) => {
  try {
    const { plantId } = req.query;
    if (!plantId) {
      return res.status(400).json({ error: "Plant ID is required" });
    }
    if (isNaN(plantId)) {
      return res.status(400).json({ error: "Plant ID must be a number" });
    }
    const nonExecutives = await nonEfinalAttendanceModel.getAllNonExecutives(Number(plantId));
    if (!nonExecutives.length) {
      return res.status(404).json({ error: "No non-executives found for this plant" });
    }
    res.status(200).json(nonExecutives);
  } catch (error) {
    console.error("Error fetching non-executives:", error.message);
    res.status(500).json({ error: "Failed to fetch non-executives", details: error.message });
  }
};

const getNonExecutiveAttendanceSummary = async (req, res) => {
  try {
    const { plantId, year, month } = req.query;
    if (!plantId || !year || !month) {
      return res.status(400).json({ error: "Plant ID, year, and month are required" });
    }
    if (isNaN(plantId)) {
      return res.status(400).json({ error: "Plant ID must be a number" });
    }
    const summary = await nonEfinalAttendanceModel.getNonExecutiveAttendanceSummary(Number(plantId), year, month);
    res.status(200).json(summary);
  } catch (error) {
    console.error("Error fetching non-executive attendance summary:", error.message);
    res.status(500).json({ error: "Failed to fetch non-executive attendance summary", details: error.message });
  }
};

const approveNonExecutiveAttendance = async (req, res) => {
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
    await nonEfinalAttendanceModel.saveNonExecutiveAttendance(Number(plantId), year, month, attendanceData);
    res.status(200).json({ message: "Non-executive attendance approved and saved successfully" });
  } catch (error) {
    console.error("Error approving non-executive attendance:", error.message);
    res.status(500).json({ error: "Failed to approve non-executive attendance", details: error.message });
  }
};

export default { getNonExecutives, getNonExecutiveAttendanceSummary, approveNonExecutiveAttendance };