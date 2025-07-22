import loginModel from "../Models/loginModel.js";
import jwt from "jsonwebtoken";

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await loginModel.authenticateUser({ email, password });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, user_type: user.user_type },
      process.env.JWT_SECRET || "your_jwt_secret_key", // Use environment variable in production
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email, user_type: user.user_type },
    });
  } catch (error) {
    console.error("Error during login:", error.message);
    if (error.message === "User not found" || error.message === "Invalid password") {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    res.status(500).json({ error: "Failed to login", details: error.message });
  }
};

export default { login };