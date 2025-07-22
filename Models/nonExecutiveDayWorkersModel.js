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

const getNonExecutiveSummary = async (plantId, year, month) => {
  const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
  const endDate = moment(startDate).endOf("month").format("YYYY-MM-DD");

  const [employees] = await pool.query(
    `SELECT e.id AS employee_id, e.name AS employee_name, pp.name AS plant_name
     FROM employees e
     JOIN power_plants pp ON e.plant_id = pp.id
     WHERE e.plant_id = ? AND e.user_type = 'NonExecutive'`,
    [plantId]
  );

  // Get all workdays for the month
  const workdays = await getWorkdaysInMonth(year, month);
  const totalWorkdaysInMonth = workdays.length;

  const summary = [];
  for (const emp of employees) {
    // Get all attendance records for the employee
    const [attendanceRecords] = await pool.query(
      `SELECT date, ot_hours, dot_hours
       FROM attendance_records
       WHERE employee_id = ? AND plant_id = ? AND date BETWEEN ? AND ?`,
      [emp.employee_id, plantId, startDate, endDate]
    );

    // Ensure attendance dates are formatted consistently
    const workedDates = attendanceRecords.map((d) => moment(d.date).format("YYYY-MM-DD"));
    const totalDaysWorked = workedDates.length;

    // Calculate total OT and DOT hours
    let totalOTHours = 0;
    let totalDOTHours = 0;
    attendanceRecords.forEach(record => {
      totalOTHours += record.ot_hours || 0;
      totalDOTHours += record.dot_hours || 0;
    });

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
      ot_hours: totalOTHours,
      dot_hours: totalDOTHours,
      leave_days: daysOnLeave,
    });
  }

  return summary;
};

const saveNonExecutiveSummary = async (plantId, year, month, summaryData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const record of summaryData) {
      await connection.execute(
        `INSERT INTO non_executive_summary_records 
         (plant_id, employee_id, year, month, total_days_worked, no_pay_days, ot_hours, dot_hours, leave_days, approved_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          plantId,
          record.employee_id,
          year,
          month,
          record.total_days_worked,
          record.no_pay_days,
          record.ot_hours,
          record.dot_hours,
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

export default { getAllPowerPlants, getNonExecutiveSummary, saveNonExecutiveSummary };