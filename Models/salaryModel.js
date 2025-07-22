import { pool } from "../config/db.js";

const getEmployeeSalaries = async (year, month) => {
  try {
    const monthNum = parseInt(month, 10);
    const [employees] = await pool.execute(
      `SELECT 
        e.id, 
        e.emp_no, 
        e.name, 
        e.user_type,
        COALESCE(e.monthly_salary, 0) AS monthly_salary,
        COALESCE(SUM(l.monthly_loan_amount), 0) AS loan_amount,
        COALESCE(SUM(tb.monthly_bill_amount), 0) AS telephone_bill_amount,
        COALESCE(far.no_pay_days, nesr.no_pay_days, 0) AS no_pay_days,
        COALESCE(far.holiday_claims, 0) AS holiday_claims,
        COALESCE(far.leave_days, nesr.leave_days, 0) AS leave_days,
        COALESCE(nesr.ot, 0) AS ot_hours,
        COALESCE(nesr.dot, 0) AS dot_hours,
        COALESCE(far.salary_arrears, nesr.salary_arrears, 0) AS salary_arrears,
        e.bank_code,
        e.branch_code,
        e.account_number,
        e.nic_no,
        e.mobile_no
      FROM employees e
      LEFT JOIN loans l 
        ON e.id = l.employee_id
      LEFT JOIN telephone_bills tb 
        ON e.id = tb.employee_id
      LEFT JOIN final_attendance_records far 
        ON e.id = far.employee_id 
        AND far.year = ? 
        AND far.month = ?
      LEFT JOIN non_executive_attendance_records nesr 
        ON e.id = nesr.employee_id 
        AND nesr.year = ? 
        AND nesr.month = ?
        AND e.user_type = 'NonExecutive'
      GROUP BY 
        e.id, 
        e.emp_no, 
        e.name, 
        e.user_type, 
        e.monthly_salary, 
        far.no_pay_days, 
        far.holiday_claims, 
        far.leave_days,
        nesr.no_pay_days, 
        nesr.leave_days, 
        nesr.ot, 
        nesr.dot,
        far.salary_arrears,
        nesr.salary_arrears,
        e.bank_code,
        e.branch_code,
        e.account_number,
        e.nic_no,
        e.mobile_no`,
      [year, monthNum, year, monthNum]
    );
    return employees;
  } catch (error) {
    console.error(`Error fetching employee salaries for ${year}-${month}:`, error.message);
    throw error;
  }
};

const saveSalaries = async (salaries) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const salary of salaries) {
      const {
        employee_id, emp_no, employee_name, basic_salary, epf_deduction,
        employer_epf, etf, tax_deduction, loan_deduction, 
        telephone_bill_deduction, stamp_deduction, welfare_deduction,
        insurance_deduction, no_pay_days, no_pay_deduction, leave_days,
        holiday_claims, holiday_claim_amount, ot_hours, ot_amount,
        dot_hours, dot_amount, salary_arrears, gross_salary,
        total_deductions, net_pay, salary_month
      } = salary;

      if (!salary_month || !/^\d{4}-\d{2}$/.test(salary_month)) {
        throw new Error("Invalid or missing salary_month (YYYY-MM required)");
      }

      const [existing] = await connection.execute(
        "SELECT id FROM salaries WHERE employee_id = ? AND salary_month = ?",
        [employee_id, salary_month]
      );
      if (existing.length > 0) {
        throw new Error(`Salary for employee ${emp_no} for ${salary_month} already approved`);
      }

      await connection.execute(
        `INSERT INTO salaries (
          employee_id, emp_no, employee_name, basic_salary, epf_deduction,
          employer_epf, etf, tax_deduction, loan_deduction, 
          telephone_bill_deduction, stamp_deduction, welfare_deduction,
          insurance_deduction, no_pay_days, no_pay_deduction, leave_days, 
          holiday_claims, holiday_claim_amount, ot_hours, ot_amount, dot_hours, 
          dot_amount, salary_arrears, gross_salary, total_deductions, net_pay, 
          salary_month
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          employee_id, emp_no, employee_name, basic_salary, epf_deduction,
          employer_epf, etf, tax_deduction, loan_deduction,
          telephone_bill_deduction, stamp_deduction, welfare_deduction,
          insurance_deduction, no_pay_days, no_pay_deduction, leave_days,
          holiday_claims, holiday_claim_amount, ot_hours || null, ot_amount,
          dot_hours || null, dot_amount, salary_arrears, gross_salary,
          total_deductions, net_pay, salary_month
        ]
      );

      // if (parseFloat(loan_deduction) > 0) {
      //   await connection.execute(
      //     "UPDATE loans SET status = 'cleared' WHERE employee_id = ? AND status = 'active'",
      //     [employee_id]
      //   );
      // }
      // if (parseFloat(telephone_bill_deduction) > 0) {
      //   await connection.execute(
      //     "UPDATE telephone_bills SET status = 'paid' WHERE employee_id = ? AND status = 'pending'",
      //     [employee_id]
      //   );
      // }
    }

    await connection.commit();
    return { success: true };
  } catch (error) {
    await connection.rollback();
    console.error("Error saving salaries:", error.message);
    throw error;
  } finally {
    connection.release();
  }
};

const getEmployeeLoanById = async (employeeId, year, month) => {
  try {
    const [loans] = await pool.execute(
      `SELECT monthly_loan_amount 
       FROM loans 
       WHERE employee_id = ? AND YEAR(loan_month) = ? AND MONTH(loan_month) = ?`,
      [employeeId, year, month]
    );
    return loans.length > 0 ? loans[0] : null;
  } catch (error) {
    console.error(`Error fetching loan for employee ${employeeId}:`, error.message);
    throw error;
  }
};

export default { getEmployeeSalaries, saveSalaries, getEmployeeLoanById };