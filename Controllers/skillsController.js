import skillsModel from "../Models/skillsModel.js";

const getSkillsInfo = async (req, res) => {
  try {
    const { email } = req.user;
    const employee = await skillsModel.getSkillsInfoByEmail(email);

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.status(200).json({
      user: {
        education: employee.education || "Not provided",
        skills: employee.skills || [],
      },
    });
  } catch (error) {
    console.error("Error fetching skills info:", error.message);
    res.status(500).json({ error: "Failed to fetch skills info", details: error.message });
  }
};

const updateSkillsInfo = async (req, res) => {
  try {
    const { email } = req.user;
    const updates = req.body;

    // Validate input
    const allowedFields = ["education", "skills"];
    const updateKeys = Object.keys(updates);
    const invalidFields = updateKeys.filter((key) => !allowedFields.includes(key));
    if (invalidFields.length > 0) {
      return res.status(400).json({ error: "Invalid fields provided", invalidFields });
    }

    // Validate skills as an array
    if (updates.skills && !Array.isArray(updates.skills)) {
      return res.status(400).json({ error: "Skills must be an array" });
    }

    const result = await skillsModel.updateSkillsInfo(email, updates);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Employee not found or no changes made" });
    }

    res.status(200).json({ message: "Skills information updated successfully" });
  } catch (error) {
    console.error("Error updating skills info:", error.message);
    res.status(500).json({ error: "Failed to update skills info", details: error.message });
  }
};

export default { getSkillsInfo, updateSkillsInfo };