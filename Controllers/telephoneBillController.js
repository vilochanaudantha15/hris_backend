import telephoneBillModel from "../Models/telephoneBillModel.js";
import XLSX from "xlsx";
import multer from "multer";
import { pool } from "../config/db.js";

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

const uploadTelephoneBillExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return res.status(400).json({ error: "Excel file is empty" });
    }

    const requiredFields = ['employee_no', 'monthly_bill_amount', 'bill_month'];
    const firstRow = data[0];
    for (const field of requiredFields) {
      if (!(field in firstRow)) {
        return res.status(400).json({ error: `Missing required column: ${field}` });
      }
    }

    const results = [];
    const errors = [];

    for (const row of data) {
      const { employee_no, monthly_bill_amount, bill_month } = row;

      // Validate employee_no
      const [employeeRows] = await pool.query(
        "SELECT id FROM employees WHERE emp_no = ?",
        [employee_no]
      );
      if (employeeRows.length === 0) {
        errors.push(`Employee not found for employee_no: ${employee_no}`);
        continue;
      }
      const employee_id = employeeRows[0].id;

      // Validate monthly_bill_amount
      if (typeof monthly_bill_amount !== 'number' || monthly_bill_amount <= 0) {
        errors.push(`Invalid bill amount for employee_no ${employee_no}: ${monthly_bill_amount}. Must be a positive number`);
        continue;
      }

      // Validate bill_month format (YYYY-MM)
      if (!/^\d{4}-\d{2}$/.test(bill_month)) {
        errors.push(`Invalid bill month for employee_no ${employee_no}: ${bill_month}. Must be in YYYY-MM format`);
        continue;
      }

      try {
        const billId = await telephoneBillModel.addTelephoneBill(employee_id, monthly_bill_amount, bill_month);
        results.push({
          employee_no,
          billId,
          bill_month,
          message: "Telephone bill recorded successfully"
        });
      } catch (error) {
        errors.push(`Error for employee_no ${employee_no}: ${error.message}`);
      }
    }

    res.status(200).json({
      message: "Excel upload processed",
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error("Error processing telephone bill Excel upload:", error.message);
    res.status(500).json({ error: "Failed to process Excel upload", details: error.message });
  }
};

const getAllTelephoneBills = async (req, res) => {
  try {
    const bills = await telephoneBillModel.getAllTelephoneBills();
    if (bills.length === 0) {
      return res.status(200).json({ message: "No telephone bills found", data: [] });
    }
    res.status(200).json({
      message: "Telephone bills retrieved successfully",
      data: bills
    });
  } catch (error) {
    console.error("Error fetching telephone bills:", error.message);
    res.status(500).json({ error: "Failed to fetch telephone bills", details: error.message });
  }
};

export default { 
  uploadTelephoneBillExcel: [upload.single('file'), uploadTelephoneBillExcel],
  getAllTelephoneBills
};