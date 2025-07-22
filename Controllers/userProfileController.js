import userProfileModel from "../Models/userProfileModel.js";
import { pool } from "../config/db.js";
import bcrypt from "bcrypt";

const getUserProfile = async (req, res) => {
  try {
    const { email } = req.user;

    const employee = await userProfileModel.getUserProfileByEmail(email);

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.status(200).json({
      user: {
        name: employee.name,
        designation: employee.designation,
        department: employee.department,
        email: employee.email,
        phone: employee.mobile,
        location: employee.plant_name || "Not specified",
        appointedDate: employee.appointed_date,
        employeeId: employee.emp_no,
        manager: employee.manager || "Not specified",
        status: employee.contract_type.charAt(0).toUpperCase() + employee.contract_type.slice(1),
        skills: employee.skills ? JSON.parse(employee.skills) : [],
        education: employee.education || "Not provided",
        emergencyContact: employee.emergency_contact || "Not provided",
        leaveBalance: employee.leaveBalance || {
          vacation: { total: 20, used: 5, remaining: 15 },
          sick: { total: 10, used: 3, remaining: 7 },
          personal: { total: 5, used: 2, remaining: 3 },
        },
        avatar: employee.profile_pic_path
          ? `${req.protocol}://${req.get("host")}/Uploads/${employee.profile_pic_path}`
          : null,
        nicNo: employee.nic_no || "Not provided",
        nicIssueDate: employee.nic_issue_date || "Not provided",
        title: employee.title || "Not provided",
        initials: employee.initials || "Not provided",
        lastName: employee.last_name || "Not provided",
        otherNames: employee.other_names || "Not provided",
        gender: employee.gender || "Not specified",
        maritalStatus: employee.marital_status || "Not specified",
        dateOfBirth: employee.date_of_birth || "Not provided",
        addressNo: employee.address_no || "Not provided",
        street: employee.street || "Not provided",
        city: employee.city || "Not provided",
        district: employee.district || "Not provided",
        telNo: employee.tel_no || "Not provided",
        mobileNo: employee.mobile_no || "Not provided",
        emailAddress: employee.email_address || "Not provided",
        policeStation: employee.police_station || "Not provided",
        grDivision: employee.gr_division || "Not provided",
        nationality: employee.nationality || "Not provided",
        religion: employee.religion || "Not provided",
        keyRole: employee.key_role || "Not provided",
        gradeName: employee.grade_name || "Not provided",
        company: employee.company || "Not provided",
        branchName: employee.branch_name || "Not provided",
        managerLocation: employee.manager_location || "Not provided",
        contractEndDate: employee.contract_end_date || "Not provided",
        epfNo: employee.epf_no || "Not provided",
        etfNo: employee.etf_no || "Not provided",
        jobDescription: employee.job_description || "Not provided",
        medicalCertificate: employee.medical_certificate || false,
        shiftBasis: employee.shift_basis || false,
        emergencyContactName: employee.emergency_contact_name || "Not provided",
        emergencyContactRelationship: employee.emergency_contact_relationship || "Not provided",
        emergencyContactNo: employee.emergency_contact_no || "Not provided",
        emergencyContactMobile: employee.emergency_contact_mobile || "Not provided",
        leaveL1: employee.leave_l1 || null,
        leaveL2: employee.leave_l2 || null,
        leaveClerk: employee.leave_clerk || null,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    res.status(500).json({ error: "Failed to fetch user profile", details: error.message });
  }
};

export default { getUserProfile };