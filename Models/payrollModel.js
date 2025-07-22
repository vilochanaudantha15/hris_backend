import { pool } from "../config/db.js";

const getAllEmployees = async () => {
  const connection = await pool.getConnection();
  try {
    console.log("Fetching all employees");
    const queryString = `
      SELECT id, email, name
      FROM employees`;
    const [rows] = await connection.execute(queryString);
    return rows;
  } catch (error) {
    console.error("Database error in getAllEmployees:", error.message);
    throw new Error(`Database error: ${error.message}`);
  } finally {
    connection.release();
  }
};

const getPayrollInfoByEmployeeId = async (employeeId) => {
  const connection = await pool.getConnection();
  try {
    console.log(`Querying payroll for employeeId: ${employeeId}`);
    const queryString = `
      SELECT annual_salary, monthly_salary, pay_grade, job_level, bank_name, 
             account_number, branch, tax_id, tax_filing_status, bank_code, branch_code, transaction_type
      FROM employees
      WHERE id = ?`;
    const [rows] = await connection.execute(queryString, [employeeId]);

    if (rows.length === 0) {
      console.log(`No employee found for employeeId: ${employeeId}`);
      return null;
    }

    const employee = rows[0];
    return {
      payroll: {
        annualSalary: employee.annual_salary || "",
        monthlySalary: employee.monthly_salary || "",
        payGrade: employee.pay_grade || "",
        jobLevel: employee.job_level || "",
        bankName: employee.bank_name || "",
        accountNumber: employee.account_number || "",
        branch: employee.branch || "",
        taxId: employee.tax_id || "",
        taxFilingStatus: employee.tax_filing_status || "",
        bankCode: employee.bank_code || "",
        branchCode: employee.branch_code || "",
        transactionType: employee.transaction_type || "", // Added new field
      },
    };
  } catch (error) {
    console.error("Database error in getPayrollInfoByEmployeeId:", error.message);
    throw new Error(`Database error: ${error.message}`);
  } finally {
    connection.release();
  }
};

const updatePayrollInfo = async (employeeId, updates) => {
  const connection = await pool.getConnection();
  try {
    console.log(`Updating payroll for employeeId: ${employeeId}, updates: ${JSON.stringify(updates)}`);
    const queryString = `
      UPDATE employees 
      SET annual_salary = ?, monthly_salary = ?, pay_grade = ?, job_level = ?, 
          bank_name = ?, account_number = ?, branch = ?, tax_id = ?, 
          tax_filing_status = ?, bank_code = ?, branch_code = ?, transaction_type = ?
      WHERE id = ?`;
    const [result] = await connection.execute(queryString, [
      updates.annualSalary,
      updates.monthlySalary,
      updates.payGrade,
      updates.jobLevel,
      updates.bankName,
      updates.accountNumber,
      updates.branch,
      updates.taxId,
      updates.taxFilingStatus,
      updates.bankCode,
      updates.branchCode,
      updates.transactionType, // Added new field
      employeeId,
    ]);
    console.log(`Update result: ${JSON.stringify(result)}`);
    return result;
  } catch (error) {
    console.error("Database error in updatePayrollInfo:", error.message);
    throw new Error(`Database error: ${error.message}`);
  } finally {
    connection.release();
  }
};

export default { getAllEmployees, getPayrollInfoByEmployeeId, updatePayrollInfo };