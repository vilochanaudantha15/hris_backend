import { pool } from "../config/db.js";

const getSkillsInfoByEmail = async (email) => {
  const connection = await pool.getConnection();
  try {
    console.log(`Querying database for email: ${email}`);
    const queryString = `
      SELECT education, skills
      FROM employees
      WHERE email = ?`;

    const [rows] = await connection.execute(queryString, [email]);

    if (rows.length === 0) {
      console.log(`No employee found for email: ${email}`);
      return null;
    }

    // Parse skills JSON if it exists
    const employee = rows[0];
    employee.skills = employee.skills ? JSON.parse(employee.skills) : [];

    return employee;
  } catch (error) {
    console.error("Database error in getSkillsInfoByEmail:", error.message);
    throw new Error(`Database error: ${error.message}`);
  } finally {
    connection.release();
  }
};

const updateSkillsInfo = async (email, updates) => {
  const connection = await pool.getConnection();
  try {
    const fields = Object.keys(updates).map((key) => {
      if (key === "skills") {
        return `${key} = ?`;
      }
      return `${key} = ?`;
    }).join(", ");
    const values = Object.values(updates).map((value) => {
      if (Array.isArray(value)) {
        return JSON.stringify(value);
      }
      return value;
    });

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
    console.error("Database error in updateSkillsInfo:", error.message);
    throw new Error(`Database error: ${error.message}`);
  } finally {
    connection.release();
  }
};

export default { getSkillsInfoByEmail, updateSkillsInfo };