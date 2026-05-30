import validator from "validator";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import emailVerificationModel from "../models/emailVerificationModel.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";

const JWT_SECRET = process.env.JWT_SECRET || "awkmadrista";
const CODE_EXPIRY_MINUTES = 10;
const VERIFICATION_TOKEN_EXPIRY = "30m";

const generateCode = () =>
  String(Math.floor(100000 + Math.random() * 900000));

export const sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({ success: false, message: "Email is required" });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Enter a valid email" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await userModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

    await emailVerificationModel.findOneAndUpdate(
      { email: normalizedEmail },
      { code, expiresAt, verified: false },
      { upsert: true, new: true }
    );

    await sendVerificationEmail(normalizedEmail, code);

    res.json({
      success: true,
      message: "Verification code sent to your email",
    });
  } catch (error) {
    console.log("sendVerificationCode error:", error);
    res.json({
      success: false,
      message:
        error.message?.includes("Gmail credentials")
          ? error.message
          : "Failed to send verification code. Check Gmail settings.",
    });
  }
};

export const verifyEmailCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.json({
        success: false,
        message: "Email and verification code are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const record = await emailVerificationModel.findOne({
      email: normalizedEmail,
    });

    if (!record) {
      return res.json({
        success: false,
        message: "No verification request found. Send a new code.",
      });
    }

    if (record.expiresAt < new Date()) {
      return res.json({
        success: false,
        message: "Code expired. Please request a new one.",
      });
    }

    if (record.code !== String(code).trim()) {
      return res.json({ success: false, message: "Invalid verification code" });
    }

    record.verified = true;
    record.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await record.save();

    const verificationToken = jwt.sign(
      { email: normalizedEmail, purpose: "email_verification" },
      JWT_SECRET,
      { expiresIn: VERIFICATION_TOKEN_EXPIRY }
    );

    res.json({
      success: true,
      message: "Email verified successfully",
      verificationToken,
    });
  } catch (error) {
    console.log("verifyEmailCode error:", error);
    res.json({ success: false, message: error.message });
  }
};
