import { pool } from "../config/db.js";

const getDocumentsByEmail = async (email) => {
  const connection = await pool.getConnection();
  try {
    console.log(`Querying documents for email: ${email}`);
    const queryString = `
      SELECT documents
      FROM employees
      WHERE email = ?`;

    const [rows] = await connection.execute(queryString, [email]);

    if (rows.length === 0) {
      console.log(`No employee found for email: ${email}`);
      return null;
    }

    // Parse documents JSON if it exists
    const employee = rows[0];
    employee.documents = employee.documents ? JSON.parse(employee.documents) : [];

    return employee;
  } catch (error) {
    console.error("Database error in getDocumentsByEmail:", error.message);
    throw new Error(`Database error: ${error.message}`);
  } finally {
    connection.release();
  }
};

const addDocument = async (email, document) => {
  const connection = await pool.getConnection();
  try {
    console.log(`Adding document for email: ${email}, document: ${JSON.stringify(document)}`);
    // Fetch existing documents
    const [rows] = await connection.execute("SELECT documents FROM employees WHERE email = ?", [email]);
    if (rows.length === 0) {
      console.log(`No employee found for email: ${email}`);
      return { affectedRows: 0 };
    }

    const currentDocuments = rows[0].documents ? JSON.parse(rows[0].documents) : [];
    currentDocuments.push(document);

    const queryString = `
      UPDATE employees 
      SET documents = ?
      WHERE email = ?`;

    const [result] = await connection.execute(queryString, [JSON.stringify(currentDocuments), email]);
    console.log(`Update result: ${JSON.stringify(result)}`);
    return result;
  } catch (error) {
    console.error("Database error in addDocument:", error.message);
    throw new Error(`Database error: ${error.message}`);
  } finally {
    connection.release();
  }
};

export default { getDocumentsByEmail, addDocument };