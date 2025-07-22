import express from "express";
import loanController from "../Controllers/loanController.js";

const router = express.Router();

router.post("/upload", loanController.uploadLoanExcel);
router.get("/", loanController.getAllLoans);

export default router;