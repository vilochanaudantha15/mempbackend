import { pool } from "../config/db.js";

const createRejectedItemsReport = async (reportData) => {
  const query = `
    INSERT INTO assembly_rejected_items (
      shift_number, report_date, shift,
      ceb_covers, leco_covers, base, shutters,
      cover_beading, shutter_beading, springs,
      corrugated_boxes, sellotapes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const stockItemIds = {
    cebCovers: 1,
    lecoCovers: 2,
    base: 3,
    shutters: 4,
    coverBeading: 10,
    shutterBeading: 11,
    springs: 12,
    corrugatedBoxes: 13,
    sellotapes: 14,
  };

  const values = [
    reportData.shiftNumber,
    reportData.date,
    reportData.shift,
    parseInt(reportData.rejectedItems.cebCovers) || 0,
    parseInt(reportData.rejectedItems.lecoCovers) || 0,
    parseInt(reportData.rejectedItems.base) || 0,
    parseInt(reportData.rejectedItems.shutters) || 0,
    parseInt(reportData.rejectedItems.coverBeading) || 0,
    parseInt(reportData.rejectedItems.shutterBeading) || 0,
    parseInt(reportData.rejectedItems.springs) || 0,
    parseInt(reportData.rejectedItems.corrugatedBoxes) || 0,
    parseInt(reportData.rejectedItems.sellotapes) || 0,
  ];

  const checkStockQuery = `
    SELECT quantity
    FROM stock_items
    WHERE id = ?
  `;

  const updateStockQuery = `
    UPDATE stock_items
    SET quantity = quantity + ?,
        created_at = NOW()
    WHERE id = ?
  `;

  try {
    await pool.query("START TRANSACTION");

    // Check if stock items exist
    const stockChecks = [
      { id: stockItemIds.cebCovers, amount: parseInt(reportData.rejectedItems.cebCovers) || 0, name: "CEB Covers" },
      { id: stockItemIds.lecoCovers, amount: parseInt(reportData.rejectedItems.lecoCovers) || 0, name: "LECO Covers" },
      { id: stockItemIds.base, amount: parseInt(reportData.rejectedItems.base) || 0, name: "Base" },
      { id: stockItemIds.shutters, amount: parseInt(reportData.rejectedItems.shutters) || 0, name: "Shutters" },
      { id: stockItemIds.coverBeading, amount: parseInt(reportData.rejectedItems.coverBeading) || 0, name: "Cover Beading" },
      { id: stockItemIds.shutterBeading, amount: parseInt(reportData.rejectedItems.shutterBeading) || 0, name: "Shutter Beading" },
      { id: stockItemIds.springs, amount: parseInt(reportData.rejectedItems.springs) || 0, name: "Springs" },
      { id: stockItemIds.corrugatedBoxes, amount: parseInt(reportData.rejectedItems.corrugatedBoxes) || 0, name: "Corrugated Boxes" },
      { id: stockItemIds.sellotapes, amount: parseInt(reportData.rejectedItems.sellotapes) || 0, name: "Sellotapes" },
    ];

    for (const { id, amount, name } of stockChecks) {
      if (amount > 0) {
        const [stockRows] = await pool.execute(checkStockQuery, [id]);
        if (stockRows.length === 0) {
          throw new Error(`Stock item ${name} (ID: ${id}) not found`);
        }
        console.log(`Checked ${name}: Available = ${stockRows[0].quantity}, Adding = ${amount}`);
      }
    }

    // Insert the rejected items report
    await pool.execute(query, values);

    // Add rejected quantities back to stock
    for (const { id, amount, name } of stockChecks) {
      if (amount > 0) {
        await pool.execute(updateStockQuery, [amount, id]);
        console.log(`Added ${amount} to ${name} (ID: ${id})`);
      }
    }

    await pool.query("COMMIT");
    return true;
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error in createRejectedItemsReport:", error.message);
    throw error;
  }
};

const getAllRejectedItemsReports = async (filters = {}) => {
  let query = `
    SELECT 
      shift_number AS shiftNumber,
      report_date AS date,
      shift,
      ceb_covers AS cebCovers,
      leco_covers AS lecoCovers,
      base,
      shutters,
      cover_beading AS coverBeading,
      shutter_beading AS shutterBeading,
      springs,
      corrugated_boxes AS corrugatedBoxes,
      sellotapes
    FROM assembly_rejected_items
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
      rejectedItems: {
        cebCovers: row.cebCovers,
        lecoCovers: row.lecoCovers,
        base: row.base,
        shutters: row.shutters,
        coverBeading: row.coverBeading,
        shutterBeading: row.shutterBeading,
        springs: row.springs,
        corrugatedBoxes: row.corrugatedBoxes,
        sellotapes: row.sellotapes,
      },
    }));
  } catch (error) {
    throw error;
  }
};

export default { createRejectedItemsReport, getAllRejectedItemsReports };