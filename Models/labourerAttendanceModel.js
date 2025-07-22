import { pool } from "../config/db.js";

const isPublicHoliday = async (date) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as count 
     FROM calendar_events 
     WHERE date = ? AND event_type = 'public'`,
    [date]
  );
  return rows[0].count > 0;
};

const addAttendance = async (
  plantId,
  employeeId,
  employeeName,
  date,
  shift,
  inTime,
  outTime,
  totalHours,
  regularHours,
  otHours,
  dot,
  status = 'Pending'
) => {
  const [result] = await pool.query(
    `INSERT INTO attendance_records 
     (plant_id, employee_id, employee_name, date, shift, in_time, out_time, total_hours, regular_hours, ot_hours, dot_hours, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ? , ?, ?, ?)`,
    [
      plantId,
      employeeId,
      employeeName,
      date,
      shift,
      inTime,
      outTime,
      totalHours,
      regularHours,
      otHours,
      dot,
      status
    ]
  );
  return result.insertId;
};

export default { isPublicHoliday, addAttendance };