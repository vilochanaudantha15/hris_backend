import { pool } from "../config/db.js";

const validShifts = ['Morning', 'Day', 'Night'];

// Fetch all power plant names
const getAllPowerPlants = async () => {
  const query = "SELECT name FROM power_plants ORDER BY name ASC";
  const [rows] = await pool.execute(query);
  return rows.map(row => row.name);
};

// Fetch employees for a specific plant
const getAllEmployees = async (plantName) => {
  const query = `
    SELECT e.id, e.name, e.emp_no, e.designation 
    FROM employees e
    JOIN power_plants p ON e.plant_id = p.id
    WHERE p.name = ? AND e.designation IN ('laborer', 'Supervisor', 'se')
    ORDER BY e.name ASC
  `;
  const [rows] = await pool.execute(query, [plantName]);
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    emp_no: row.emp_no,
    role: row.designation.toLowerCase() === 'laborer' ? 'laborer' : 'supervisor'
  }));
};

// Fetch roster for a specific plant and month
const getRosterByPlantAndMonth = async (plantName, year, month) => {
  const query = `
    SELECT r.id, DATE_FORMAT(r.date, '%Y-%m-%d') as date, r.shift, r.supervisor_id, GROUP_CONCAT(rl.laborer_id) as laborer_ids
    FROM rosters r
    JOIN power_plants p ON r.plant_id = p.id
    LEFT JOIN roster_laborers rl ON r.id = rl.roster_id
    WHERE p.name = ? AND YEAR(r.date) = ? AND MONTH(r.date) = ?
    GROUP BY r.id, r.date, r.shift, r.supervisor_id
  `;
  console.log('Executing roster query with params:', { plantName, year, month });
  const [rows] = await pool.execute(query, [plantName, year, month]);
  return rows.map(row => ({
    id: row.id,
    date: row.date,
    shift: row.shift.trim(),
    supervisor: row.supervisor_id,
    laborers: row.laborer_ids ? row.laborer_ids.split(',').map(Number) : []
  }));
};

// Save or update roster entry with supervisor-laborer association
const upsertRoster = async (plantName, date, shift, supervisorId, laborerIds) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Validate shift
    if (!validShifts.includes(shift)) {
      throw new Error(`Invalid shift: ${shift}. Must be one of ${validShifts.join(', ')}`);
    }

    // Get plant_id
    const [plantRows] = await connection.execute("SELECT id FROM power_plants WHERE name = ?", [plantName]);
    if (!plantRows.length) throw new Error(`Power plant '${plantName}' not found`);
    const plantId = plantRows[0].id;

    // Validate supervisor if provided
    if (supervisorId) {
      const [supervisorRows] = await connection.execute(
        "SELECT id FROM employees WHERE id = ? AND designation IN ('Supervisor', 'se') AND plant_id = ?",
        [supervisorId, plantId]
      );
      if (!supervisorRows.length) throw new Error(`Supervisor ID ${supervisorId} not found or not assigned to plant ${plantName}`);
    }

    // Validate laborers if provided
    if (laborerIds && laborerIds.length > 0) {
      const placeholders = laborerIds.map(() => '?').join(',');
      const [laborerRows] = await connection.execute(
        `SELECT id FROM employees WHERE id IN (${placeholders}) AND designation = 'laborer' AND plant_id = ?`,
        [...laborerIds, plantId]
      );
      if (laborerRows.length !== laborerIds.length) {
        throw new Error(`One or more laborer IDs not found or not assigned to plant ${plantName}`);
      }
    }

    // Check if roster exists for this shift and date
    const [existing] = await connection.execute(
      "SELECT id FROM rosters WHERE plant_id = ? AND date = ? AND shift = ?",
      [plantId, date, shift]
    );

    let rosterId;
    if (existing.length) {
      rosterId = existing[0].id;
      await connection.execute(
        "UPDATE rosters SET supervisor_id = ? WHERE id = ?",
        [supervisorId || null, rosterId]
      );
      await connection.execute("DELETE FROM roster_laborers WHERE roster_id = ?", [rosterId]);
    } else {
      const [result] = await connection.execute(
        "INSERT INTO rosters (plant_id, date, shift, supervisor_id) VALUES (?, ?, ?, ?)",
        [plantId, date, shift, supervisorId || null]
      );
      rosterId = result.insertId;
    }

    // Insert laborers if provided
    if (laborerIds && laborerIds.length > 0) {
      for (const laborerId of laborerIds) {
        await connection.execute(
          "INSERT INTO roster_laborers (roster_id, laborer_id) VALUES (?, ?)",
          [rosterId, laborerId]
        );
      }
    }

    await connection.commit();
    console.log(`Saved roster: ${plantName}, ${date}, ${shift}, supervisor: ${supervisorId}, laborers: ${laborerIds}`);
    return true;
  } catch (error) {
    await connection.rollback();
    console.error(`Upsert error for ${plantName}, ${date}, ${shift}:`, error.message);
    throw error;
  } finally {
    connection.release();
  }
};

export default { getAllPowerPlants, getAllEmployees, getRosterByPlantAndMonth, upsertRoster };