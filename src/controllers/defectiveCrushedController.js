// defectiveCrushedController.js
import DefectiveCrushedModel from "../models/defectiveCrushedModel.js";

export const createDefectiveCrushedReport = async (req, res) => {
  try {
    const { date, shift, shiftNumber, receivedQuantity, receivedWeight, crushedPCWeight } = req.body;

    // Validate required fields
    if (!date || !shift || !shiftNumber) {
      return res.status(400).json({ message: "Date, shift, and shift number are required" });
    }

    // Validate numeric fields
    if (
      receivedQuantity === undefined || receivedQuantity === "" ||
      receivedWeight === undefined || receivedWeight === "" ||
      crushedPCWeight === undefined || crushedPCWeight === ""
    ) {
      return res.status(400).json({ message: "Received quantity, received weight, and crushed PC weight are required" });
    }

    // Parse and validate shiftNumber as an integer
    const shiftNumberValue = parseInt(shiftNumber);
    if (isNaN(shiftNumberValue) || shiftNumberValue < 0) {
      return res.status(400).json({ message: "Invalid shift number format" });
    }

    // Validate numeric inputs
    const parsedQuantity = parseInt(receivedQuantity);
    const parsedWeight = parseFloat(receivedWeight);
    const parsedCrushedWeight = parseFloat(crushedPCWeight);

    if (
      isNaN(parsedQuantity) || parsedQuantity < 0 ||
      isNaN(parsedWeight) || parsedWeight < 0 ||
      isNaN(parsedCrushedWeight) || parsedCrushedWeight < 0
    ) {
      return res.status(400).json({ message: "Invalid quantity or weight values" });
    }

    const reportData = {
      date,
      shift,
      shiftNumber: shiftNumberValue, // Use parsed integer
      receivedQuantity: parsedQuantity,
      receivedWeight: parsedWeight,
      crushedPCWeight: parsedCrushedWeight,
    };

    const isCreated = await DefectiveCrushedModel.createDefectiveCrushedReport(reportData);
    if (isCreated) {
      // Update stock items after successful creation
      const stockUpdated = await DefectiveCrushedModel.updateStockAfterCrushing(
        parsedQuantity,
        parsedWeight,
        parsedCrushedWeight
      );
      if (stockUpdated) {
        res.status(201).json({ message: "Defective crushed report created and stock updated successfully" });
      } else {
        res.status(500).json({ message: "Failed to update stock after creating report" });
      }
    } else {
      res.status(500).json({ message: "Failed to create defective crushed report" });
    }
  } catch (error) {
    console.error("Error creating defective crushed report:", error.message, error.stack);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const getAllDefectiveCrushedReports = async (req, res) => {
  try {
    const filters = {
      date: req.query.date,
      shift: req.query.shift,
    };
    const reports = await DefectiveCrushedModel.getAllDefectiveCrushedReports(filters);
    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching defective crushed reports:", error.message, error.stack);
    res.status(500).json({ message: "Internal Server Error" });
  }
};