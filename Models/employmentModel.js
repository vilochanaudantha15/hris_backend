import { pool } from "../config/db.js";

const getEmploymentInfoByEmail = async (email) => {
  const connection = await pool.getConnection();
  try {
    console.log(`Querying database for email: ${email}`);
    const queryString = `
      SELECT 
        e.designation, e.department, e.manager, 
        DATE_FORMAT(e.appointed_date, '%Y-%m-%d') AS appointed_date,
        e.contract_type, e.user_type, e.plant_id, p.name AS plant_name,
        e.key_role, e.grade_name, e.company, e.branch_name, e.manager_location,
        DATE_FORMAT(e.contract_end_date, '%Y-%m-%d') AS contract_end_date,
        e.epf_no, e.etf_no, e.job_description, e.medical_certificate, e.shift_basis
      FROM employees e 
      LEFT JOIN power_plants p ON e.plant_id = p.id
      WHERE e.email = ?`;

    const [employeeRows] = await connection.execute(queryString, [email]);

    const [employeeList] = await connection.execute(
      "SELECT id, name FROM employees"
    );

    if (employeeRows.length === 0) {
      console.log(`No employee found for email: ${email}`);
      return { employee: null, employees: employeeList };
    }

    return { employee: employeeRows[0], employees: employeeList };
  } catch (error) {
    console.error("Database error in getEmploymentInfoByEmail:", error.message);
    throw new Error(`Database error: ${error.message}`);
  } finally {
    connection.release();
  }
};

const updateEmploymentInfo = async (email, updates) => {
  const connection = await pool.getConnection();
  try {
    const fields = Object.keys(updates).map((key) => `${key} = ?`).join(", ");
    const values = Object.values(updates);

    if (!fields) {
      return { affectedRows: 0 };
    }

    const queryString = `
      UPDATE employees 
      SET ${fields}
      WHERE email = ?`;

    const [result] = await connection.execute(queryString, [...values, email]);
    return result;
  } catch (error) {
    console.error("Database error in updateEmploymentInfo:", error.message);
    throw new Error(`Database error: ${error.message}`);
  } finally {
    connection.release();
  }
};

const getAllEmployees = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute("SELECT id, name FROM employees");
    return rows;
  } catch (error) {
    console.error("Database error in getAllEmployees:", error.message);
    throw new Error(`Database error: ${error.message}`);
  } finally {
    connection.release();
  }
};

export default { getEmploymentInfoByEmail, updateEmploymentInfo, getAllEmployees };