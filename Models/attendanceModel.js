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
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

const getAttendanceSummaryByPlantAndMonth = async (plantId, year, month) => {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of the month
  const [rows] = await pool.query(
    `SELECT 
      ar.employee_id,
      e.name AS employee_name,
      pp.name AS plant_name,
      COUNT(ar.id) AS total_shifts,
      SUM(ar.ot_hours) AS total_ot_hours,
      SUM(ar.dot_hours) AS total_dot,
      SUM(CASE WHEN ar.shift = 'Morning' THEN 1 ELSE 0 END) AS morning_shifts,
      SUM(CASE WHEN ar.shift = 'Day' THEN 1 ELSE 0 END) AS day_shifts,
      SUM(CASE WHEN ar.shift = 'Night' THEN 1 ELSE 0 END) AS night_shifts,
      SUM(ar.regular_hours + COALESCE(ar.ot_hours, 0)) AS total_payable_hours,
      SUM(CASE WHEN ar.dot_hours = 1 THEN ar.total_hours ELSE 0 END) AS holiday_hours,
      GROUP_CONCAT(DISTINCT ar.status) AS status
     FROM attendance_records ar
     JOIN power_plants pp ON ar.plant_id = pp.id
     JOIN employees e ON ar.employee_id = e.id
     WHERE ar.plant_id = ? AND ar.date BETWEEN ? AND ?
     GROUP BY ar.employee_id, e.name, pp.name
     ORDER BY e.name`,
    [plantId, startDate, endDate]
  );
  return rows.map(row => ({
    ...row,
    total_shifts: parseInt(row.total_shifts) || 0,
    total_ot_hours: parseFloat(row.total_ot_hours) || 0,
    total_dot: parseInt(row.total_dot) || 0,
    morning_shifts: parseInt(row.morning_shifts) || 0,
    day_shifts: parseInt(row.day_shifts) || 0,
    night_shifts: parseInt(row.night_shifts) || 0,
    total_payable_hours: parseFloat(row.total_payable_hours) || 0,
    holiday_hours: parseFloat(row.holiday_hours) || 0,
  }));
};

export default { isPublicHoliday, addAttendance, getAttendanceSummaryByPlantAndMonth };