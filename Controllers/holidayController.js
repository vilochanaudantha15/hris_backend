import holidayModel from "../Models/holidayModel.js";

// Fetch all holidays
const getHolidays = async (req, res) => {
  try {
    const holidays = await holidayModel.getAllHolidays();
    if (!holidays.length) {
      return res.status(404).json({ error: "No holidays found" });
    }
    res.status(200).json(holidays);
  } catch (error) {
    console.error("Error fetching holidays:", error.message);
    res.status(500).json({ error: "Failed to fetch holidays", details: error.message });
  }
};

// Add a new holiday
const addHoliday = async (req, res) => {
  try {
    const { date, name, type } = req.body;
    if (!date || !name || !type) {
      return res.status(400).json({ error: "Missing required fields: date, name, type" });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }
    const validTypes = ['Poya', 'Public', 'Custom'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid type: ${type}. Must be one of ${validTypes.join(', ')}` });
    }
    const holidayId = await holidayModel.addHoliday(date, name, type);
    res.status(201).json({ message: "Holiday added successfully", holidayId });
  } catch (error) {
    console.error("Error adding holiday:", error.message);
    if (error.message.includes("A holiday already exists")) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to add holiday", details: error.message });
  }
};

export default { getHolidays, addHoliday };