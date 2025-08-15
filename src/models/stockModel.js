import { pool } from "../config/db.js";

const getAllStockItems = async () => {
  const query = "SELECT * FROM stock_items ORDER BY id ASC";
  const [rows] = await pool.execute(query);
  return rows;
};

const updateStockQuantity = async (id, quantity) => {
  const query = "UPDATE stock_items SET quantity = ? WHERE id = ?";
  const [result] = await pool.execute(query, [quantity, id]);
  return result.affectedRows > 0;
};

export default { getAllStockItems, updateStockQuantity };
