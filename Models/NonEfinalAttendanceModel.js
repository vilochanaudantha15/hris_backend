import { pool } from "../config/db.js";

const getAllNonExecutives = async (plantId) => {
  const query = `
    SELECT e.id AS employee_id, e.name AS employee_name, pp.name AS plant_name
    FROM employees e
    JOIN power_plants pp ON e.plant_id = pp.id
    WHERE e.plant_id = ? AND e.user_type = 'NonExecutive'
    ORDER BY e.id ASC
  `;
  const [rows] = await pool.execute(query, [plantId]);
  return rows;
};

const getNonExecutiveAttendanceSummary = async (plantId, year, month) => {
  const query = `
    SELECT 
      nar.employee_id,
      e.name AS employee_name,
      pp.name AS plant_name,
      nar.shift1,
      nar.shift2,
      nar.shift3,
      nar.ot,
      nar.dot,
      nar.no_pay_days,
      nar.leave_days,
      nar.salary_month,
      nar.approved_at
    FROM non_executive_attendance_records nar
    JOIN employees e ON nar.employee_id = e.id
    JOIN power_plants pp ON nar.plant_id = pp.id
    WHERE nar.plant_id = ? AND nar.year = ? AND nar.month = ?
    ORDER BY nar.employee_id ASC
  `;
  const [rows] = await pool.execute(query, [plantId, year, month]);
  return rows;
};

const saveNonExecutiveAttendance = async (plantId, year, month, attendanceData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const record of attendanceData) {
      await connection.execute(
        `INSERT INTO non_executive_attendance_records 
         (plant_id, employee_id, year, month, salary_month, shift1, shift2, shift3, ot, dot, no_pay_days, leave_days, approved_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE
         salary_month = VALUES(salary_month),
         shift1 = VALUES(shift1),
         shift2 = VALUES(shift2),
         shift3 = VALUES(shift3),
         ot = VALUES(ot),
         dot = VALUES(dot),
         no_pay_days = VALUES(no_pay_days),
         leave_days = VALUES(leave_days),
         approved_at = CURRENT_TIMESTAMP`,
        [
          plantId,
          record.employee_id,
          year,
          month,
          record.salary_month,
          record.shift1,
          record.shift2,
          record.shift3,
          record.ot,
          record.dot,
          record.no_pay_days,
          record.leave_days,
        ]
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export default { getAllNonExecutives, getNonExecutiveAttendanceSummary, saveNonExecutiveAttendance };