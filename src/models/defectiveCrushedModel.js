// defectiveCrushedModel.js
import { pool } from "../config/db.js";

const createDefectiveCrushedReport = async (reportData) => {
  const query = `
    INSERT INTO defective_crushed_reports(
      shift_number, report_date, shift,
      received_quantity, received_weight, crushed_pc_weight
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;
  const values = [
    reportData.shiftNumber,
    reportData.date,
    reportData.shift,
    reportData.receivedQuantity,
    reportData.receivedWeight,
    reportData.crushedPCWeight,
  ];
  try {
    await pool.query("START TRANSACTION");
    await pool.execute(query, values);
    await pool.query("COMMIT");
    return true;
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error in createDefectiveCrushedReport:", error.message, error.code, error.stack);
    if (error.code === "ER_DUP_ENTRY") {
      throw new Error("A report with this shift number already exists");
    }
    throw error;
  }
};

const updateStockAfterCrushing = async (quantity, weight, crushedWeight) => {
  try {
    await pool.query("START TRANSACTION");

    // Subtract from Defective Quantity (id=5)
    await pool.execute(
      `UPDATE stock_items SET quantity = quantity - ? WHERE id = 5`,
      [quantity]
    );

    // Subtract from Defective Weight (id=6)
    await pool.execute(
      `UPDATE stock_items SET quantity = quantity - ? WHERE id = 6`,
      [weight]
    );

    // Add to Crushed PC (id=8)
    await pool.execute(
      `UPDATE stock_items SET quantity = quantity + ? WHERE id = 8`,
      [crushedWeight]
    );

    await pool.query("COMMIT");
    return true;
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error in updateStockAfterCrushing:", error.message, error.stack);
    throw error;
  }
};

const getAllDefectiveCrushedReports = async (filters = {}) => {
  let query = `
    SELECT 
      shift_number AS shiftNumber,
      report_date AS date,
      shift,
      received_quantity AS receivedQuantity,
      received_weight AS receivedWeight,
      crushed_pc_weight AS crushedPCWeight
    FROM defective_crushed_reports
  `;
  const queryParams = [];
  const conditions = [];
  if (filters.date) {
    conditions.push("report_date = ?");
    queryParams.push(filters.date);
  }
  if (filters.shift) {
    conditions.push("shift = ?");
    queryParams.push(filters.shift);
  }
  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += " ORDER BY report_date DESC, shift_number DESC";
  try {
    const [rows] = await pool.execute(query, queryParams);
    return rows.map((row) => ({
      shiftNumber: row.shiftNumber,
      date: row.date,
      shift: row.shift,
      receivedQuantity: row.receivedQuantity,
      receivedWeight: row.receivedWeight,
      crushedPCWeight: row.crushedPCWeight,
    }));
  } catch (error) {
    console.error("Error in getAllDefectiveCrushedReports:", error.message, error.stack);
    throw error;
  }
};

export default { createDefectiveCrushedReport, getAllDefectiveCrushedReports, updateStockAfterCrushing };