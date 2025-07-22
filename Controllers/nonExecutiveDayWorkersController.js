import nonExecutiveDayWorkersModel from "../Models/nonExecutiveDayWorkersModel.js";

const getPowerPlants = async (req, res) => {
  try {
    const plants = await nonExecutiveDayWorkersModel.getAllPowerPlants();
    if (!plants.length) {
      return res.status(404).json({ error: "No power plants found" });
    }
    res.status(200).json(plants);
  } catch (error) {
    console.error("Error fetching power plants:", error.message);
    res.status(500).json({ error: "Failed to fetch power plants", details: error.message });
  }
};

const getNonExecutiveSummary = async (req, res) => {
  try {
    const { plantId, year, month } = req.query;
    if (!plantId || !year || !month) {
      return res.status(400).json({ error: "Plant ID, year, and month are required" });
    }
    // Validate plantId is a number
    if (isNaN(plantId)) {
      return res.status(400).json({ error: "Plant ID must be a number" });
    }
    const summary = await nonExecutiveDayWorkersModel.getNonExecutiveSummary(Number(plantId), year, month);
    res.status(200).json(summary);
  } catch (error) {
    console.error("Error fetching non-executive summary:", error.message);
    res.status(500).json({ error: "Failed to fetch non-executive summary", details: error.message });
  }
};

const approveNonExecutiveSummary = async (req, res) => {
  try {
    const { plantId, year, month, summaryData } = req.body;
    if (!plantId || !year || !month || !Array.isArray(summaryData)) {
      return res.status(400).json({ error: "Plant ID, year, month, and summary data are required" });
    }
    // Validate plantId is a number
    if (isNaN(plantId)) {
      return res.status(400).json({ error: "Plant ID must be a number" });
    }
    await nonExecutiveDayWorkersModel.saveNonExecutiveSummary(Number(plantId), year, month, summaryData);
    res.status(200).json({ message: "Non-executive summary approved and saved successfully" });
  } catch (error) {
    console.error("Error approving non-executive summary:", error.message);
    res.status(500).json({ error: "Failed to approve non-executive summary", details: error.message });
  }
};

export default { getPowerPlants, getNonExecutiveSummary, approveNonExecutiveSummary };