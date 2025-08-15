import express from "express";
import {
  getAllStockItems,
  updateStockQuantity,
} from "../controllers/stockController.js";

const router = express.Router();

router.get("/", getAllStockItems);
router.put("/:id", updateStockQuantity);

export default router;
