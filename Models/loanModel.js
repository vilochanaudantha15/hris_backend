import { pool } from "../config/db.js";

const addLoan = async (employee_no, monthly_loan_amount, loan_month) => {
  try {
    // Validate loan_month format (YYYY-MM)
    const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!monthRegex.test(loan_month)) {
      throw new Error(`Invalid loan_month format for employee_no ${employee_no}: ${loan_month}. Must be YYYY-MM`);
    }

    // Verify employee exists by emp_no
    const [employeeRows] = await pool.query(
      "SELECT id FROM employees WHERE emp_no = ?",
      [employee_no]
    );
    if (employeeRows.length === 0) {
      throw new Error(`Employee not found for employee_no ${employee_no}`);
    }
    const employee_id = employeeRows[0].id;

    const [result] = await pool.query(
      `INSERT INTO loans (employee_id, monthly_loan_amount, loan_month)
       VALUES (?, ?, ?)`,
      [employee_id, monthly_loan_amount, loan_month]
    );
    return result.insertId;
  } catch (error) {
    throw new Error(`Failed to add loan: ${error.message}`);
  }
};

const getLoans = async (filters = {}, page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;
    let query = `
      SELECT l.id, l.employee_id, l.monthly_loan_amount, l.loan_month, l.created_at,
             e.name as employee_name, e.emp_no
      FROM loans l
      JOIN employees e ON l.employee_id = e.id
    `;
    const params = [];

    // Add filtering logic
    if (filters.employee_no) {
      query += " WHERE e.emp_no = ?";
      params.push(filters.employee_no);
    }

    query += " ORDER BY l.created_at DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));

    const [loans] = await pool.query(query, params);
    return loans;
  } catch (error) {
    throw new Error(`Failed to fetch loans: ${error.message}`);
  }
};

export default { addLoan, getLoans };