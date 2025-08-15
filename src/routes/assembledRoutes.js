import express from "express";
import {
  createAssembledItemsReport,
  getAllAssembledItemsReports,
  getTotalAssembledProducts,
} from "../controllers/assembledController.js";

const router = express.Router();

router.post("/assembled", createAssembledItemsReport);
router.get("/assembled", getAllAssembledItemsReports);
router.get("/assembled/total", getTotalAssembledProducts);

export default router;