import AssemblyReceivedModel from "../models/assemblyReportModel.js";

export const createReceivedItemsReport = async (req, res) => {
  try {
    const { date, shift, shiftNumber, receivedItems } = req.body;

    if (!date || !shift || !shiftNumber) {
      return res
        .status(400)
        .json({ message: "Date, shift, and shift number are required" });
    }

    if (!receivedItems) {
      return res
        .status(400)
        .json({ message: "Received items data is required" });
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
        receivedItems[field] &&
        (isNaN(receivedItems[field]) || parseInt(receivedItems[field]) < 0)
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
      receivedItems,
    };

    const isCreated = await AssemblyReceivedModel.createReceivedItemsReport(
      reportData
    );
    if (isCreated) {
      res
        .status(201)
        .json({ message: "Received items report created successfully" });
    } else {
      res
        .status(500)
        .json({ message: "Failed to create received items report" });
    }
  } catch (error) {
    console.error("Error creating received items report:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllReceivedItemsReports = async (req, res) => {
  try {
    const filters = {
      date: req.query.date,
      shift: req.query.shift,
    };
    const reports = await AssemblyReceivedModel.getAllReceivedItemsReports(
      filters
    );
    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching received items reports:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};