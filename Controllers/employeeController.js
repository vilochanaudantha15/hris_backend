import employeeModel from "../Models/employeeModel.js";
import { pool } from "../config/db.js";

const addEmployee = async (req, res) => {
  try {
    const { name, emp_no, appointed_date, designation, contract_type, plant_id, email, mobile, user_type, password, department } = req.body;
    const profile_pic_path = req.file ? req.file.filename : null;

    if (!name || !emp_no || !appointed_date || !designation || !contract_type || !plant_id || !email || !mobile || !user_type || !password || !department) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!['permanent', 'probation'].includes(contract_type.toLowerCase())) {
      return res.status(400).json({ error: "Contract type must be 'permanent' or 'probation'" });
    }

    if (!['Executive', 'NonExecutive'].includes(user_type)) {
      return res.status(400).json({ error: "User type must be 'Executive', 'NonExecutive'" });
    }

    const result = await employeeModel.saveEmployee({
      name,
      emp_no,
      appointed_date,
      designation,
      contract_type: contract_type.toLowerCase(),
      profile_pic_path,
      plant_id: Number(plant_id),
      email,
      mobile,
      user_type,
      password,
      department
    });

    res.status(201).json({ message: "Employee added successfully", id: result.id });
  } catch (error) {
    console.error("Error adding employee:", error.message);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: "File too large. Maximum size is 10MB." });
    }
    if (error.message.includes("already exists")) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to add employee", details: error.message });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, emp_no, appointed_date, designation, contract_type, plant_id, user_type, is_manager } = req.body;
    const profile_pic_path = req.file ? req.file.filename : null;

    // Validate provided fields
    if (emp_no && !/^[A-Za-z0-9-]{1,50}$/.test(emp_no)) {
      return res.status(400).json({ error: "Invalid emp_no format" });
    }
    if (appointed_date && !/^\d{4}-\d{2}-\d{2}$/.test(appointed_date)) {
      return res.status(400).json({ error: "Invalid date format (YYYY-MM-DD required)" });
    }
    if (contract_type && !['permanent', 'probation'].includes(contract_type.toLowerCase())) {
      return res.status(400).json({ error: "Contract type must be 'permanent' or 'probation'" });
    }
    if (user_type && !['Executive', 'NonExecutive'].includes(user_type)) {
      return res.status(400).json({ error: "User type must be 'Executive', 'NonExecutive'"});
    }
    let parsedIsManager;
    if (is_manager !== undefined) {
      if (typeof is_manager === 'boolean') {
        parsedIsManager = is_manager;
      } else if (['true', '1'].includes(String(is_manager).toLowerCase())) {
        parsedIsManager = true;
      } else if (['false', '0'].includes(String(is_manager).toLowerCase())) {
        parsedIsManager = false;
      } else {
        return res.status(400).json({ error: "is_manager must be a boolean, 'true', 'false', '0', or '1'" });
      }
    }

    const updatedEmployee = await employeeModel.updateEmployee({
      id: Number(id),
      name,
      emp_no,
      appointed_date,
      designation,
      contract_type: contract_type ? contract_type.toLowerCase() : undefined,
      profile_pic_path,
      plant_id: plant_id ? Number(plant_id) : undefined,
      user_type,
      is_manager: parsedIsManager
    });

    res.status(200).json({
      ...updatedEmployee,
      profile_pic_path: updatedEmployee.profile_pic_path ? `${req.protocol}://${req.get('host')}/Uploads/${updatedEmployee.profile_pic_path}` : null,
      contract_type: updatedEmployee.contract_type.charAt(0).toUpperCase() + updatedEmployee.contract_type.slice(1),
      is_manager: updatedEmployee.is_manager === 1
    });
  } catch (error) {
    console.error("Error updating employee:", error.message);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: "File too large. Maximum size is 10MB." });
    }
    if (error.message.includes("already exists")) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to update employee", details: error.message });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    await employeeModel.deleteEmployee(Number(id));
    res.status(200).json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error.message);
    res.status(500).json({ error: "Failed to delete employee", details: error.message });
  }
};

const getPowerPlants = async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT id, name FROM power_plants");
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching power plants:", error.message);
    res.status(500).json({ error: "Failed to fetch power plants" });
  }
};

const getEmployees = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT e.id, e.name, e.emp_no, e.appointed_date, e.designation, e.contract_type, 
              e.profile_pic_path, e.plant_id, p.name AS plant_name, e.email, e.mobile, e.user_type, e.department, e.is_manager
       FROM employees e 
       LEFT JOIN power_plants p ON e.plant_id = p.id`
    );
    
    const employees = rows.map(row => ({
      ...row,
      profile_pic_path: row.profile_pic_path ? `${req.protocol}://${req.get('host')}/Uploads/${row.profile_pic_path}` : null,
      contract_type: row.contract_type.charAt(0).toUpperCase() + row.contract_type.slice(1),
      user_type: row.user_type.charAt(0).toUpperCase() + row.user_type.slice(1),
      is_manager: row.is_manager === 1
    }));
    
    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error.message);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
};

const getExecutiveEmployees = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT e.id, e.name, e.emp_no, e.appointed_date, e.designation, e.contract_type, 
              e.profile_pic_path, e.plant_id, p.name AS plant_name, e.email, e.mobile, e.user_type, e.department, e.is_manager
       FROM employees e 
       LEFT JOIN power_plants p ON e.plant_id = p.id
       WHERE e.user_type IN ('Executive')`
    );
    
    const employees = rows.map(row => ({
      ...row,
      profile_pic_path: row.profile_pic_path ? `${req.protocol}://${req.get('host')}/Uploads/${row.profile_pic_path}` : null,
      contract_type: row.contract_type.charAt(0).toUpperCase() + row.contract_type.slice(1),
      user_type: row.user_type.charAt(0).toUpperCase() + row.user_type.slice(1),
      is_manager: row.is_manager === 1
    }));
    
    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching executive employees:", error.message);
    res.status(500).json({ error: "Failed to fetch executive employees" });
  }
};

const getNonExecutiveEmployees = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT e.id, e.name, e.emp_no, e.appointed_date, e.designation, e.contract_type, 
              e.profile_pic_path, e.plant_id, p.name AS plant_name, e.email, e.mobile, e.user_type, e.department, e.is_manager
       FROM employees e 
       LEFT JOIN power_plants p ON e.plant_id = p.id
       WHERE e.user_type IN ('Laborer', 'Supervisor', 'Engineer')`
    );
    
    const employees = rows.map(row => ({
      ...row,
      profile_pic_path: row.profile_pic_path ? `${req.protocol}://${req.get('host')}/Uploads/${row.profile_pic_path}` : null,
      contract_type: row.contract_type.charAt(0).toUpperCase() + row.contract_type.slice(1),
      user_type: row.user_type.charAt(0).toUpperCase() + row.user_type.slice(1),
      is_manager: row.is_manager === 1
    }));
    
    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching non-executive employees:", error.message);
    res.status(500).json({ error: "Failed to fetch non-executive employees" });
  }
};

const getEmployeeByEmail = async (req, res) => {
  try {
    const { email } = req.user;
    const [rows] = await pool.execute(
      "SELECT name, email, profile_pic_path, is_manager FROM employees WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const employee = rows[0];
    res.status(200).json({
      user: {
        name: employee.name,
        email: employee.email,
        avatar: employee.profile_pic_path ? `${req.protocol}://${req.get('host')}/Uploads/${employee.profile_pic_path}` : null,
        is_manager: employee.is_manager === 1
      }
    });
  } catch (error) {
    console.error("Error fetching employee by email:", error.message);
    res.status(500).json({ error: "Failed to fetch employee", details: error.message });
  }
};

export default { 
  addEmployee, 
  updateEmployee, 
  deleteEmployee, 
  getPowerPlants, 
  getEmployees, 
  getExecutiveEmployees, 
  getNonExecutiveEmployees, 
  getEmployeeByEmail 
};