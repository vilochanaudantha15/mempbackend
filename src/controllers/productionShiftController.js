import ProductionShiftModel from "../models/productionShiftModel.js";

export const createShiftReport = async (req, res) => {
  try {
    const { date, shift, shiftNumber, cebCovers, lecoCovers, base, shutters } = req.body;

    // Validate required fields
    if (!date || !shift || !shiftNumber) {
      return res.status(400).json({ message: "Date, shift, and shift number are required" });
    }

    if (!cebCovers || !lecoCovers || !base || !shutters) {
      return res.status(400).json({ message: "Data for all product types is required" });
    }

    // Validate product data
    const products = { cebCovers, lecoCovers, base, shutters };
    for (const [section, data] of Object.entries(products)) {
      const fields = [
        "rawMaterialPC",
        "rawMaterialCrushedPC",
        "rawMaterialMB",
        "goodProductsWeight",
        "defectiveProductsWeight",
        "wastage",
      ];
      for (const field of fields) {
        if (data[field] && (isNaN(data[field]) || parseFloat(data[field]) < 0)) {
          return res.status(400).json({ message: `Invalid ${field} in ${section}` });
        }
      }
      if (data.goodProductsQty && (isNaN(data.goodProductsQty) || parseInt(data.goodProductsQty) < 0)) {
        return res.status(400).json({ message: `Invalid goodProductsQty in ${section}` });
      }
      if (
        data.defectiveProductsQty &&
        (isNaN(data.defectiveProductsQty) || parseInt(data.defectiveProductsQty) < 0)
      ) {
        return res.status(400).json({ message: `Invalid defectiveProductsQty in ${section}` });
      }
    }

    const reportData = {
      date,
      shift,
      shiftNumber,
      products: { cebCovers, lecoCovers, base, shutters },
    };

    const isCreated = await ProductionShiftModel.createShiftReport(reportData);
    if (isCreated) {
      res.status(201).json({ message: "Shift report created successfully" });
    } else {
      res.status(500).json({ message: "Failed to create shift report" });
    }
  } catch (error) {
    console.error("Error creating shift report:", error);
    if (error.message.includes("Insufficient stock")) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes("Duplicate")) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const getAllShiftReports = async (req, res) => {
  try {
    const filters = {
      date: req.query.date,
      shift: req.query.shift,
    };
    const reports = await ProductionShiftModel.getAllShiftReports(filters);
    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching shift reports:", error);
    res.status(500).json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const getCurrentStock = async (req, res) => {
  try {
    const stock = await ProductionShiftModel.getCurrentStock();
    res.status(200).json(stock);
  } catch (error) {
    console.error("Error fetching current stock:", error);
    res.status(500).json({ message: `Internal Server Error: ${error.message}` });
  }
};