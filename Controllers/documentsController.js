import documentsModel from "../Models/documentsModel.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getDocuments = async (req, res) => {
  try {
    const { email } = req.user;
    console.log(`Fetching documents for email: ${email}`);
    const employee = await documentsModel.getDocumentsByEmail(email);

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.status(200).json({
      user: {
        documents: employee.documents || [],
      },
    });
  } catch (error) {
    console.error("Error fetching documents:", error.message);
    res.status(500).json({ error: "Failed to fetch documents", details: error.message });
  }
};

const uploadDocument = async (req, res) => {
  try {
    const { email } = req.user;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Validate file type and size
    const allowedTypes = ["application/pdf"];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: "Only PDF files are allowed" });
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return res.status(400).json({ error: "File size exceeds 5MB limit" });
    }

    const document = {
      name: req.body.name || file.originalname,
      type: "PDF",
      size: `${(file.size / 1024).toFixed(2)} KB`,
      path: `/Uploads/docs/${file.filename}`,
    };

    console.log(`Uploading document: ${JSON.stringify(document)}`);
    const result = await documentsModel.addDocument(email, document);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.status(200).json({ message: "Document uploaded successfully", document });
  } catch (error) {
    console.error("Error uploading document:", error.message);
    res.status(500).json({ error: "Failed to upload document", details: error.message });
  }
};

export default { getDocuments, uploadDocument };