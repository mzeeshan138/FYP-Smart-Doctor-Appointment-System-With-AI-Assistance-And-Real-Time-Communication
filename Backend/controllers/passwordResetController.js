import crypto from "crypto";
import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import passwordResetModel from "../models/passwordResetModel.js";
import { sendPasswordResetEmail } from "../utils/sendEmail.js";
import {
  getPasswordResetCooldownDays,
  getPasswordResetTokenExpiryMinutes,
} from "../utils/passwordResetConfig.js";
import { getAccountBannedMessage } from "../utils/accountStatusMessages.js";

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const formatLimitDate = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const isPasswordResetLimited = (user) => {
  if (!user?.passwordResetLimitUntil) {
    return false;
  }
  return new Date() < new Date(user.passwordResetLimitUntil);
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({ success: false, message: "Email is required" });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Enter a valid email" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await userModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.json({
        success: false,
        message: "No account found with this email",
      });
    }

    if (user.accountStatus === "blocked") {
      return res.json({
        success: false,
        message: getAccountBannedMessage(),
        accountBanned: true,
      });
    }

    if (isPasswordResetLimited(user)) {
      return res.json({
        success: false,
        message: `Password reset is not available until ${formatLimitDate(user.passwordResetLimitUntil)}. You can request a new reset after this date.`,
        passwordResetLimited: true,
        passwordResetLimitUntil: user.passwordResetLimitUntil,
        lastPasswordResetAt: user.lastPasswordResetAt,
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiryMinutes = getPasswordResetTokenExpiryMinutes();
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await passwordResetModel.findOneAndUpdate(
      { email: normalizedEmail },
      { tokenHash, expiresAt, usedAt: null },
      { upsert: true, new: true }
    );

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail(normalizedEmail, resetLink, expiryMinutes);

    res.json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    console.log("requestPasswordReset error:", error);
    res.json({
      success: false,
      message:
        error.message?.includes("Gmail credentials")
          ? error.message
          : "Failed to send password reset email. Please try again later.",
    });
  }
};

export const validateResetToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.json({ success: false, message: "Reset token is required" });
    }

    const tokenHash = hashToken(String(token).trim());
    const record = await passwordResetModel.findOne({ tokenHash });

    if (!record || record.usedAt) {
      return res.json({
        success: false,
        message: "Invalid or expired reset link",
      });
    }

    if (record.expiresAt < new Date()) {
      return res.json({
        success: false,
        message: "Reset link has expired. Please request a new one.",
      });
    }

    res.json({ success: true, message: "Reset token is valid" });
  } catch (error) {
    console.log("validateResetToken error:", error);
    res.json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.json({
        success: false,
        message: "Token and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const tokenHash = hashToken(String(token).trim());
    const record = await passwordResetModel.findOne({ tokenHash });

    if (!record || record.usedAt) {
      return res.json({
        success: false,
        message: "Invalid or expired reset link",
      });
    }

    if (record.expiresAt < new Date()) {
      return res.json({
        success: false,
        message: "Reset link has expired. Please request a new one.",
      });
    }

    const user = await userModel.findOne({ email: record.email });

    if (!user) {
      return res.json({
        success: false,
        message: "Account not found",
      });
    }

    if (user.accountStatus === "blocked") {
      return res.json({
        success: false,
        message: getAccountBannedMessage(),
        accountBanned: true,
      });
    }

    if (isPasswordResetLimited(user)) {
      return res.json({
        success: false,
        message: `Password reset is not available until ${formatLimitDate(user.passwordResetLimitUntil)}.`,
        passwordResetLimited: true,
        passwordResetLimitUntil: user.passwordResetLimitUntil,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const now = new Date();
    const cooldownDays = getPasswordResetCooldownDays();
    const limitUntil = new Date(
      now.getTime() + cooldownDays * 24 * 60 * 60 * 1000
    );

    user.password = hashedPassword;
    user.lastPasswordResetAt = now;
    user.passwordResetLimitUntil = limitUntil;
    await user.save();

    record.usedAt = now;
    await record.save();

    res.json({
      success: true,
      message: "Password reset successfully. You can log in with your new password.",
      passwordResetLimitUntil: limitUntil,
    });
  } catch (error) {
    console.log("resetPassword error:", error);
    res.json({ success: false, message: error.message });
  }
};
