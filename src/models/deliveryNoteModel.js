import { pool } from "../config/db.js";

const createDeliveryNote = async (noteData) => {
  const query = `
    INSERT INTO delivery_notes (
      delivery_note_number, received_by_name, signature, delivery_date,
      customer, description, quantity
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  // Validate delivery note number format (e.g., DN2025213-01)
  const noteNumberRegex = /^DN\d{7}-\d{2}$/;
  if (!noteNumberRegex.test(noteData.deliveryNoteNumber)) {
    throw new Error("Invalid delivery note number format. Expected format: DNYYYYDDD-XX");
  }

  const checkAssembledQuery = `
    SELECT total_ceb_quantity, total_leco1_quantity
    FROM total_assembled_products
    ORDER BY last_updated DESC
    LIMIT 1
  `;

  const updateCebQuery = `
    UPDATE total_assembled_products
    SET total_ceb_quantity = total_ceb_quantity - ?,
        last_updated = NOW()
    WHERE total_ceb_quantity >= ?
  `;

  const updateLecoQuery = `
    UPDATE total_assembled_products
    SET total_leco1_quantity = total_leco1_quantity - ?,
        last_updated = NOW()
    WHERE total_leco1_quantity >= ?
  `;

  try {
    await pool.query("START TRANSACTION");

    // Check if total_assembled_products table exists
    const [assembledTableCheck] = await pool.query(
      "SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_name = 'total_assembled_products'"
    );
    if (assembledTableCheck[0].count === 0) {
      throw new Error("total_assembled_products table does not exist");
    }

    // Check available assembled quantities
    const [assembledRows] = await pool.execute(checkAssembledQuery);
    if (assembledRows.length === 0) {
      throw new Error("No assembled items found in total_assembled_products");
    }

    const availableCebQty = parseInt(assembledRows[0].total_ceb_quantity) || 0;
    const availableLecoQty = parseInt(assembledRows[0].total_leco1_quantity) || 0;
    const requestedQty = parseInt(noteData.quantity);

    if (noteData.description === "CEB Meter Enclosure" && availableCebQty < requestedQty) {
      throw new Error(`Insufficient assembled CEB quantity. Available: ${availableCebQty}, Required: ${requestedQty}`);
    }
    if (noteData.description === "LECO Meter Enclosure" && availableLecoQty < requestedQty) {
      throw new Error(`Insufficient assembled LECO quantity. Available: ${availableLecoQty}, Required: ${requestedQty}`);
    }

    // Insert delivery note record
    await pool.execute(query, [
      noteData.deliveryNoteNumber,
      noteData.receivedByName,
      noteData.signature || null,
      noteData.deliveryDate,
      noteData.customer,
      noteData.description,
      requestedQty,
    ]);

    // Update assembled quantities
    if (noteData.description === "CEB Meter Enclosure") {
      const [result] = await pool.execute(updateCebQuery, [requestedQty, requestedQty]);
      if (result.affectedRows === 0) {
        throw new Error("Failed to update CEB assembled quantity or insufficient quantity");
      }
    } else if (noteData.description === "LECO Meter Enclosure") {
      const [result] = await pool.execute(updateLecoQuery, [requestedQty, requestedQty]);
      if (result.affectedRows === 0) {
        throw new Error("Failed to update LECO assembled quantity or insufficient quantity");
      }
    }

    await pool.query("COMMIT");
    return true;
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Database error in createDeliveryNote:", error);
    if (error.code === "ER_DUP_ENTRY") {
      throw new Error(`Duplicate delivery note number ${noteData.deliveryNoteNumber}`);
    }
    if (error.code === "ER_BAD_NULL_ERROR") {
      throw new Error(`Missing required field in delivery note`);
    }
    throw error;
  }
};

const getAllDeliveryNotes = async (filters = {}) => {
  let query = `
    SELECT 
      delivery_note_number AS deliveryNoteNumber,
      received_by_name AS receivedByName,
      signature,
      delivery_date AS date,
      customer,
      description,
      quantity
    FROM delivery_notes
  `;

  const queryParams = [];
  const conditions = [];

  if (filters.date) {
    conditions.push("delivery_date = ?");
    queryParams.push(filters.date);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  } else {
    query += `
      WHERE delivery_date = (
        SELECT MAX(delivery_date)
        FROM delivery_notes
      )
    `;
  }

  query += " ORDER BY delivery_date DESC, delivery_note_number DESC";

  try {
    const [rows] = await pool.execute(query, queryParams);
    return rows;
  } catch (error) {
    console.error("Error in getAllDeliveryNotes:", error);
    throw error;
  }
};

export default { createDeliveryNote, getAllDeliveryNotes };
