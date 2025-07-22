import leavesModel from "../Models/leaveModel.js";

const getEmployees = async (req, res) => {
  try {
    const employees = await leavesModel.getAllEmployees();
    if (!employees || employees.length === 0) {
      return res.status(404).json({ error: "No employees found. Please add employees first." });
    }
    res.status(200).json({
      employees: employees.map(emp => ({ id: emp.id, name: emp.name })),
    });
  } catch (error) {
    console.error("Error fetching employees:", error.message);
    res.status(500).json({ error: "Failed to fetch employees", details: error.message });
  }
};

const addLeave = async (req, res) => {
  try {
    const { employee_id, leave_type, start_date, end_date } = req.body;

    // Validate required fields
    if (!employee_id || !leave_type || !start_date) {
      return res.status(400).json({ error: "Missing required fields: employee_id, leave_type, start_date" });
    }

    // Validate leave type
    const validLeaveTypes = ['Casual', 'Annual', 'Medical'];
    if (!validLeaveTypes.includes(leave_type)) {
      return res.status(400).json({ error: "Invalid leave type. Must be Casual, Annual, or Medical" });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = end_date ? new Date(end_date) : null;
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ error: "Invalid start date format (YYYY-MM-DD required)" });
    }
    if (endDate && (isNaN(endDate.getTime()) || endDate < startDate)) {
      return res.status(400).json({ error: "End date must be on or after start date" });
    }

    // Check if employee exists
    const employee = await leavesModel.getEmployeeById(employee_id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const result = await leavesModel.addLeave({
      employee_id: Number(employee_id),
      leave_type,
      start_date,
      end_date,
    });

    if (result.affectedRows === 0) {
      return res.status(500).json({ error: "Failed to add leave request" });
    }

    res.status(201).json({ message: "Leave request added successfully" });
  } catch (error) {
    console.error("Error adding leave:", error.message);
    res.status(500).json({ error: "Failed to add leave", details: error.message });
  }
};

export default { getEmployees, addLeave };