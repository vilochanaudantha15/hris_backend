import { pool } from "../config/db.js";

const getPersonalInfoByEmail = async (email) => {
  const connection = await pool.getConnection();
  try {
    console.log(`Querying database for email: ${email}`);
    const queryString = `
      SELECT 
        title, initials, last_name, other_names, gender, marital_status, date_of_birth,
        nic_no, nic_issue_date, address_no, street, city, district, tel_no, mobile_no,
        email_address, police_station, gr_division, nationality, religion,
        emergency_contact_name, emergency_contact_relationship, emergency_contact_no,
        emergency_contact_mobile
      FROM employees 
      WHERE email = ?`;

    const [rows] = await connection.execute(queryString, [email]);

    if (rows.length === 0) {
      console.log(`No employee found for email: ${email}`);
      return null;
    }

    return rows[0];
  } catch (error) {
    console.error("Database error in getPersonalInfoByEmail:", error.message);
    throw new Error(`Database error: ${error.message}`);
  } finally {
    connection.release();
  }
};

const updatePersonalInfo = async (email, updates) => {
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
    console.error("Database error in updatePersonalInfo:", error.message);
    throw new Error(`Database error: ${error.message}`);
  } finally {
    connection.release();
  }
};

export default { getPersonalInfoByEmail, updatePersonalInfo };