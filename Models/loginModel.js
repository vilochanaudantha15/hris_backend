import { pool } from "../config/db.js";
import bcrypt from "bcrypt";

const authenticateUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    throw new Error("Invalid email format");
  }

  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      "SELECT id, email, password, user_type FROM employees WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      throw new Error("User not found");
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    return {
      id: user.id,
      email: user.email,
      user_type: user.user_type,
    };
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

export default { authenticateUser };