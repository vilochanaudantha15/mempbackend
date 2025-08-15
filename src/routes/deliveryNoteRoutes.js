import express from "express";
import { createDeliveryNote, getAllDeliveryNotes } from "../controllers/deliveryNoteController.js";

const router = express.Router();

router.post("/", createDeliveryNote);
router.get("/", getAllDeliveryNotes);

export default router;