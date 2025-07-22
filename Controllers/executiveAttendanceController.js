import executiveAttendanceModel from "../Models/executiveAttendanceModel.js";
import { pool } from "../config/db.js";
import XLSX from "xlsx";
import multer from "multer";
import moment from "moment";

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

const calculateHours = (inTime, outTime) => {
  const inDate = new Date(`1970-01-01T${inTime}:00`);
  const outDate = new Date(`1970-01-01T${outTime}:00`);
  const diff = (outDate - inDate) / (1000 * 60 * 60); // in hours
  const total = diff > 0 ? parseFloat(diff.toFixed(2)) : 0;
  const regular = total > 0 ? parseFloat(Math.min(total, 8).toFixed(2)) : 0;
  return { total, regular };
};

// Convert Excel serial date to YYYY-MM-DD
const excelSerialToDate = (serial) => {
  if (typeof serial === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000);
    return moment(date).format('YYYY-MM-DD');
  }
  return null;
};

// Convert Excel time serial to HH:mm
const excelTimeToString = (serial) => {
  if (typeof serial === 'number' && serial >= 0 && serial < 1) {
    const totalMinutes = Math.round(serial * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  return null;
};

const createExecutiveAttendance = async (req, res) => {
  try {
    const { plantId, employeeId, date, shift, inTime, outTime, status } = req.body;

    if (!plantId || !employeeId || !date || !shift || !inTime || !outTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!['Morning', 'Day', 'Night'].includes(shift)) {
      return res.status(400).json({ error: "Invalid shift" });
    }

    if (status && !['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date format. Expected YYYY-MM-DD" });
    }

    const [plantRows] = await pool.query("SELECT id FROM power_plants WHERE id = ?", [plantId]);
    if (plantRows.length === 0) {
      return res.status(404).json({ error: "Plant not found" });
    }

    const [employeeRows] = await pool.query(
      "SELECT id, name FROM employees WHERE id = ? AND plant_id = ?",
      [employeeId, plantId]
    );
    if (employeeRows.length === 0) {
      return res.status(404).json({ error: "Employee not found or not assigned to this plant" });
    }
    const employeeName = employeeRows[0].name;

    const isHoliday = await executiveAttendanceModel.isHolidayOrSunday(date);
    const hours = calculateHours(inTime, outTime);

    const attendanceId = await executiveAttendanceModel.addExecutiveAttendance(
      plantId,
      employeeId,
      employeeName,
      date,
      shift,
      inTime,
      outTime,
      hours.total,
      hours.regular,
      isHoliday ? 1 : 0,
      status || 'Pending'
    );

    res.status(201).json({ id: attendanceId, message: "Executive attendance recorded successfully" });
  } catch (error) {
    console.error("Error creating executive attendance:", error.message);
    res.status(500).json({ error: "Failed to create executive attendance", details: error.message });
  }
};

const uploadExecutiveAttendanceExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer", dateNF: 'm/d/yyyy' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return res.status(400).json({ error: "Excel file is empty" });
    }

    const requiredFields = ['emp_no', 'name', 'plant', 'shift', 'in_time', 'out_time', 'date'];
    const firstRow = data[0];
    for (const field of requiredFields) {
      if (!(field in firstRow)) {
        return res.status(400).json({ error: `Missing required column: ${field}` });
      }
    }

    const results = [];
    const errors = [];

    for (const row of data) {
      const { emp_no, name, plant, shift, in_time, out_time, date } = row;

      if (!['Morning', 'Day', 'Night'].includes(shift)) {
        errors.push(`Invalid shift for employee ${emp_no}: ${shift}. Expected 'Morning', 'Day', or 'Night'`);
        continue;
      }

      let formattedDate;
      if (typeof date === 'number') {
        formattedDate = excelSerialToDate(date);
        if (!formattedDate || !moment(formattedDate, 'YYYY-MM-DD', true).isValid()) {
          errors.push(`Invalid Excel date serial for employee ${emp_no}: ${date}`);
          continue;
        }
      } else {
        const parsedDate = moment(date, ['M/D/YYYY', 'M/D/YY'], true);
        if (!parsedDate.isValid()) {
          errors.push(`Invalid date format for employee ${emp_no}: ${date}. Expected M/D/YYYY or M/D/YY`);
          continue;
        }
        formattedDate = parsedDate.format('YYYY-MM-DD');
      }

      let formattedInTime, formattedOutTime;
      if (typeof in_time === 'number') {
        const timeStr = excelTimeToString(in_time);
        if (!timeStr) {
          errors.push(`Invalid Excel time serial for employee ${emp_no}: in_time=${in_time}`);
          continue;
        }
        formattedInTime = timeStr;
      } else {
        const parsedInTime = moment(in_time, ['HH:mm', 'h:mm A', 'h.mm A'], true);
        if (!parsedInTime.isValid()) {
          errors.push(`Invalid time format for employee ${emp_no}: in_time=${in_time}. Expected HH:mm, h:mm A, or h THR:mm A`);
          continue;
        }
        formattedInTime = parsedInTime.format('HH:mm');
      }

      if (typeof out_time === 'number') {
        const timeStr = excelTimeToString(out_time);
        if (!timeStr) {
          errors.push(`Invalid Excel time serial for employee ${emp_no}: out_time=${out_time}`);
          continue;
        }
        formattedOutTime = timeStr;
      } else {
        const parsedOutTime = moment(out_time, ['HH:mm', 'h:mm A', 'h.mm A'], true);
        if (!parsedOutTime.isValid()) {
          errors.push(`Invalid time format for employee ${emp_no}: out_time=${out_time}. Expected HH:mm, h:mm A, or h.mm A`);
          continue;
        }
        formattedOutTime = parsedOutTime.format('HH:mm');
      }

      const [plantRows] = await pool.query(
        "SELECT id FROM power_plants WHERE name = ?",
        [plant]
      );
      if (plantRows.length === 0) {
        errors.push(`Plant not found for employee ${emp_no}: ${plant}`);
        continue;
      }
      const plantId = plantRows[0].id;

      const [employeeRows] = await pool.query(
        "SELECT id, name FROM employees WHERE emp_no = ? AND plant_id = ?",
        [emp_no, plantId]
      );
      if (employeeRows.length === 0) {
        errors.push(`Employee not found or not assigned to plant for emp_no ${emp_no}`);
        continue;
      }
      const employeeId = employeeRows[0].id;
      const employeeName = employeeRows[0].name;

      const isHoliday = await executiveAttendanceModel.isHolidayOrSunday(formattedDate);
      const hours = calculateHours(formattedInTime, formattedOutTime);

      const attendanceId = await executiveAttendanceModel.addExecutiveAttendance(
        plantId,
        employeeId,
        employeeName,
        formattedDate,
        shift,
        formattedInTime,
        formattedOutTime,
        hours.total,
        hours.regular,
        isHoliday ? 1 : 0,
        'Pending'
      );

      results.push({ emp_no, name, attendanceId, message: "Executive attendance recorded successfully" });
    }

        res.status(200).json({
      message: "Excel upload processed",
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error("Error processing executive Excel upload:", error.message);
    res.status(500).json({ error: "Failed to process executive Excel upload", details: error.message });
  }
};

const getExecutiveAttendanceSummary = async (req, res) => {
  try {
    const { plantId, year, month } = req.query;
    if (!plantId || !year || !month) {
      return res.status(400).json({ error: "Plant ID, year, and month are required" });
    }
    const attendanceSummary = await executiveAttendanceModel.getExecutiveAttendanceSummaryByPlantAndMonth(plantId, year, month);
    res.status(200).json(attendanceSummary);
  } catch (error) {
    console.error("Error fetching executive attendance summary:", error.message);
    res.status(500).json({ error: "Failed to fetch executive attendance summary", details: error.message });
  }
};

export default { createExecutiveAttendance, getExecutiveAttendanceSummary, uploadExecutiveAttendanceExcel: [upload.single('file'), uploadExecutiveAttendanceExcel] };