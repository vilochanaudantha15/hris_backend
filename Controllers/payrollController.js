import payrollModel from "../Models/payrollModel.js";

const getAllEmployees = async (req, res) => {
  try {
    const employees = await payrollModel.getAllEmployees();
    res.status(200).json({ employees });
  } catch (error) {
    console.error("Error fetching employees:", error.message);
    res.status(500).json({ error: "Failed to fetch employees", details: error.message });
  }
};

const getPayrollInfo = async (req, res) => {
  try {
    const { employeeId } = req.params;
    console.log(`Fetching payroll for employeeId: ${employeeId}`);
    const employee = await payrollModel.getPayrollInfoByEmployeeId(employeeId);

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.status(200).json({
      user: {
        payroll: employee.payroll,
      },
    });
  } catch (error) {
    console.error("Error fetching payroll info:", error.message);
    res.status(500).json({ error: "Failed to fetch payroll info", details: error.message });
  }
};

const updatePayrollInfo = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const updates = req.body;

    // Validate input
    const allowedFields = [
      "annualSalary",
      "monthlySalary",
      "payGrade",
      "jobLevel",
      "bankName",
      "accountNumber",
      "branch",
      "taxId",
      "taxFilingStatus",
      "bankCode",
      "branchCode",
      "transactionType", // Added new field
    ];
    const updateKeys = Object.keys(updates);
    const invalidFields = updateKeys.filter((key) => !allowedFields.includes(key));
    if (invalidFields.length > 0) {
      return res.status(400).json({ error: "Invalid fields provided", invalidFields });
    }

    // Validate required fields
    const requiredFields = allowedFields;
    const missingFields = requiredFields.filter((key) => !updates[key]);
    if (missingFields.length > 0) {
      return res.status(400).json({ error: "Missing required fields", missingFields });
    }

    // Validate numeric fields
    if (isNaN(updates.annualSalary) || isNaN(updates.monthlySalary)) {
      return res.status(400).json({ error: "Annual and monthly salary must be numbers" });
    }

    // Validate taxFilingStatus
    const validStatuses = ["Single", "Married", "Head of Household"];
    if (updates.taxFilingStatus && !validStatuses.includes(updates.taxFilingStatus)) {
      return res.status(400).json({ error: `taxFilingStatus must be one of: ${validStatuses.join(", ")}` });
    }

    // Validate transactionType
    const validTransactionTypes = ["SBA", "SLI"];
    if (updates.transactionType && !validTransactionTypes.includes(updates.transactionType)) {
      return res.status(400).json({ error: `transactionType must be one of: ${validTransactionTypes.join(", ")}` });
    }

    // Validate bankCode and branchCode (basic format check)
    if (!/^\d{4}$/.test(updates.bankCode) || !/^\d{1,4}$/.test(updates.branchCode)) {
      return res.status(400).json({ error: "Invalid bank code or branch code format" });
    }

    const result = await payrollModel.updatePayrollInfo(employeeId, updates);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Employee not found or no changes made" });
    }

    res.status(200).json({ message: "Payroll information updated successfully" });
  } catch (error) {
    console.error("Error updating payroll info:", error.message);
    res.status(500).json({ error: "Failed to update payroll info", details: error.message });
  }
};

export default { getAllEmployees, getPayrollInfo, updatePayrollInfo };