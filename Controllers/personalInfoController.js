import personalInfoModel from "../Models/personalInfoModel.js";

const getPersonalInfo = async (req, res) => {
  try {
    const { email } = req.user;
    const employee = await personalInfoModel.getPersonalInfoByEmail(email);

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.status(200).json({
      user: {
        title: employee.title || "Not provided",
        initials: employee.initials || "Not provided",
        last_name: employee.last_name || "Not provided",
        other_names: employee.other_names || "Not provided",
        gender: employee.gender || "Not specified",
        marital_status: employee.marital_status || "Not specified",
        date_of_birth: employee.date_of_birth || "Not provided",
        nic_no: employee.nic_no || "Not provided",
        nic_issue_date: employee.nic_issue_date || "Not provided",
        address_no: employee.address_no || "Not provided",
        street: employee.street || "Not provided",
        city: employee.city || "Not provided",
        district: employee.district || "Not provided",
        tel_no: employee.tel_no || "Not provided",
        mobile_no: employee.mobile_no || "Not provided",
        email_address: employee.email_address || "Not provided",
        police_station: employee.police_station || "Not provided",
        gr_division: employee.gr_division || "Not provided",
        nationality: employee.nationality || "Not provided",
        religion: employee.religion || "Not provided",
        emergency_contact_name: employee.emergency_contact_name || "Not provided",
        emergency_contact_relationship: employee.emergency_contact_relationship || "Not provided",
        emergency_contact_no: employee.emergency_contact_no || "Not provided",
        emergency_contact_mobile: employee.emergency_contact_mobile || "Not provided",
      },
    });
  } catch (error) {
    console.error("Error fetching personal info:", error.message);
    res.status(500).json({ error: "Failed to fetch personal info", details: error.message });
  }
};

const updatePersonalInfo = async (req, res) => {
  try {
    const { email } = req.user;
    const updates = req.body;

    // Validate input
    const allowedFields = [
      "title", "initials", "last_name", "other_names", "gender", "marital_status",
      "date_of_birth", "nic_no", "nic_issue_date", "address_no", "street", "city",
      "district", "tel_no", "mobile_no", "email_address", "police_station",
      "gr_division", "nationality", "religion", "emergency_contact_name",
      "emergency_contact_relationship", "emergency_contact_no", "emergency_contact_mobile",
    ];

    const updateKeys = Object.keys(updates);
    const invalidFields = updateKeys.filter((key) => !allowedFields.includes(key));
    if (invalidFields.length > 0) {
      return res.status(400).json({ error: "Invalid fields provided", invalidFields });
    }

    // Validate specific fields
    if (updates.email_address && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email_address)) {
      return res.status(400).json({ error: "Invalid email address format" });
    }
    if (updates.date_of_birth && isNaN(Date.parse(updates.date_of_birth))) {
      return res.status(400).json({ error: "Invalid date of birth format" });
    }
    if (updates.nic_issue_date && isNaN(Date.parse(updates.nic_issue_date))) {
      return res.status(400).json({ error: "Invalid NIC issue date format" });
    }

    const result = await personalInfoModel.updatePersonalInfo(email, updates);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Employee not found or no changes made" });
    }

    res.status(200).json({ message: "Personal information updated successfully" });
  } catch (error) {
    console.error("Error updating personal info:", error.message);
    res.status(500).json({ error: "Failed to update personal info", details: error.message });
  }
};

export default { getPersonalInfo, updatePersonalInfo };