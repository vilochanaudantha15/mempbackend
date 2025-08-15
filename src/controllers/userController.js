import { pool } from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const addEmployee = async (req, res) => {
  try {
    const { name, email, mobile, password, userType, isManager } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    if (userType && !['user', 'admin'].includes(userType)) {
      return res.status(400).json({ error: "User type must be 'user' or 'admin'" });
    }

    const [existingUser] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, mobile, password, userType, isManager) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, mobile || null, hashedPassword, userType || 'user', isManager || 0]
    );

    res.status(201).json({ message: "Employee added successfully", id: result.insertId });
  } catch (error) {
    console.error("Error adding employee:", error.message);
    res.status(500).json({ error: "Failed to add employee", details: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, userType: user.userType, isManager: user.isManager },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        isManager: user.isManager,
      },
    });
  } catch (error) {
    console.error("Error during login:", error.message);
    res.status(500).json({ error: "Failed to sign in", details: error.message });
  }
};

export default {
  addEmployee,
  login,
};