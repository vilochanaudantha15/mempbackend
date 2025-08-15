import { pool } from "../config/db.js";
import bcrypt from "bcrypt";

const saveEmployee = async (employeeData) => {
  const { name, email, mobile, password, userType = 'user', isManager = 0 } = employeeData;

  if (!name || !email || !password) {
    throw new Error("Name, email, and password are required");
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    throw new Error("Invalid email format");
  }

  if (mobile && !/^\d{10,}$/.test(mobile.replace(/\D/g, ''))) {
    throw new Error("Invalid mobile number format (at least 10 digits required)");
  }

  if (!['user', 'admin'].includes(userType)) {
    throw new Error("User type must be 'user' or 'admin'");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      throw new Error(`User with email ${email} already exists`);
    }

    const [result] = await connection.execute(
      `INSERT INTO users (name, email, mobile, password, userType, isManager)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, mobile || null, hashedPassword, userType, isManager]
    );

    await connection.commit();
    return { id: result.insertId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const verifyCredentials = async (email, password) => {
  const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  if (users.length === 0) {
    throw new Error("Invalid credentials");
  }

  const user = users[0];
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    userType: user.userType,
    isManager: user.isManager,
  };
};

export default {
  saveEmployee,
  verifyCredentials,
};