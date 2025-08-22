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

    for (const value of values) {
      await pool.execute(query, value);
    }

    for (const [section, data] of Object.entries(reportData.products)) {
      const goodQty = parseInt(data.goodProductsQty) || 0;
      if (goodQty > 0) {
        const productId = stockItemIds[section];
        if (productId) {
          await pool.execute(updateStockQuery, [goodQty, productId]);
        }
      }
    }

    if (totalDefectiveQty > 0) {
      await pool.execute(updateStockQuery, [totalDefectiveQty, stockItemIds.defectiveQty]);
    }
    if (totalDefectiveWeight > 0) {
      await pool.execute(updateStockQuery, [totalDefectiveWeight, stockItemIds.defectiveWeight]);
    }

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

const getAverageDailyRawMaterialUsage = async (upToDate = new Date().toISOString().split('T')[0]) => {
  const query = `
    SELECT 
      report_date,
      SUM(COALESCE(raw_material_pc, 0)) as total_pc,
      SUM(COALESCE(raw_material_crushed_pc, 0)) as total_crushed_pc,
      SUM(COALESCE(raw_material_mb, 0)) as total_mb
    FROM production_shift_reports
    WHERE report_date <= ?
    GROUP BY report_date
    ORDER BY report_date ASC
  `;

  try {
    console.log(`Executing query for upToDate: ${upToDate}`);
    const [rows] = await pool.execute(query, [upToDate]);
    console.log('Query result:', JSON.stringify(rows, null, 2));

    if (rows.length === 0) {
      console.log('No data found for the specified date range');
      return {
        upToDate,
        numberOfDays: 0,
        averages: {
          rawMaterialPC: 0,
          rawMaterialCrushedPC: 0,
          rawMaterialMB: 0,
        },
      };
    }

    let totalPC = 0;
    let totalCrushedPC = 0;
    let totalMB = 0;

    rows.forEach((row) => {
      totalPC += parseFloat(row.total_pc) || 0;
      totalCrushedPC += parseFloat(row.total_crushed_pc) || 0;
      totalMB += parseFloat(row.total_mb) || 0;
    });

    const numberOfDays = rows.length;
    const averages = {
      rawMaterialPC: totalPC / numberOfDays,
      rawMaterialCrushedPC: totalCrushedPC / numberOfDays,
      rawMaterialMB: totalMB / numberOfDays,
    };

    console.log('Calculated averages:', JSON.stringify(averages, null, 2));
    return {
      upToDate,
      numberOfDays,
      averages,
    };
  } catch (error) {
    console.error("Error in getAverageDailyRawMaterialUsage:", error);
    throw new Error(`Database error: ${error.message}`);
  }
};

const getAverageDailyAssemblyReceived = async (upToDate = new Date().toISOString().split('T')[0]) => {
  const query = `
    SELECT 
      report_date,
      SUM(COALESCE(ceb_covers, 0)) as total_ceb_covers,
      SUM(COALESCE(leco_covers, 0)) as total_leco_covers,
      SUM(COALESCE(base, 0)) as total_base,
      SUM(COALESCE(shutters, 0)) as total_shutters,
      SUM(COALESCE(cover_beading, 0)) as total_cover_beading,
      SUM(COALESCE(shutter_beading, 0)) as total_shutter_beading,
      SUM(COALESCE(springs, 0)) as total_springs,
      SUM(COALESCE(corrugated_boxes, 0)) as total_corrugated_boxes,
      SUM(COALESCE(sellotapes, 0)) as total_sellotapes
    FROM assembly_received_items
    WHERE report_date <= ?
    GROUP BY report_date
    ORDER BY report_date ASC
  `;

  try {
    console.log(`Executing assembly received query for upToDate: ${upToDate}`);
    const [rows] = await pool.execute(query, [upToDate]);
    console.log('Assembly received query result:', JSON.stringify(rows, null, 2));

    if (rows.length === 0) {
      console.log('No data found for the specified date range in assembly_received_items');
      return {
        upToDate,
        numberOfDays: 0,
        averages: {
          cebCovers: 0,
          lecoCovers: 0,
          base: 0,
          shutters: 0,
          coverBeading: 0,
          shutterBeading: 0,
          springs: 0,
          corrugatedBoxes: 0,
          sellotapes: 0,
        },
      };
    }

    let totalCebCovers = 0;
    let totalLecoCovers = 0;
    let totalBase = 0;
    let totalShutters = 0;
    let totalCoverBeading = 0;
    let totalShutterBeading = 0;
    let totalSprings = 0;
    let totalCorrugatedBoxes = 0;
    let totalSellotapes = 0;

    rows.forEach((row) => {
      totalCebCovers += parseInt(row.total_ceb_covers) || 0;
      totalLecoCovers += parseInt(row.total_leco_covers) || 0;
      totalBase += parseInt(row.total_base) || 0;
      totalShutters += parseInt(row.total_shutters) || 0;
      totalCoverBeading += parseInt(row.total_cover_beading) || 0;
      totalShutterBeading += parseInt(row.total_shutter_beading) || 0;
      totalSprings += parseInt(row.total_springs) || 0;
      totalCorrugatedBoxes += parseInt(row.total_corrugated_boxes) || 0;
      totalSellotapes += parseInt(row.total_sellotapes) || 0;
    });

    const numberOfDays = rows.length;
    const averages = {
      cebCovers: totalCebCovers / numberOfDays,
      lecoCovers: totalLecoCovers / numberOfDays,
      base: totalBase / numberOfDays,
      shutters: totalShutters / numberOfDays,
      coverBeading: totalCoverBeading / numberOfDays,
      shutterBeading: totalShutterBeading / numberOfDays,
      springs: totalSprings / numberOfDays,
      corrugatedBoxes: totalCorrugatedBoxes / numberOfDays,
      sellotapes: totalSellotapes / numberOfDays,
    };

    console.log('Calculated assembly received averages:', JSON.stringify(averages, null, 2));
    return {
      upToDate,
      numberOfDays,
      averages,
    };
  } catch (error) {
    console.error("Error in getAverageDailyAssemblyReceived:", error);
    throw new Error(`Database error: ${error.message}`);
  }
};

export default { 
  createShiftReport, 
  getAllShiftReports, 
  getCurrentStock, 
  getAverageDailyRawMaterialUsage, 
  getAverageDailyAssemblyReceived 
};
