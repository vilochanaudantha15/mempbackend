import AssembledModel from "../models/assembledModel.js";

export const createAssembledItemsReport = async (req, res) => {
  try {
    const { date, shift, shiftNumber, assembledItems } = req.body;

    if (!date || !shift || !shiftNumber) {
      return res
        .status(400)
        .json({ message: "Date, shift, and shift number are required" });
    }

    if (!assembledItems) {
      return res
        .status(400)
        .json({ message: "Assembled items data is required" });
    }

    const requiredFields = ["ceb", "leco1", "leco2"];
    for (const field of requiredFields) {
      if (
        assembledItems[field].quantity &&
        (isNaN(assembledItems[field].quantity) || parseInt(assembledItems[field].quantity) < 0)
      ) {
        return res
          .status(400)
          .json({ message: `Invalid quantity for ${field}` });
      }
    }

    const reportData = {
      date,
      shift,
      shiftNumber,
      assembledItems,
    };

    const isCreated = await AssembledModel.createAssembledItemsReport(reportData);
    if (isCreated) {
      res
        .status(201)
        .json({ message: "Assembled items report created successfully" });
    } else {
      res
        .status(500)
        .json({ message: "Failed to create assembled items report" });
    }
  } catch (error) {
    console.error("Error creating assembled items report:", error);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const getAllAssembledItemsReports = async (req, res) => {
  try {
    const filters = {
      date: req.query.date,
      shift: req.query.shift,
    };
    const reports = await AssembledModel.getAllAssembledItemsReports(filters);
    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching assembled items reports:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTotalAssembledProducts = async (req, res) => {
  try {
    const products = await AssembledModel.getTotalAssembledProducts();
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching total assembled products:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};