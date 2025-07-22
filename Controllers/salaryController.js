import salaryModel from "../Models/salaryModel.js";

const calculateTax = (salary) => {
  let tax = 0;
  if (salary <= 150000) {
    tax = 0;
  } else if (salary <= 233333) {
    tax = (salary - 150000) * 0.06;
  } else if (salary <= 275000) {
    tax = (83333 * 0.06) + (salary - 233333) * 0.18;
  } else if (salary <= 316667) {
    tax = (83333 * 0.06) + (41667 * 0.18) + (salary - 275000) * 0.24;
  } else if (salary <= 358333) {
    tax = (83333 * 0.06) + (41667 * 0.18) + (41667 * 0.24) + (salary - 316667) * 0.30;
  } else {
    tax = (83333 * 0.06) + (41667 * 0.18) + (41667 * 0.24) + (41667 * 0.30) + (salary - 358333) * 0.36;
  }
  return parseFloat(tax.toFixed(2));
};

const getSalaries = async (req, res) => {
  const { month } = req.query;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: "Invalid or missing month parameter (YYYY-MM required)" });
  }

  try {
    const [year, monthNum] = month.split('-');
    const employees = await salaryModel.getEmployeeSalaries(year, monthNum);

    const salaries = employees.map(employee => {
      const basic_salary = parseFloat(employee.monthly_salary) || 0;
      const epf_deduction = basic_salary * 0.10;
      const employer_epf = basic_salary * 0.15;
      const etf = basic_salary * 0.03;
      const tax_deduction = calculateTax(basic_salary);
      const loan_deduction = parseFloat(employee.loan_amount) || 0;
      const telephone_bill_deduction = parseFloat(employee.telephone_bill_amount) || 0;
      const stamp_deduction = 25.00;
      const welfare_deduction = 500.00;
      const insurance_deduction = 900.00;
      const no_pay_days = parseFloat(employee.no_pay_days) || 0;
      const daily_salary = basic_salary / 30;
      const no_pay_deduction = parseFloat((daily_salary * no_pay_days).toFixed(2));
      const holiday_claims = employee.user_type === 'Executive' ? parseFloat(employee.holiday_claims) || 0 : 0;
      const holiday_claim_amount = holiday_claims > 0 ? parseFloat(((basic_salary / 20) * holiday_claims).toFixed(2)) : 0;
      const ot_hours = employee.user_type === 'NonExecutive' ? parseInt(employee.ot_hours, 10) || 0 : null;
      const dot_hours = employee.user_type === 'NonExecutive' ? parseInt(employee.dot_hours, 10) || 0 : null;
      const ot_amount = employee.user_type === 'NonExecutive' && ot_hours ? parseFloat(((basic_salary / 240 * 1.5) * ot_hours).toFixed(2)) : 0;
      const dot_amount = employee.user_type === 'NonExecutive' && dot_hours ? parseFloat(((basic_salary / 240 * 2) * dot_hours).toFixed(2)) : 0;
      const salary_arrears = parseFloat(employee.salary_arrears) || 0;
      const leave_days = parseFloat(employee.leave_days) || 0;
      const gross_salary = basic_salary + holiday_claim_amount + ot_amount + dot_amount + salary_arrears;
      const total_deductions = epf_deduction + tax_deduction + loan_deduction +
                              telephone_bill_deduction + stamp_deduction +
                              welfare_deduction + insurance_deduction + no_pay_deduction;

      const net_pay = gross_salary - total_deductions;

      const salaryData = {
        employee_id: employee.id,
        emp_no: employee.emp_no,
        employee_name: employee.name,
        user_type: employee.user_type,
        basic_salary: basic_salary.toFixed(2),
        epf_deduction: epf_deduction.toFixed(2),
        employer_epf: employer_epf.toFixed(2),
        etf: etf.toFixed(2),
        tax_deduction: tax_deduction.toFixed(2),
        loan_amount: loan_deduction.toFixed(2),
        loan_deduction: loan_deduction.toFixed(2),
        telephone_bill_deduction: telephone_bill_deduction.toFixed(2),
        stamp_deduction: stamp_deduction.toFixed(2),
        welfare_deduction: welfare_deduction.toFixed(2),
        insurance_deduction: insurance_deduction.toFixed(2),
        no_pay_days: no_pay_days.toFixed(2),
        no_pay_deduction: no_pay_deduction.toFixed(2),
        holiday_claims: holiday_claims.toFixed(2),
        leave_days: leave_days.toFixed(2),
        holiday_claim_amount: holiday_claim_amount.toFixed(2),
        ot_hours: ot_hours !== null ? ot_hours.toString() : null,
        dot_hours: dot_hours !== null ? dot_hours.toString() : null,
        ot_amount: ot_amount.toFixed(2),
        dot_amount: dot_amount.toFixed(2),
        salary_arrears: salary_arrears.toFixed(2),
        gross_salary: gross_salary.toFixed(2),
        total_deductions: total_deductions.toFixed(2),
        net_pay: net_pay.toFixed(2),
        salary_month: month,
        bank_code: employee.bank_code || '',
        branch_code: employee.branch_code || '',
        account_number: employee.account_number || '',
        nic_no: employee.nic_no || '',
        mobile_no: employee.mobile_no || ''
      };
      return salaryData;
    });

    res.status(200).json(salaries);
  } catch (error) {
    console.error("Error fetching salaries:", error.message);
    res.status(500).json({ error: "Failed to fetch salaries", details: error.message });
  }
};

const approveSalaries = async (req, res) => {
  const { salaries } = req.body;

  if (!Array.isArray(salaries) || salaries.length === 0) {
    return res.status(400).json({ error: "Salaries array is required" });
  }

  try {
    const sanitizedSalaries = salaries.map(salary => ({
      employee_id: salary.employee_id,
      emp_no: salary.emp_no,
      employee_name: salary.employee_name,
      basic_salary: salary.basic_salary,
      epf_deduction: salary.epf_deduction,
      employer_epf: salary.employer_epf,
      etf: salary.etf,
      tax_deduction: salary.tax_deduction,
      loan_deduction: salary.loan_deduction,
      telephone_bill_deduction: salary.telephone_bill_deduction,
      stamp_deduction: salary.stamp_deduction,
      welfare_deduction: salary.welfare_deduction,
      insurance_deduction: salary.insurance_deduction,
      no_pay_days: salary.no_pay_days,
      no_pay_deduction: salary.no_pay_deduction,
      leave_days: salary.leave_days,
      holiday_claims: salary.holiday_claims !== undefined ? salary.holiday_claims : null,
      holiday_claim_amount: salary.holiday_claim_amount !== undefined ? salary.holiday_claim_amount : null,
      ot_hours: salary.ot_hours !== undefined ? salary.ot_hours : null,
      ot_amount: salary.ot_amount !== undefined ? salary.ot_amount : null,
      dot_hours: salary.dot_hours !== undefined ? salary.dot_hours : null,
      dot_amount: salary.dot_amount !== undefined ? salary.dot_amount : null,
      salary_arrears: salary.salary_arrears,
      gross_salary: salary.gross_salary,
      total_deductions: salary.total_deductions,
      net_pay: salary.net_pay,
      salary_month: salary.salary_month
    }));

    await salaryModel.saveSalaries(sanitizedSalaries);
    res.status(200).json({ message: "Salaries approved successfully" });
  } catch (error) {
    console.error("Error approving salaries:", error.message);
    res.status(500).json({ error: "Failed to approve salaries", details: error.message });
  }
};

const getEmployeeLoan = async (req, res) => {
  const { id } = req.params;
  const { month } = req.query;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: "Valid employee ID is required" });
  }
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: "Invalid or missing month parameter (YYYY-MM required)" });
  }

  try {
    const [year, monthNum] = month.split('-');
    const loan = await salaryModel.getEmployeeLoanById(id, year, monthNum);
    if (!loan) {
      return res.status(404).json({ error: "No loan found for this employee and month" });
    }
    res.status(200).json({ employee_id: id, month, monthly_loan_amount: loan.monthly_loan_amount.toFixed(2) });
  } catch (error) {
    console.error(`Error fetching loan for employee ${id}:`, error.message);
    res.status(500).json({ error: "Failed to fetch loan amount", details: error.message });
  }
};

export default { getSalaries, approveSalaries, getEmployeeLoan };