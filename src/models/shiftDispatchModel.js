import { pool } from "../config/db.js";

const createShiftDispatchSummary = async (summaryData) => {
  const { date, shift, shiftNumber, totalQuantity, balance, plaName, supervisorName, managerName, entries } = summaryData;

  // Validate shift number format (e.g., "DD NNNNNN")
  const shiftNumberRegex = /^\d{1,2}\s\d{6}$/;
  if (!shiftNumberRegex.test(shiftNumber)) {
    throw new Error("Invalid shift number format. Expected format: DD NNNNNN");
  }

  const insertSummaryQuery = `
    INSERT INTO shift_dispatch_summaries (
      date, shift, shift_number, total_quantity, balance_ceb, balance_leco,
      pla_name, supervisor_name, manager_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const insertEntryQuery = `
    INSERT INTO shift_dispatch_entries (
      summary_id, entry_number, customer, quantity, invoice_no
    ) VALUES (?, ?, ?, ?, ?)
  `;

  try {
    await pool.query("START TRANSACTION");

    // Insert summary
    const [summaryResult] = await pool.execute(insertSummaryQuery, [
      date,
      shift,
      shiftNumber,
      totalQuantity || null,
      balance?.ceb || null,
      balance?.leco || null,
      plaName || null,
      supervisorName || null,
      managerName || null,
    ]);

    const summaryId = summaryResult.insertId;

    // Insert entries (always insert all 8, even if empty, to match frontend structure)
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      await pool.execute(insertEntryQuery, [
        summaryId,
        i + 1, // entry_number starts from 1
        entry.customer || null,
        entry.quantity || null,
        entry.invoiceNo || null,
      ]);
    }

    await pool.query("COMMIT");
    return true;
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Database error in createShiftDispatchSummary:", error);
    if (error.code === "ER_DUP_ENTRY") {
      throw new Error(`Duplicate shift number ${shiftNumber}`);
    }
    if (error.code === "ER_BAD_NULL_ERROR") {
      throw new Error(`Missing required field in shift dispatch summary`);
    }
    throw error;
  }
};

const getEntriesForSummary = async (summaryId) => {
  const query = `
    SELECT customer, quantity, invoice_no AS invoiceNo
    FROM shift_dispatch_entries
    WHERE summary_id = ?
    ORDER BY entry_number ASC
  `;
  const [rows] = await pool.execute(query, [summaryId]);
  return rows;
};

const getAllShiftDispatchSummaries = async (filters = {}) => {
  let query = `
    SELECT 
      id,
      date,
      shift,
      shift_number AS shiftNumber,
      total_quantity AS totalQuantity,
      balance_ceb,
      balance_leco,
      pla_name AS plaName,
      supervisor_name AS supervisorName,
      manager_name AS managerName,
      created_at AS createdAt
    FROM shift_dispatch_summaries
  `;

  const queryParams = [];
  const conditions = [];

  if (filters.date) {
    conditions.push("date = ?");
    queryParams.push(filters.date);
  }
  if (filters.shift) {
    conditions.push("shift = ?");
    queryParams.push(filters.shift);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY date DESC, shift_number DESC";

  try {
    const [summaries] = await pool.execute(query, queryParams);

    // Transform each summary to include nested balance and entries
    const transformedSummaries = await Promise.all(
      summaries.map(async (summary) => {
        const entries = await getEntriesForSummary(summary.id);
        const transformed = {
          ...summary,
          balance: {
            ceb: summary.balance_ceb,
            leco: summary.balance_leco,
          },
          entries,
        };
        delete transformed.id;
        delete transformed.balance_ceb;
        delete transformed.balance_leco;
        return transformed;
      })
    );

    return transformedSummaries;
  } catch (error) {
    console.error("Error in getAllShiftDispatchSummaries:", error);
    throw error;
  }
};

export default { createShiftDispatchSummary, getAllShiftDispatchSummaries };