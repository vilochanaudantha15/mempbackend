import express from "express";
import {
  createReceivedItemsReport,
  getAllReceivedItemsReports,
} from "../controllers/assemblyReportController.js";

const router = express.Router();

router.post("/received", createReceivedItemsReport);
router.get("/received", getAllReceivedItemsReports);

export default router;