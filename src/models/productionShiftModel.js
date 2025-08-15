import { pool } from "../config/db.js";

const createShiftReport = async (reportData) => {
  const query = `
    INSERT INTO production_shift_reports (
      shift_number, report_date, shift, product_type,
      raw_material_pc, raw_material_crushed_pc, raw_material_mb,
      good_products_qty, good_products_weight,
      defective_products_qty, defective_products_weight, wastage
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const productTypes = {
    cebCovers: "ceb_covers",
    lecoCovers: "leco_covers",
    base: "base",
    shutters: "shutters",
  };

  const stockItemIds = {
    cebCovers: 1,
    lecoCovers: 2,
    base: 3,
    shutters: 4,
    defectiveQty: 5,
    defectiveWeight: 6,
    rawMaterialPC: 7,
    rawMaterialCrushedPC: 8,
    rawMaterialMB: 9,
  };

  const values = [];
  let totalDefectiveQty = 0;
  let totalDefectiveWeight = 0;
  let totalRawMaterialPC = 0;
  let totalRawMaterialCrushedPC = 0;
  let totalRawMaterialMB = 0;

  for (const [section, data] of Object.entries(reportData.products)) {
    const defectiveQty = parseInt(data.defectiveProductsQty) || 0;
    const defectiveWeight = parseFloat(data.defectiveProductsWeight) || 0;
    const rawMaterialPC = parseFloat(data.rawMaterialPC) || 0;
    const rawMaterialCrushedPC = parseFloat(data.rawMaterialCrushedPC) || 0;
    const rawMaterialMB = parseFloat(data.rawMaterialMB) || 0;

    totalDefectiveQty += defectiveQty;
    totalDefectiveWeight += defectiveWeight;
    totalRawMaterialPC += rawMaterialPC;
    totalRawMaterialCrushedPC += rawMaterialCrushedPC;
    totalRawMaterialMB += rawMaterialMB;

    values.push([
      reportData.shiftNumber,
      reportData.date,
      reportData.shift,
      productTypes[section],
      rawMaterialPC || null,
      rawMaterialCrushedPC || null,
      rawMaterialMB || null,
      parseInt(data.goodProductsQty) || null,
      parseFloat(data.goodProductsWeight) || null,
      defectiveQty || null,
      defectiveWeight || null,
      parseFloat(data.wastage) || null,
    ]);
  }

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

  const updateRawMaterialQuery = `
    UPDATE stock_items
    SET quantity = quantity - ?,
        created_at = NOW()
    WHERE id = ?
  `;

  try {
    await pool.query("START TRANSACTION");

    // Check available stock for raw materials
    const rawMaterialChecks = [
      { id: stockItemIds.rawMaterialPC, amount: totalRawMaterialPC, name: "PC" },
      { id: stockItemIds.rawMaterialCrushedPC, amount: totalRawMaterialCrushedPC, name: "Crushed PC" },
      { id: stockItemIds.rawMaterialMB, amount: totalRawMaterialMB, name: "MB" },
    ];

    for (const { id, amount, name } of rawMaterialChecks) {
      if (amount > 0) {
        const [stockRows] = await pool.execute(checkStockQuery, [id]);
        if (stockRows.length === 0) {
          throw new Error(`Stock item ${name} (ID: ${id}) not found`);
        }
        const availableQty = parseFloat(stockRows[0].quantity) || 0;
        if (availableQty < amount) {
          throw new Error(`Insufficient stock for ${name}. Available: ${availableQty}, Required: ${amount}`);
        }
      }
    }

    // Insert shift report records
    for (const value of values) {
      await pool.execute(query, value);
    }

    // Update stock for good products
    for (const [section, data] of Object.entries(reportData.products)) {
      const goodQty = parseInt(data.goodProductsQty) || 0;
      if (goodQty > 0) {
        const productId = stockItemIds[section];
        if (productId) {
          await pool.execute(updateStockQuery, [goodQty, productId]);
        }
      }
    }

    // Update defective quantity and weight
    if (totalDefectiveQty > 0) {
      await pool.execute(updateStockQuery, [totalDefectiveQty, stockItemIds.defectiveQty]);
    }
    if (totalDefectiveWeight > 0) {
      await pool.execute(updateStockQuery, [totalDefectiveWeight, stockItemIds.defectiveWeight]);
    }

    // Deduct raw materials
    if (totalRawMaterialPC > 0) {
      await pool.execute(updateRawMaterialQuery, [totalRawMaterialPC, stockItemIds.rawMaterialPC]);
    }
    if (totalRawMaterialCrushedPC > 0) {
      await pool.execute(updateRawMaterialQuery, [totalRawMaterialCrushedPC, stockItemIds.rawMaterialCrushedPC]);
    }
    if (totalRawMaterialMB > 0) {
      await pool.execute(updateRawMaterialQuery, [totalRawMaterialMB, stockItemIds.rawMaterialMB]);
    }

    await pool.query("COMMIT");
    return true;
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Database error in createShiftReport:", error);
    if (error.code === "ER_DUP_ENTRY") {
      throw new Error(`Duplicate shift report for shift number ${reportData.shiftNumber}`);
    }
    if (error.code === "ER_BAD_NULL_ERROR") {
      throw new Error(`Missing required field in shift report`);
    }
    throw error;
  }
};

const getAllShiftReports = async (filters = {}) => {
  let query = `
    SELECT 
      shift_number,
      report_date AS date,
      shift,
      product_type,
      raw_material_pc AS rawMaterialPC,
      raw_material_crushed_pc AS rawMaterialCrushedPC,
      raw_material_mb AS rawMaterialMB,
      good_products_qty AS goodProductsQty,
      good_products_weight AS goodProductsWeight,
      defective_products_qty AS defectiveProductsQty,
      defective_products_weight AS defectiveProductsWeight,
      wastage
    FROM production_shift_reports
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
  } else {
    query += `
      WHERE report_date = (
        SELECT MAX(report_date)
        FROM production_shift_reports
      )
    `;
  }

  query += " ORDER BY report_date DESC, shift_number DESC, product_type";

  try {
    const [rows] = await pool.execute(query, queryParams);

    const reports = [];
    const groupedByShiftNumber = {};

    rows.forEach((row) => {
      const { shift_number, date, shift, product_type, ...productData } = row;

      if (!groupedByShiftNumber[shift_number]) {
        groupedByShiftNumber[shift_number] = {
          shiftNumber: shift_number,
          date,
          shift,
          cebCovers: {},
          lecoCovers: {},
          base: {},
          shutters: {},
        };
      }

      const sectionMap = {
        ceb_covers: "cebCovers",
        leco_covers: "lecoCovers",
        base: "base",
        shutters: "shutters",
      };

      const section = sectionMap[product_type];
      if (section) {
        groupedByShiftNumber[shift_number][section] = productData;
      }
    });

    Object.values(groupedByShiftNumber).forEach((report) => {
      reports.push(report);
    });

    return reports;
  } catch (error) {
    console.error("Error in getAllShiftReports:", error);
    throw error;
  }
};

const getCurrentStock = async () => {
  const query = `
    SELECT id, name, quantity, created_at
    FROM stock_items
    ORDER BY id
  `;
  try {
    const [rows] = await pool.execute(query);
    return rows;
  } catch (error) {
    console.error("Error in getCurrentStock:", error);
    throw error;
  }
};

export default { createShiftReport, getAllShiftReports, getCurrentStock };