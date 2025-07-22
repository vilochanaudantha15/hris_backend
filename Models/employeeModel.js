import { pool } from "../config/db.js";
import bcrypt from "bcrypt";

const saveEmployee = async (employeeData) => {
  const {
    name,
    emp_no,
    appointed_date,
    designation,
    contract_type,
    profile_pic_path = null,
    plant_id,
    email,
    mobile,
    user_type,
    password,
    department
  } = employeeData;

  if (!name || !emp_no || !appointed_date || !designation || !contract_type || !plant_id || !email || !mobile || !user_type || !password || !department) {
    throw new Error("Missing required fields");
  }

  if (!/^[A-Za-z0-9-]{1,50}$/.test(emp_no)) {
    throw new Error("Invalid emp_no format");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(appointed_date)) {
    throw new Error("Invalid date format (YYYY-MM-DD required)");
  }

  if (!['permanent', 'probation'].includes(contract_type.toLowerCase())) {
    throw new Error("Contract type must be 'permanent' or 'probation'");
  }

  if (!['Executive', 'NonExecutive'].includes(user_type)) {
    throw new Error("User type must be 'Executive', 'NonExecutive'");
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    throw new Error("Invalid email format");
  }

  if (!/^\d{10,}$/.test(mobile.replace(/\D/g, ''))) {
    throw new Error("Invalid mobile number format (at least 10 digits required)");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.execute(
      "SELECT id FROM employees WHERE emp_no = ? OR email = ?",
      [emp_no, email]
    );

    if (existing.length > 0) {
      throw new Error(`Employee with emp_no ${emp_no} or email ${email} already exists`);
    }

    const [result] = await connection.execute(
      "INSERT INTO employees (name, emp_no, appointed_date, designation, contract_type, profile_pic_path, plant_id, email, mobile, user_type, password, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [name, emp_no, appointed_date, designation, contract_type.toLowerCase(), profile_pic_path, plant_id, email, mobile, user_type, hashedPassword, department]
    );

    await connection.commit();
    return { id: result.insertId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const updateEmployee = async (employeeData) => {
  const {
    id,
    name,
    emp_no,
    appointed_date,
    designation,
    contract_type,
    profile_pic_path,
    plant_id,
    user_type,
    is_manager
  } = employeeData;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Fetch current employee data
    const [current] = await connection.execute(
      "SELECT name, emp_no, appointed_date, designation, contract_type, profile_pic_path, plant_id, user_type, email, mobile, department, is_manager FROM employees WHERE id = ?",
      [id]
    );

    if (current.length === 0) {
      throw new Error("Employee not found");
    }

    // Validate provided fields
    if (emp_no && !/^[A-Za-z0-9-]{1,50}$/.test(emp_no)) {
      throw new Error("Invalid emp_no format");
    }
    if (appointed_date && !/^\d{4}-\d{2}-\d{2}$/.test(appointed_date)) {
      throw new Error("Invalid date format (YYYY-MM-DD required)");
    }
    if (contract_type && !['permanent', 'probation'].includes(contract_type.toLowerCase())) {
      throw new Error("Contract type must be 'permanent' or 'probation'");
    }
    if (user_type && !['Executive', 'NonExecutive'].includes(user_type)) {
      throw new Error("User type must be 'Executive', 'NonExecutive'");
    }
    if (is_manager !== undefined && typeof is_manager !== 'boolean') {
      throw new Error("is_manager must be a boolean");
    }

    // Check for uniqueness of emp_no, excluding the current employee
    if (emp_no) {
      const [existing] = await connection.execute(
        "SELECT id FROM employees WHERE emp_no = ? AND id != ?",
        [emp_no, id]
      );
      if (existing.length > 0) {
        throw new Error(`Employee with emp_no ${emp_no} already exists`);
      }
    }

    // Prepare update fields
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (emp_no !== undefined) updateFields.emp_no = emp_no;
    if (appointed_date !== undefined) updateFields.appointed_date = appointed_date;
    if (designation !== undefined) updateFields.designation = designation;
    if (contract_type !== undefined) updateFields.contract_type = contract_type.toLowerCase();
    if (profile_pic_path !== undefined) updateFields.profile_pic_path = profile_pic_path;
    if (plant_id !== undefined) updateFields.plant_id = plant_id;
    if (user_type !== undefined) updateFields.user_type = user_type;
    if (is_manager !== undefined) updateFields.is_manager = is_manager ? 1 : 0;

    // If no fields to update, return current employee data
    if (Object.keys(updateFields).length === 0) {
      await connection.commit();
      return current[0];
    }

    // Build dynamic SQL query
    const fields = Object.keys(updateFields).map(field => `${field} = ?`).join(', ');
    const values = Object.values(updateFields);

    const [result] = await connection.execute(
      `UPDATE employees SET ${fields} WHERE id = ?`,
      [...values, id]
    );

    if (result.affectedRows === 0) {
      throw new Error("Employee not found");
    }

    // Fetch updated employee data
    const [updated] = await connection.execute(
      "SELECT id, name, emp_no, appointed_date, designation, contract_type, profile_pic_path, plant_id, user_type, email, mobile, department, is_manager FROM employees WHERE id = ?",
      [id]
    );

    await connection.commit();
    return updated[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const deleteEmployee = async (id) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute("DELETE FROM employees WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      throw new Error("Employee not found");
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export default { saveEmployee, updateEmployee, deleteEmployee };