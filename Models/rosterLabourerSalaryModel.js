import { pool } from "../config/db.js";

// Shift hours definitions
const shiftHours = {
  Morning: 7, // 12 AM - 7 AM
  Day: 9,     // 7 AM - 4 PM
  Night: 8    // 4 PM - 12 AM
};

// Fetch total hours worked by laborers for a specific plant, year, and month
const getLaborerHours = async (plantName, year, month) => {
  const query = `
    SELECT 
      e.id, 
      e.name, 
      e.emp_no, 
      COALESCE(SUM(CASE 
        WHEN r.shift = 'Morning' THEN ?
        WHEN r.shift = 'Day' THEN ?
        WHEN r.shift = 'Night' THEN ?
        ELSE 0 
      END), 0) as total_hours
    FROM employees e
    JOIN roster_laborers rl ON e.id = rl.laborer_id
    JOIN rosters r ON rl.roster_id = r.id
    JOIN power_plants p ON r.plant_id = p.id
    WHERE 
      p.name = ? 
      AND YEAR(r.date) = ? 
      AND MONTH(r.date) = ?
      AND e.designation = 'laborer'
    GROUP BY e.id, e.name, e.emp_no
    ORDER BY e.name ASC
  `;
  const params = [shiftHours.Morning, shiftHours.Day, shiftHours.Night, plantName, year, month];
  console.log('Executing laborer hours query with params:', { plantName, year, month });
  const [rows] = await pool.execute(query, params);
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    emp_no: row.emp_no,
    totalHours: row.total_hours
  }));
};

export default { getLaborerHours };