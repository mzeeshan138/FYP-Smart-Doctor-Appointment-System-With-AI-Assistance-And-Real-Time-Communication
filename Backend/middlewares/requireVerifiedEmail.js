import jwt from "jsonwebtoken";
import emailVerificationModel from "../models/emailVerificationModel.js";

const JWT_SECRET = process.env.JWT_SECRET;

const requireVerifiedEmail = async (req, res, next) => {
  try {
    const { email, verificationToken } = req.body;

    if (!email || !verificationToken) {
      return res.json({
        success: false,
        message: "Email verification required before registration",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let decoded;

    try {
      decoded = jwt.verify(verificationToken, JWT_SECRET);
    } catch {
      return res.json({
        success: false,
        message: "Verification expired. Please verify your email again.",
      });
    }

    if (
      decoded.purpose !== "email_verification" ||
      decoded.email !== normalizedEmail
    ) {
      return res.json({
        success: false,
        message: "Invalid verification. Please verify your email again.",
      });
    }

    const record = await emailVerificationModel.findOne({
      email: normalizedEmail,
      verified: true,
    });

    if (!record) {
      return res.json({
        success: false,
        message: "Email not verified. Please complete verification first.",
      });
    }

    req.verifiedEmail = normalizedEmail;
    next();
  } catch (error) {
    console.log("requireVerifiedEmail error:", error);
    res.json({ success: false, message: error.message });
  }
};

export default requireVerifiedEmail;
