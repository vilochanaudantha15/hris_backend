import express from "express";
import { fileURLToPath } from 'url';
import path from "path";
import cors from "cors";
import { checkConnection } from "./config/db.js";
import rosterRouter from "./Routes/rosterRoutes.js";
import holidayRouter from "./Routes/holidayRoutes.js";
import employeeRouter from "./Routes/employeeRoutes.js";
import attendanceRouter from "./Routes/attendanceRoutes.js";
import labourerAttendanceRouter from "./Routes/labourerAttendanceRoutes.js";
import loginRouter from "./Routes/loginRoutes.js";
import userProfileRoutes from "./Routes/userProfileRoutes.js";
import personalInfoRoutes from "./Routes/personalInfoRoutes.js";
import employmentRoutes from "./Routes/employmentRoutes.js";
import skillsRoutes from "./Routes/skillsRoutes.js";
import documentsRoutes from "./Routes/documentsRoutes.js";
import payrollRoutes from "./Routes/payrollRoutes.js";
import rosterLabourerSalaryRoutes from "./Routes/rosterLabourerSalaryRoutes.js";
import executiveAttendanceRouter from "./Routes/executiveAttendanceRoutes.js";
import leavesRoutes from "./Routes/leaveRoutes.js";
import executiveSummaryRoutes from './Routes/executiveSummaryRoutes.js';
import nonexecutiveSummaryRoutes from './Routes/nonExecutiveDayWorkersRoutes.js';
import loanRoutes from './Routes/loanRoutes.js';
import telephoneBillRoutes from "./Routes/telephoneBillRoutes.js";
import salaryRoutes from "./Routes/salaryRoutes.js";
import finalAttendanceRoutes from './Routes/finalAttendanceRoutes.js';
import nonexefinalAttendanceRoutes from './Routes/NonEfinalAttendanceRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

app.use("/roster", rosterRouter);
app.use("/holidays", holidayRouter);
app.use("/employ", employeeRouter);
app.use("/attendance", attendanceRouter);
app.use("/labourer-attendance", labourerAttendanceRouter);
app.use("/executive-attendance", executiveAttendanceRouter);
app.use("/api", loginRouter);
app.use("/userprofile", userProfileRoutes);
app.use("/personalinfo", personalInfoRoutes);
app.use("/employment", employmentRoutes);
app.use("/skills", skillsRoutes);
app.use("/documents", documentsRoutes);
app.use("/payroll", payrollRoutes);
app.use("/rosters", rosterLabourerSalaryRoutes);
app.use("/leaves", leavesRoutes);
app.use('/api/executive-summary', executiveSummaryRoutes);
app.use('/api/non-executive-day-workers', nonexecutiveSummaryRoutes);
app.use('/api/loans', loanRoutes);
app.use("/api/telephone-bills", telephoneBillRoutes);
app.use("/salaries", salaryRoutes);
app.use('/api/final-attendance', finalAttendanceRoutes);
app.use('/api/non-execute-attendance', nonexefinalAttendanceRoutes);

app.listen(7000, async () => {
  console.log("🚀 Server running on port 4000");

  try {
    await checkConnection();
  } catch (error) {
    console.error("❌ Initialization failed:", error.message);
  }
});
