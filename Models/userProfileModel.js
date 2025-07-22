import { pool } from "../config/db.js";

const getUserProfileByEmail = async (email) => {
  const connection = await pool.getConnection();
  try {
    console.log(`Querying database for email: ${email}`);
    const queryString = `
      SELECT e.id, e.name, e.emp_no, e.appointed_date, e.designation, e.contract_type,
             e.profile_pic_path, e.plant_id, p.name AS plant_name, e.email, e.mobile, 
             e.user_type, e.department, e.manager, e.skills, e.education, e.emergency_contact,
             e.nic_no, e.nic_issue_date, e.title, e.initials, e.last_name,
             e.other_names, e.gender, e.marital_status, e.date_of_birth, e.address_no,
             e.street, e.city, e.district, e.tel_no, e.mobile_no, e.email_address,
             e.police_station, e.gr_division, e.nationality, e.religion, e.key_role,
             e.grade_name, e.company, e.branch_name, e.manager_location, e.contract_end_date,
             e.epf_no, e.etf_no, e.job_description, e.medical_certificate, e.shift_basis,
             e.emergency_contact_name, e.emergency_contact_relationship, e.emergency_contact_no,
             e.emergency_contact_mobile, e.leave_l1, e.leave_l2, e.leave_clerk
      FROM employees e 
      LEFT JOIN power_plants p ON e.plant_id = p.id
      WHERE e.email = ?`;
  
    const [rows] = await connection.execute(queryString, [email]);

    if (rows.length === 0) {
      console.log(`No employee found for email: ${email}`);
      return null;
    }

    return rows[0];
  } catch (error) {
    console.error("Database error in getUserProfileByEmail:", error.message);
    throw new Error(`Database error: ${error.message}`);
  } finally {
    connection.release();
  }
};

const getAllEmployees = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      "SELECT id, name FROM employees"
    );
    return rows;
  } catch (error) {
    console.error("Database error in getAllEmployees:", error.message);
    throw new Error(`Database error: ${error.message}`);
  } finally {
    connection.release();
  }
};

export default { getUserProfileByEmail, getAllEmployees };