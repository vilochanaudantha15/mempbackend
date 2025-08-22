import express from "express";
import path from "path";
import cors from "cors";
import { checkConnection, pool } from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import stockRoutes from "./routes/stockRoutes.js";
import productionRoutes from "./routes/productionShiftRoutes.js";
import assemblyReportRoutes from "./routes/assemblyReportRoutes.js";
import rejectedRoutes from "./routes/rejectedRoutes.js";
import assemblyAssembledRoutes from "./routes/assembledRoutes.js";
import defectiveCrushedRoutes from "./routes/defectiveCrushedRoutes.js";
import deliveryNoteRoutes from "./routes/deliveryNoteRoutes.js";
import shiftDispatchRoutes from "./routes/shiftDispatchRoutes.js";

const app = express();

const __dirname = path.resolve();

app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "Uploads")));
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/production-shift", productionRoutes);
app.use("/api/assembly", assemblyReportRoutes);
app.use("/api/rejected", rejectedRoutes);
app.use("/api/assemblyLine", assemblyAssembledRoutes);
app.use("/api/defectivecrushed", defectiveCrushedRoutes);
app.use("/api/delivery-notes", deliveryNoteRoutes);
app.use("/api/shift-dispatch", shiftDispatchRoutes); 

app.listen(6020, async () => {
  console.log("Server running on port 3000");
  try {
    await checkConnection();
    const [rows] = await pool.query("SELECT 1");
    console.log("Database connection test successful:", rows);
  } catch (error) {
    console.error("Failed to initialize the database:", error);
  }
});
