import { pool } from "../config/db.js";

const addTelephoneBill = async (employee_id, monthly_bill_amount, bill_month) => {
  // Verify employee exists
  const [employeeRows] = await pool.query(
    "SELECT id FROM employees WHERE id = ?",
    [employee_id]
  );
  if (employeeRows.length === 0) {
    throw new Error(`Employee not found for employee_id ${employee_id}`);
  }

  // Validate bill_month format (YYYY-MM)
  if (!/^\d{4}-\d{2}$/.test(bill_month)) {
    throw new Error(`Invalid bill month: ${bill_month}. Must be in YYYY-MM format`);
  }
  const [year, month] = bill_month.split('-');
  if (parseInt(month) < 1 || parseInt(month) > 12) {
    throw new Error(`Invalid month in bill_month: ${bill_month}. Month must be between 01 and 12`);
  }

  // Check for existing bill for this employee and month
  const [existingRows] = await pool.query(
    "SELECT id FROM telephone_bills WHERE employee_id = ? AND bill_month = ?",
    [employee_id, bill_month]
  );
  if (existingRows.length > 0) {
    throw new Error(`Telephone bill already exists for employee_id ${employee_id} for month ${bill_month}`);
  }

  const [result] = await pool.query(
    `INSERT INTO telephone_bills (employee_id, monthly_bill_amount, bill_month)
     VALUES (?, ?, ?)`,
    [employee_id, monthly_bill_amount, bill_month]
  );
  return result.insertId;
};

const getAllTelephoneBills = async () => {
  const [rows] = await pool.query(
    `SELECT tb.id, tb.employee_id, e.emp_no, e.name AS employee_name, tb.monthly_bill_amount, tb.bill_month, tb.created_at
     FROM telephone_bills tb
     LEFT JOIN employees e ON tb.employee_id = e.id
     ORDER BY tb.bill_month DESC, tb.employee_id`
  );
  return rows;
};

export default { addTelephoneBill, getAllTelephoneBills };