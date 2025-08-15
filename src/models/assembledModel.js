import { pool } from "../config/db.js";

const createAssembledItemsReport = async (reportData) => {
  const query = `
    INSERT INTO assembly_assembled_items (
      shift_number, report_date, shift,
      ceb_quantity, ceb_qc_no_start, ceb_qc_no_end,
      leco1_quantity, leco1_qc_no_start, leco1_qc_no_end,
      leco2_quantity, leco2_qc_no_start, leco2_qc_no_end
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    reportData.shiftNumber,
    reportData.date,
    reportData.shift,
    parseInt(reportData.assembledItems.ceb.quantity) || 0,
    reportData.assembledItems.ceb.qcNoStart || null,
    reportData.assembledItems.ceb.qcNoEnd || null,
    parseInt(reportData.assembledItems.leco1.quantity) || 0,
    reportData.assembledItems.leco1.qcNoStart || null,
    reportData.assembledItems.leco1.qcNoEnd || null,
    parseInt(reportData.assembledItems.leco2.quantity) || 0,
    reportData.assembledItems.leco2.qcNoStart || null,
    reportData.assembledItems.leco2.qcNoEnd || null,
  ];
  try {
    await pool.query("START TRANSACTION");
    await pool.execute(query, values);
    await pool.query("COMMIT");
    return true;
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error in createAssembledItemsReport:", error.message);
    throw error;
  }
};

const getAllAssembledItemsReports = async (filters = {}) => {
  let query = `
    SELECT 
      shift_number AS shiftNumber,
      report_date AS date,
      shift,
      ceb_quantity AS cebQuantity,
      ceb_qc_no_start AS cebQcNoStart,
      ceb_qc_no_end AS cebQcNoEnd,
      leco1_quantity AS leco1Quantity,
      leco1_qc_no_start AS leco1QcNoStart,
      leco1_qc_no_end AS leco1QcNoEnd,
      leco2_quantity AS leco2Quantity,
      leco2_qc_no_start AS leco2QcNoStart,
      leco2_qc_no_end AS leco2QcNoEnd
    FROM assembly_assembled_items
  `;
  const queryParams = [];
  const conditions = [];
  if (filters.date) {
    const dates = filters.date.split(',');
    if (dates.length > 0) {
      conditions.push(`report_date IN (${dates.map(() => '?').join(',')})`);
      queryParams.push(...dates);
    }
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
      assembledItems: {
        ceb: {
          quantity: row.cebQuantity,
          qcNoStart: row.cebQcNoStart,
          qcNoEnd: row.cebQcNoEnd,
        },
        leco1: {
          quantity: row.leco1Quantity,
          qcNoStart: row.leco1QcNoStart,
          qcNoEnd: row.leco1QcNoEnd,
        },
        leco2: {
          quantity: row.leco2Quantity,
          qcNoStart: row.leco2QcNoStart,
          qcNoEnd: row.leco2QcNoEnd,
        },
      },
    }));
  } catch (error) {
    console.error("Error in getAllAssembledItemsReports:", error.message);
    throw error;
  }
};

const getTotalAssembledProducts = async () => {
  const query = `
    SELECT 
      last_updated AS date,
      total_ceb_quantity AS cebQuantity,
      total_leco1_quantity AS leco1Quantity,
      total_leco2_quantity AS leco2Quantity
    FROM total_assembled_products
    ORDER BY last_updated DESC
  `;
  try {
    const [rows] = await pool.execute(query);
    return rows.map((row) => ({
      date: row.date,
      cebQuantity: row.cebQuantity,
      leco1Quantity: row.leco1Quantity,
      leco2Quantity: row.leco2Quantity,
    }));
  } catch (error) {
    console.error("Error in getTotalAssembledProducts:", error.message);
    throw error;
  }
};

export default { createAssembledItemsReport, getAllAssembledItemsReports, getTotalAssembledProducts };