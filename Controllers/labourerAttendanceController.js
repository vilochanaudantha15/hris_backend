import labourerAttendanceModel from "../Models/labourerAttendanceModel.js";
import { pool } from "../config/db.js";
import attendanceModel from "../Models/attendanceModel.js";

const calculateHours = (inTime, outTime) => {
  const inDate = new Date(`1970-01-01T${inTime}:00`);
  let outDate = new Date(`1970-01-01T${outTime}:00`);
  if (outTime === '00:00') outDate = new Date(`1970-01-02T${outTime}:00`); // Handle midnight for Night shift
  const diff = (outDate - inDate) / (1000 * 60 * 60); // in hours
  const total = diff > 0 ? parseFloat(diff.toFixed(2)) : 0;
  const regular = total > 0 ? parseFloat(Math.min(total, 8).toFixed(2)) : 0;
  const ot = total > 8 ? parseFloat((total - 8).toFixed(2)) : 0;
  return { total, regular, ot };
};

const getRosterData = async (req, res) => {
  try {
    const { plantId, startDate, endDate, shift } = req.query;
    if (!plantId || !startDate) {
      return res.status(400).json({ error: "Plant ID and start date are required" });
    }

    const shiftTimes = {
      Morning: { inTime: '00:00', outTime: '07:00' },
      Day: { inTime: '07:00', outTime: '16:00' },
      Night: { inTime: '16:00', outTime: '00:00' }
    };

    let query = `
      SELECT 
        r.plant_id,
        pp.name AS plant_name,
        r.date,
        r.shift,
        r.supervisor_id,
        e1.name AS supervisor_name,
        'Supervisor' AS role,
        e1.id AS employee_id,
        e1.name AS employee_name,
        COALESCE(ce.event_type = 'public26public', 0) AS is_holiday
      FROM rosters r
      JOIN power_plants pp ON r.plant_id = pp.id
      JOIN employees e1 ON r.supervisor_id = e1.id
      LEFT JOIN calendar_events ce ON r.date = ce.date
      WHERE r.plant_id = ? AND r.date >= ?
      UNION
      SELECT 
        r.plant_id,
        pp.name AS plant_name,
        r.date,
        r.shift,
        r.supervisor_id,
        e1.name AS supervisor_name,
        'Laborer' AS role,
        e2.id AS employee_id,
        e2.name AS employee_name,
        COALESCE(ce.event_type = 'public', 0) AS is_holiday
      FROM rosters r
      JOIN power_plants pp ON r.plant_id = pp.id
      JOIN employees e1 ON r.supervisor_id = e1.id
      JOIN roster_laborers rl ON r.id = rl.roster_id
      JOIN employees e2 ON rl.laborer_id = e2.id
      LEFT JOIN calendar_events ce ON r.date = ce.date
      WHERE r.plant_id = ? AND r.date >= ?
    `;

    const params = [plantId, startDate, plantId, startDate];
    if (endDate) {
      query += ` AND r.date <= ?`;
      params.push(endDate, endDate);
    }
    if (shift && shift !== 'all') {
      query += ` AND r.shift = ?`;
      params.push(shift, shift);
    }

    const [rows] = await pool.query(query, params);

    // Aggregate data by employee
    const summary = {};
    rows.forEach(row => {
      const employeeId = row.employee_id;
      if (!summary[employeeId]) {
        summary[employeeId] = {
          employee_id: employeeId,
          employee_name: row.employee_name,
          plant_name: row.plant_name,
          role: row.role,
          supervisor_id: row.supervisor_id,
          total_shifts: 0,
          total_hours: 0,
          total_ot_hours: 0,
          total_dot: 0,
          morning_shifts: 0,
          day_shifts: 0,
          night_shifts: 0,
          total_payable_hours: 0
        };
      }

      const hours = calculateHours(shiftTimes[row.shift].inTime, shiftTimes[row.shift].outTime);
      summary[employeeId].total_shifts += 1;
      summary[employeeId].total_hours += hours.total;
      summary[employeeId].total_ot_hours += row.is_holiday ? hours.ot * 2 : hours.ot;
      summary[employeeId].total_payable_hours += hours.regular + (row.is_holiday ? hours.ot * 2 : hours.ot);
      summary[employeeId].total_dot += row.is_holiday ? 1 : 0;
      if (row.shift === 'Morning') summary[employeeId].morning_shifts += 1;
      if (row.shift === 'Day') summary[employeeId].day_shifts += 1;
      if (row.shift === 'Night') summary[employeeId].night_shifts += 1;
    });

    // Sort by role (Supervisors first) and supervisor_id
    const sortedSummary = Object.values(summary).sort((a, b) => {
      if (a.role === 'Supervisor' && b.role !== 'Supervisor') return -1;
      if (a.role !== 'Supervisor' && b.role === 'Supervisor') return 1;
      return a.supervisor_id - b.supervisor_id;
    });

    res.status(200).json(sortedSummary);
  } catch (error) {
    console.error("Error fetching roster data:", error.message);
    res.status(500).json({ error: "Failed to fetch roster data", details: error.message });
  }
};

const createBulkAttendance = async (req, res) => {
  try {
    const attendanceRecords = req.body;
    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({ error: "No attendance records provided" });
    }

    const results = [];
    const errors = [];

    for (const record of attendanceRecords) {
      const { plantId, employeeId, employeeName, date, shift, inTime, outTime, status } = record;

      if (!plantId || !employeeId || !employeeName || !date || !shift || !inTime || !outTime) {
        errors.push(`Missing required fields for employee ${employeeId}`);
        continue;
      }

      if (!['Morning', 'Day', 'Night'].includes(shift)) {
        errors.push(`Invalid shift for employee ${employeeId}: ${shift}`);
        continue;
      }

      if (status && !['Pending', 'Approved', 'Rejected'].includes(status)) {
        errors.push(`Invalid status for employee ${employeeId}: ${status}`);
        continue;
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        errors.push(`Invalid date format for employee ${employeeId}: ${date}`);
        continue;
      }

      const [plantRows] = await pool.query("SELECT id FROM power_plants WHERE id = ?", [plantId]);
      if (plantRows.length === 0) {
        errors.push(`Plant not found for employee ${employeeId}: ${plantId}`);
        continue;
      }

      const [employeeRows] = await pool.query(
        "SELECT id, name FROM employees WHERE id = ? AND plant_id = ?",
        [employeeId, plantId]
      );
      if (employeeRows.length === 0) {
        errors.push(`Employee not found or not assigned to plant for employee ${employeeId}`);
        continue;
      }

      const isHoliday = await labourerAttendanceModel.isPublicHoliday(date);
      const hours = calculateHours(inTime, outTime);
      const otHours = isHoliday ? parseFloat((hours.ot * 2).toFixed(2)) : hours.ot;
      const dot = isHoliday ? 1 : 0;

      const attendanceId = await labourerAttendanceModel.addAttendance(
        plantId,
        employeeId,
        employeeName,
        date,
        shift,
        inTime,
        outTime,
        hours.total,
        hours.regular,
        otHours,
        dot,
        status || 'Pending'
      );

      results.push({ employeeId, employeeName, attendanceId, message: "Attendance recorded successfully" });
    }

    res.status(200).json({
      message: "Bulk attendance processed",
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error("Error processing bulk attendance:", error.message);
    res.status(500).json({ error: "Failed to process bulk attendance", details: error.message });
  }
};

const getAttendanceSummary = async (req, res) => {
  try {
    const { plantId, year, month } = req.query;
    if (!plantId || !year || !month) {
      return res.status(400).json({ error: "Plant ID, year, and month are required" });
    }
    const attendanceSummary = await attendanceModel.getAttendanceSummaryByPlantAndMonth(plantId, year, month);
    res.status(200).json(attendanceSummary);
  } catch (error) {
    console.error("Error fetching attendance summary:", error.message);
    res.status(500).json({ error: "Failed to fetch attendance summary", details: error.message });
  }
};

export default { getRosterData, createBulkAttendance, getAttendanceSummary };