import express from "express";
import {
  createRejectedItemsReport,
  getAllRejectedItemsReports,
} from "../controllers/rejectedController.js";

const router = express.Router();

router.post("/rejected", createRejectedItemsReport);
router.get("/rejected", getAllRejectedItemsReports);

export default router;