import { pool } from "../config/db.js";

const getAllEmployees = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute("SELECT id, name FROM employees ORDER BY name");
    return rows;
  } catch (error) {
    console.error("Database error in getAllEmployees:", error.message);
    throw new Error(`Database error: ${error.message}`);
  } finally {
    connection.release();
  }
};

const getEmployeeById = async (employee_id) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute("SELECT id, name FROM employees WHERE id = ?", [employee_id]);
    return rows[0] || null;
  } catch (error) {
    console.error("Database error in getEmployeeById:", error.message);
    throw new Error(`Database error: ${error.message}`);
  } finally {
    connection.release();
  }
};

const addLeave = async ({ employee_id, leave_type, start_date, end_date }) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const queryString = `
      INSERT INTO leaves (employee_id, leave_type, start_date, end_date, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    const values = [employee_id, leave_type, start_date, end_date || null];
    const [result] = await connection.execute(queryString, values);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    console.error("Database error in addLeave:", error.message);
    throw new Error(`Database error: ${error.message}`);
  } finally {
    connection.release();
  }
};

export default { getAllEmployees, getEmployeeById, addLeave };