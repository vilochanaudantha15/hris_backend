import { pool } from "../config/db.js";

const isHolidayOrSunday = async (date) => {
  // Check if the date is a public holiday
  const [holidayRows] = await pool.query(
    `SELECT COUNT(*) as count 
     FROM calendar_events 
     WHERE date = ? AND event_type = 'public'`,
    [date]
  );

  // Check if the date is a Sunday
  const isSunday = new Date(date).getDay() === 0;

  return holidayRows[0].count > 0 || isSunday;
};

const addExecutiveAttendance = async (
  plantId,
  employeeId,
  employeeName,
  date,
  shift,
  inTime,
  outTime,
  totalHours,
  regularHours,
  holidayPay,
  status = 'Pending'
) => {
  const [result] = await pool.query(
    `INSERT INTO executive_attendance_records 
     (plant_id, employee_id, employee_name, date, shift, in_time, out_time, total_hours, regular_hours, holiday_pay, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      holidayPay,
      status
    ]
  );
  return result.insertId;
};

const getExecutiveAttendanceSummaryByPlantAndMonth = async (plantId, year, month) => {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of the month
  const [rows] = await pool.query(
    `SELECT 
      ar.employee_id,
      e.name AS employee_name,
      pp.name AS plant_name,
      COUNT(ar.id) AS total_shifts,
      SUM(ar.holiday_pay) AS total_holiday_pay_days,
      SUM(CASE WHEN ar.shift = 'Morning' THEN 1 ELSE 0 END) AS morning_shifts,
      SUM(CASE WHEN ar.shift = 'Day' THEN 1 ELSE 0 END) AS day_shifts,
      SUM(CASE WHEN ar.shift = 'Night' THEN 1 ELSE 0 END) AS night_shifts,
      SUM(ar.regular_hours) AS total_payable_hours,
      SUM(CASE WHEN ar.holiday_pay = 1 THEN ar.total_hours ELSE 0 END) AS holiday_hours,
      GROUP_CONCAT(DISTINCT ar.status) AS status
     FROM executive_attendance_records ar
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
    total_holiday_pay_days: parseInt(row.total_holiday_pay_days) || 0,
    morning_shifts: parseInt(row.morning_shifts) || 0,
    day_shifts: parseInt(row.day_shifts) || 0,
    night_shifts: parseInt(row.night_shifts) || 0,
    total_payable_hours: parseFloat(row.total_payable_hours) || 0,
    holiday_hours: parseFloat(row.holiday_hours) || 0,
  }));
};

export default { isHolidayOrSunday, addExecutiveAttendance, getExecutiveAttendanceSummaryByPlantAndMonth };