import mysql2 from 'mysql2/promise';
import dotenv from "dotenv";

dotenv.config();

const pool = mysql2.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const checkConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Database Connection Successful!");
    connection.release();
  } catch (error) {
    console.error("❌ Error connecting to database!");
    throw error;
  }
};

export { pool, checkConnection };
