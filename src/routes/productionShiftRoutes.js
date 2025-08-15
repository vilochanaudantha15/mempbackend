import express from "express";
import {
  createShiftReport,
  getAllShiftReports,
  getCurrentStock,
} from "../controllers/productionShiftController.js";

const router = express.Router();

router.post("/", createShiftReport);
router.get("/", getAllShiftReports);
router.get("/stock", getCurrentStock);

export default router;