import { pool } from "../config/db.js";
import moment from "moment";

const getAllPowerPlants = async () => {
  const query = "SELECT id, name FROM power_plants ORDER BY name ASC";
  const [rows] = await pool.execute(query);
  return rows;
};

const getWorkdaysInMonth = async (year, month) => {
  const startDate = moment(`${year}-${month}-01`, "YYYY-MM-DD");
  const endDate = moment(startDate).endOf("month");
  const [holidays] = await pool.query(
    `SELECT date FROM holidays WHERE type = 'public' AND date BETWEEN ? AND ?`,
    [startDate.format("YYYY-MM-DD"), endDate.format("YYYY-MM-DD")]
  );

  // Ensure holidays are formatted as YYYY-MM-DD strings
  const holidayDates = holidays.map((h) => moment(h.date).format("YYYY-MM-DD"));
  const workdays = [];

  for (let date = moment(startDate); date <= endDate; date.add(1, "day")) {
    const dayOfWeek = date.day();
    const dateStr = date.format("YYYY-MM-DD");
    // Include Monday to Friday, exclude public holidays
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && !holidayDates.includes(dateStr)) {
      workdays.push(dateStr);
    }
  }
  return workdays;
};

const getExecutiveSummary = async (plantId, year, month) => {
  const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
  const endDate = moment(startDate).endOf("month").format("YYYY-MM-DD");

  const [employees] = await pool.query(
    `SELECT e.id AS employee_id, e.name AS employee_name, pp.name AS plant_name
     FROM employees e
     JOIN power_plants pp ON e.plant_id = pp.id
     WHERE e.plant_id = ? AND e.user_type = 'Executive'`,
    [plantId]
  );

  // Get all workdays for the month
  const workdays = await getWorkdaysInMonth(year, month);
  const totalWorkdaysInMonth = workdays.length;

  // Get all public holidays for the month
  const [holidays] = await pool.query(
    `SELECT date FROM holidays WHERE type = 'public' AND date BETWEEN ? AND ?`,


    [startDate, endDate]
  );
  const holidayDates = holidays.map((h) => moment(h.date).format("YYYY-MM-DD"));

  // Get all Sundays for the month
  const sundayDates = [];
  for (let date = moment(startDate); date <= moment(endDate); date.add(1, "day")) {
    if (date.day() === 0) { // Sunday
      sundayDates.push(date.format("YYYY-MM-DD"));
    }
  }
  // Combine public holidays and Sundays, removing duplicates
  const allHolidayDates = [...new Set([...holidayDates, ...sundayDates])];

  const summary = [];
  for (const emp of employees) {
    // Get all attendance records for the employee
    const [attendanceRecords] = await pool.query(
      `SELECT date
       FROM executive_attendance_records
       WHERE employee_id = ? AND plant_id = ? AND date BETWEEN ? AND ?`,
      [emp.employee_id, plantId, startDate, endDate]
    );
    // Ensure attendance dates are formatted consistently
    const workedDates = attendanceRecords.map((d) => moment(d.date).format("YYYY-MM-DD"));
    const totalDaysWorked = workedDates.length;

    // Check each attendance record for holiday claims (public holidays or Sundays)
    let holidayClaimsCount = 0;
    for (const workedDate of workedDates) {
      if (allHolidayDates.includes(workedDate)) {
        holidayClaimsCount++;
      }
    }

    // Get all approved leaves that overlap with the month
    const [leaveDays] = await pool.query(
      `SELECT start_date, end_date
       FROM leaves
       WHERE employee_id = ? AND 
             ((start_date BETWEEN ? AND ?) OR 
              (end_date BETWEEN ? AND ?) OR
              (start_date <= ? AND end_date >= ?))
             AND status = 'Approved'`,
      [emp.employee_id, startDate, endDate, startDate, endDate, startDate, endDate]
    );

    // Calculate leave days
    let daysOnLeave = 0;
    leaveDays.forEach(leave => {
      const leaveStart = moment.max(moment(leave.start_date), moment(startDate));
      // Handle NULL end_date by setting it to start_date (single-day leave)
      const leaveEnd = leave.end_date ? moment.min(moment(leave.end_date), moment(endDate)) : leaveStart;
      
      // Calculate leave days for workdays only
      workdays.forEach(workday => {
        const currentDay = moment(workday);
        if (currentDay.isBetween(leaveStart, leaveEnd, null, '[]') && 
            !workedDates.includes(workday)) {
          daysOnLeave++;
        }
      });
    });

    // No-pay days = Total workdays - days worked - days on approved leave
    const noPayDays = totalWorkdaysInMonth - totalDaysWorked - daysOnLeave;

    summary.push({
      employee_id: emp.employee_id,
      employee_name: emp.employee_name,
      plant_name: emp.plant_name,
      total_days_worked: totalDaysWorked,
      no_pay_days: noPayDays,
      holiday_claims: holidayClaimsCount,
      leave_days: daysOnLeave,
    });
  }

  return summary;
};

const saveExecutiveSummary = async (plantId, year, month, summaryData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const record of summaryData) {
      await connection.execute(
        `INSERT INTO executive_summary_records 
         (plant_id, employee_id, year, month, total_days_worked, no_pay_days, holiday_claims, leave_days, approved_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          plantId,
          record.employee_id,
          year,
          month,
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

export default { getAllPowerPlants, getExecutiveSummary, saveExecutiveSummary };