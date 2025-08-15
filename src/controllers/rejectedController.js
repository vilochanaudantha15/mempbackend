import RejectedModel from "../models/rejectedModel.js";

export const createRejectedItemsReport = async (req, res) => {
  try {
    const { date, shift, shiftNumber, rejectedItems } = req.body;

    if (!date || !shift || !shiftNumber) {
      return res
        .status(400)
        .json({ message: "Date, shift, and shift number are required" });
    }

    if (!rejectedItems) {
      return res
        .status(400)
        .json({ message: "Rejected items data is required" });
    }

    const requiredFields = [
      "cebCovers",
      "lecoCovers",
      "base",
      "shutters",
      "coverBeading",
      "shutterBeading",
      "springs",
      "corrugatedBoxes",
      "sellotapes",
    ];

    for (const field of requiredFields) {
      if (
        rejectedItems[field] &&
        (isNaN(rejectedItems[field]) || parseInt(rejectedItems[field]) < 0)
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
      rejectedItems,
    };

    const isCreated = await RejectedModel.createRejectedItemsReport(reportData);
    if (isCreated) {
      res
        .status(201)
        .json({ message: "Rejected items report created successfully" });
    } else {
      res
        .status(500)
        .json({ message: "Failed to create rejected items report" });
    }
  } catch (error) {
    console.error("Error creating rejected items report:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllRejectedItemsReports = async (req, res) => {
  try {
    const filters = {
      date: req.query.date,
      shift: req.query.shift,
    };
    const reports = await RejectedModel.getAllRejectedItemsReports(filters);
    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching rejected items reports:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};