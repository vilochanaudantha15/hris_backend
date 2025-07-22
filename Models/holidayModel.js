import { pool } from "../config/db.js";

const validTypes = ['Poya', 'Public', 'Custom'];

// Fetch all holidays
const getAllHolidays = async () => {
  const query = "SELECT id, DATE_FORMAT(date, '%Y-%m-%d') as date, name, type FROM holidays ORDER BY date ASC";
  const [rows] = await pool.execute(query);
  return rows.map(row => ({
    id: row.id,
    date: row.date,
    name: row.name,
    type: row.type
  }));
};

// Add a new holiday
const addHoliday = async (date, name, type) => {
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid holiday type: ${type}. Must be one of ${validTypes.join(', ')}`);
  }
  const query = "INSERT INTO holidays (date, name, type) VALUES (?, ?, ?)";
  try {
    const [result] = await pool.execute(query, [date, name, type]);
    console.log(`Added holiday: ${name} on ${date} (${type})`);
    return result.insertId;
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error(`A holiday already exists on ${date}`);
    }
    throw error;
  }
};

export default { getAllHolidays, addHoliday };