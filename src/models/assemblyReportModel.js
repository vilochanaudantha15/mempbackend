import { pool } from "../config/db.js";

const createReceivedItemsReport = async (reportData) => {
  const query = `
    INSERT INTO assembly_received_items (
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
    parseInt(reportData.receivedItems.cebCovers) || 0,
    parseInt(reportData.receivedItems.lecoCovers) || 0,
    parseInt(reportData.receivedItems.base) || 0,
    parseInt(reportData.receivedItems.shutters) || 0,
    parseInt(reportData.receivedItems.coverBeading) || 0,
    parseInt(reportData.receivedItems.shutterBeading) || 0,
    parseInt(reportData.receivedItems.springs) || 0,
    parseInt(reportData.receivedItems.corrugatedBoxes) || 0,
    parseInt(reportData.receivedItems.sellotapes) || 0,
  ];

  const checkStockQuery = `
    SELECT quantity
    FROM stock_items
    WHERE id = ?
  `;

  const updateStockQuery = `
    UPDATE stock_items
    SET quantity = quantity - ?,
        created_at = NOW()
    WHERE id = ?
  `;

  try {
    await pool.query("START TRANSACTION");

    // Check available stock for each item type
    const stockChecks = [
      { id: stockItemIds.cebCovers, amount: parseInt(reportData.receivedItems.cebCovers) || 0, name: "CEB Covers" },
      { id: stockItemIds.lecoCovers, amount: parseInt(reportData.receivedItems.lecoCovers) || 0, name: "LECO Covers" },
      { id: stockItemIds.base, amount: parseInt(reportData.receivedItems.base) || 0, name: "Base" },
      { id: stockItemIds.shutters, amount: parseInt(reportData.receivedItems.shutters) || 0, name: "Shutters" },
      { id: stockItemIds.coverBeading, amount: parseInt(reportData.receivedItems.coverBeading) || 0, name: "Cover Beading" },
      { id: stockItemIds.shutterBeading, amount: parseInt(reportData.receivedItems.shutterBeading) || 0, name: "Shutter Beading" },
      { id: stockItemIds.springs, amount: parseInt(reportData.receivedItems.springs) || 0, name: "Springs" },
      { id: stockItemIds.corrugatedBoxes, amount: parseInt(reportData.receivedItems.corrugatedBoxes) || 0, name: "Corrugated Boxes" },
      { id: stockItemIds.sellotapes, amount: parseInt(reportData.receivedItems.sellotapes) || 0, name: "Sellotapes" },
    ];

    for (const { id, amount, name } of stockChecks) {
      if (amount > 0) {
        const [stockRows] = await pool.execute(checkStockQuery, [id]);
        if (stockRows.length === 0) {
          throw new Error(`Stock item ${name} (ID: ${id}) not found`);
        }
        const availableQty = parseFloat(stockRows[0].quantity) || 0;
        if (availableQty < amount) {
          throw new Error(`Insufficient stock for ${name}. Available: ${availableQty}, Required: ${amount}`);
        }
        console.log(`Checked ${name}: Available = ${availableQty}, Deducting = ${amount}`);
      }
    }

    // Insert the received items report
    await pool.execute(query, values);

    // Deduct stock for each item type
    for (const { id, amount, name } of stockChecks) {
      if (amount > 0) {
        await pool.execute(updateStockQuery, [amount, id]);
        console.log(`Deducted ${amount} from ${name} (ID: ${id})`);
      }
    }

    await pool.query("COMMIT");
    return true;
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error in createReceivedItemsReport:", error.message);
    throw error;
  }
};

const getAllReceivedItemsReports = async (filters = {}) => {
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
    FROM assembly_received_items
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
      receivedItems: {
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

export default { createReceivedItemsReport, getAllReceivedItemsReports };