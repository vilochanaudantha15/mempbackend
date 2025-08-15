import ShiftDispatchModel from "../models/shiftDispatchModel.js";

export const createShiftDispatchSummary = async (req, res) => {
  try {
    const { date, shift, shiftNumber, entries, totalQuantity, balance, plaName, supervisorName, managerName } = req.body;

    if (!date || !shift || !shiftNumber) {
      return res.status(400).json({ message: "Date, shift, and shift number are required" });
    }

    if (!Array.isArray(entries) || entries.length !== 8) {
      return res.status(400).json({ message: "Exactly 8 entries are required" });
    }

    entries.forEach((entry, index) => {
      if (entry.quantity && (isNaN(entry.quantity) || entry.quantity < 0)) {
        throw new Error(`Invalid quantity in entry ${index + 1}`);
      }
    });

    if (totalQuantity && (isNaN(totalQuantity) || totalQuantity < 0)) {
      return res.status(400).json({ message: "Invalid total quantity" });
    }

    if (balance?.ceb && (isNaN(balance.ceb) || balance.ceb < 0)) {
      return res.status(400).json({ message: "Invalid CEB balance" });
    }

    if (balance?.leco && (isNaN(balance.leco) || balance.leco < 0)) {
      return res.status(400).json({ message: "Invalid LECO balance" });
    }

    const summaryData = {
      date,
      shift,
      shiftNumber,
      entries: entries.map(entry => ({
        customer: entry.customer || null,
        quantity: entry.quantity ? parseInt(entry.quantity) : null,
        invoiceNo: entry.invoiceNo || null,
      })),
      totalQuantity: totalQuantity ? parseInt(totalQuantity) : null,
      balance: {
        ceb: balance?.ceb ? parseInt(balance.ceb) : null,
        leco: balance?.leco ? parseInt(balance.leco) : null,
      },
      plaName,
      supervisorName,
      managerName,
    };

    const isCreated = await ShiftDispatchModel.createShiftDispatchSummary(summaryData);
    if (isCreated) {
      res.status(201).json({ message: "Shift dispatch summary created successfully" });
    } else {
      res.status(500).json({ message: "Failed to create shift dispatch summary" });
    }
  } catch (error) {
    console.error("Error creating shift dispatch summary:", error);
    if (error.message.includes("Duplicate shift number")) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes("Invalid quantity")) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes("Missing required field")) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const getAllShiftDispatchSummaries = async (req, res) => {
  try {
    const filters = {
      date: req.query.date,
      shift: req.query.shift,
    };
    const summaries = await ShiftDispatchModel.getAllShiftDispatchSummaries(filters);
    res.status(200).json(summaries);
  } catch (error) {
    console.error("Error fetching shift dispatch summaries:", error);
    res.status(500).json({ message: `Internal Server Error: ${error.message}` });
  }
};