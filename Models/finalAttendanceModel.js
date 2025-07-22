import { pool } from "../config/db.js";

const getAllExecutives = async (plantId) => {
  const query = `
    SELECT e.id AS employee_id, e.name AS employee_name, pp.name AS plant_name
    FROM employees e
    JOIN power_plants pp ON e.plant_id = pp.id
    WHERE e.plant_id = ? AND e.user_type = 'Executive'
    ORDER BY e.id ASC
  `;
  const [rows] = await pool.execute(query, [plantId]);
  return rows;
};

const getFinalAttendanceSummary = async (plantId, year, month) => {
  const query = `
    SELECT 
      far.employee_id,
      e.name AS employee_name,
      pp.name AS plant_name,
      far.total_days_worked,
      far.no_pay_days,
      far.holiday_claims,
      far.leave_days,
      far.salary_month,
      far.approved_at
    FROM final_attendance_records far
    JOIN employees e ON far.employee_id = e.id
    JOIN power_plants pp ON far.plant_id = pp.id
    WHERE far.plant_id = ? AND far.year = ? AND far.month = ?
    ORDER BY far.employee_id ASC
  `;
  const [rows] = await pool.execute(query, [plantId, year, month]);
  return rows;
};

const saveFinalAttendance = async (plantId, year, month, attendanceData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const record of attendanceData) {
      await connection.execute(
        `INSERT INTO final_attendance_records 
         (plant_id, employee_id, year, month, salary_month, total_days_worked, no_pay_days, holiday_claims, leave_days, approved_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE
         salary_month = VALUES(salary_month),
         total_days_worked = VALUES(total_days_worked),
         no_pay_days = VALUES(no_pay_days),
         holiday_claims = VALUES(holiday_claims),
         leave_days = VALUES(leave_days),
         approved_at = CURRENT_TIMESTAMP`,
        [
          plantId,
          record.employee_id,
          year,
          month,
          record.salary_month,
          record.total_days_worked,
          record.no_pay_days,
          record.holiday_claims,
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

export default { getAllExecutives, getFinalAttendanceSummary, saveFinalAttendance };