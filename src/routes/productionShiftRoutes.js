import express from "express";
import {
  createShiftReport,
  getAllShiftReports,
  getCurrentStock,
  getAverageDailyRawMaterialUsage,
} from "../controllers/productionShiftController.js";
import {
  getAverageDailyAssemblyReceived
} from "../controllers/productionShiftController.js";

const router = express.Router();

router.post("/", createShiftReport);
router.get("/", getAllShiftReports);
router.get("/stock", getCurrentStock);
router.get("/raw-material-averages", getAverageDailyRawMaterialUsage);
// Placeholder for existing /received endpoint
router.get("/received", (req, res) => {
  res.status(200).json({ message: "Assembly received items endpoint" });
});

// Endpoint for average daily assembly received items
router.get("/received-averages", getAverageDailyAssemblyReceived);


export default router;                
