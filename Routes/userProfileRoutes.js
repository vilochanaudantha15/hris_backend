import express from "express";
import userProfileController from "../Controllers/userProfileController.js";
import userProfileModel from "../Models/userProfileModel.js";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../Uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file) {
      return cb(null, true);
    }
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG and PNG images allowed"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("profile_pic");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied, no token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired, please refresh or login again" });
    }
    res.status(403).json({ error: "Invalid token" });
  }
};

router.get("/", authenticateToken, userProfileController.getUserProfile);

router.get("/employees", authenticateToken, async (req, res) => {
  try {
    const employees = await userProfileModel.getAllEmployees();
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch employees", details: error.message });
  }
});

export default router;