import employmentModel from "../Models/employmentModel.js";

const getEmploymentInfo = async (req, res) => {
  try {
    const { email } = req.user;
    const { employee, employees } = await employmentModel.getEmploymentInfoByEmail(email);

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.status(200).json({
      user: {
        designation: employee.designation || "Not provided",
        department: employee.department || "Not provided",
        manager: employee.manager || "",
        appointed_date: employee.appointed_date || "",
        contract_type: employee.contract_type || "Not provided",
        user_type: employee.user_type || "Not provided",
        plant_id: employee.plant_id || "Not provided",
        plant_name: employee.plant_name || "Not provided",
        key_role: employee.key_role || "Not provided",
        grade_name: employee.grade_name || "Not provided",
        company: employee.company || "Not provided",
        branch_name: employee.branch_name || "Not provided",
        manager_location: employee.manager_location || "Not provided",
        contract_end_date: employee.contract_end_date || "",
        epf_no: employee.epf_no || "Not provided",
        etf_no: employee.etf_no || "Not provided",
        job_description: employee.job_description || "Not provided",
        medical_certificate: employee.medical_certificate || false,
        shift_basis: employee.shift_basis || false,
      },
      employees: employees.map(emp => ({ id: emp.id, name: emp.name })),
    });
  } catch (error) {
    console.error("Error fetching employment info:", error.message);
    res.status(500).json({ error: "Failed to fetch employment info", details: error.message });
  }
};

const updateEmploymentInfo = async (req, res) => {
  try {
    const { email } = req.user;
    const updates = req.body;

    const allowedFields = [
      "designation", "department", "manager", "appointed_date", "user_type",
      "key_role", "grade_name", "company", "branch_name", "manager_location",
      "contract_end_date", "epf_no", "etf_no", "job_description",
      "medical_certificate", "shift_basis",
    ];

    const updateKeys = Object.keys(updates);
    const invalidFields = updateKeys.filter((key) => !allowedFields.includes(key));
    if (invalidFields.length > 0) {
      return res.status(400).json({ error: "Invalid fields provided", invalidFields });
    }

    if (updates.manager) {
      const employees = await employmentModel.getAllEmployees();
      const validManager = employees.find(emp => emp.name === updates.manager);
      if (!validManager) {
        return res.status(400).json({ error: `Invalid manager name, must be one of: ${employees.map(emp => emp.name).join(", ")}` });
      }
    }

    const result = await employmentModel.updateEmploymentInfo(email, updates);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Employee not found or no changes made" });
    }

    res.status(200).json({ message: "Employment information updated successfully" });
  } catch (error) {
    console.error("Error updating employment info:", error.message);
    res.status(500).json({ error: "Failed to update employment info", details: error.message });
  }
};

export default { getEmploymentInfo, updateEmploymentInfo };