import express from "express";
import { createShiftDispatchSummary, getAllShiftDispatchSummaries } from "../controllers/shiftDispatchController.js";

const router = express.Router();

router.post("/", createShiftDispatchSummary);
router.get("/", getAllShiftDispatchSummaries);

export default router;