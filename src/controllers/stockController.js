import StockModel from "../models/stockModel.js";

export const getAllStockItems = async (req, res) => {
  try {
    const stockItems = await StockModel.getAllStockItems();
    res.json(stockItems);
  } catch (error) {
    console.error("Error fetching stock items:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateStockQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 0) {
      return res.status(400).json({
        message: "Quantity is required and must be a non-negative number",
      });
    }

    const isUpdated = await StockModel.updateStockQuantity(id, quantity);
    if (isUpdated) {
      res.status(200).json({ message: "Stock updated successfully" });
    } else {
      res.status(404).json({ message: "Stock item not found" });
    }
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
