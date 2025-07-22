import express from "express";
import employeeController from "../Controllers/employeeController.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../Uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Authentication middleware
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

router.post("/employees", upload.single('profile_pic'), employeeController.addEmployee);
router.put("/employees/:id", upload.single('profile_pic'), employeeController.updateEmployee);
router.delete("/employees/:id", employeeController.deleteEmployee);
router.get("/power-plants", employeeController.getPowerPlants);
router.get("/employees", employeeController.getEmployees);
router.get("/employees/executives", employeeController.getExecutiveEmployees);
router.get("/employees/non-executives", employeeController.getNonExecutiveEmployees);
router.get("/user", authenticateToken, employeeController.getEmployeeByEmail);

export default router;