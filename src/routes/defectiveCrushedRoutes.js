import express from "express";
import {
  createDefectiveCrushedReport,
  getAllDefectiveCrushedReports,
} from "../controllers/defectiveCrushedController.js";

const router = express.Router();

router.post("/defective-crushed", createDefectiveCrushedReport);
router.get("/defective-crushed", getAllDefectiveCrushedReports);

export default router;