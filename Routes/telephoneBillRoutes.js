import express from "express";
import telephoneBillController from "../Controllers/telephoneBillController.js";

const router = express.Router();

router.post("/upload", telephoneBillController.uploadTelephoneBillExcel);
router.get("/", telephoneBillController.getAllTelephoneBills);

export default router;