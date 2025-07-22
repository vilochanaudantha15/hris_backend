import loanModel from "../Models/loanModel.js";
import XLSX from "xlsx";
import multer from "multer";
import { pool } from "../config/db.js";

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

const uploadLoanExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer", raw: false }); // Ensure raw strings
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: "", blankrows: false });

    if (data.length === 0) {
      return res.status(400).json({ error: "Excel file is empty" });
    }

    const requiredFields = ['employee_no', 'monthly_loan_amount', 'loan_month'];
    const firstRow = data[0];
    for (const field of requiredFields) {
      if (!(field in firstRow)) {
        return res.status(400).json({ error: `Missing required column: ${field}` });
      }
    }

    const results = [];
    const errors = [];

    for (const row of data) {
      // Convert employee_no to string explicitly
      const employee_no = String(row.employee_no).trim();

      // Validate employee_no
      if (!employee_no) {
        errors.push(`Invalid employee_no: ${row.employee_no}. Must be a non-empty string`);
        continue;
      }

      // Validate monthly_loan_amount
      const loanAmount = Number(row.monthly_loan_amount);
      if (isNaN(loanAmount) || loanAmount <= 0) {
        errors.push(`Invalid loan amount for employee_no ${employee_no}: ${row.monthly_loan_amount}. Must be a positive number`);
        continue;
      }

      // Validate loan_month
      const loan_month = String(row.loan_month).trim();
      const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
      if (!monthRegex.test(loan_month)) {
        errors.push(`Invalid loan_month for employee_no ${employee_no}: ${loan_month}. Must be in YYYY-MM format`);
        continue;
      }

      try {
        const loanId = await loanModel.addLoan(employee_no, loanAmount, loan_month);
        results.push({
          employee_no,
          loan_month,
          loanId,
          message: `Loan for ${loan_month} recorded successfully`
        });
      } catch (error) {
        errors.push(`Error for employee_no ${employee_no} in ${loan_month}: ${error.message}`);
      }
    }

    res.status(200).json({
      message: "Excel upload processed",
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error("Error processing loan Excel upload:", error.message);
    res.status(500).json({ error: "Failed to process Excel upload", details: error.message });
  }
};

const getAllLoans = async (req, res) => {
  try {
    const { page = 1, limit = 10, employee_no } = req.query;
    const offset = (page - 1) * limit;

    const loans = await loanModel.getLoans({ employee_no }, page, limit);

    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) as total FROM loans";
    let countParams = [];
    if (employee_no) {
      countQuery += " WHERE employee_id = (SELECT id FROM employees WHERE emp_no = ?)";
      countParams.push(employee_no);
    }
    const [[total]] = await pool.query(countQuery, countParams);

    res.json({
      loans,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: total.total,
        totalPages: Math.ceil(total.total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching loans:", error);
    res.status(500).json({ error: "Failed to fetch loans" });
  }
};

export default { uploadLoanExcel: [upload.single('file'), uploadLoanExcel], getAllLoans };