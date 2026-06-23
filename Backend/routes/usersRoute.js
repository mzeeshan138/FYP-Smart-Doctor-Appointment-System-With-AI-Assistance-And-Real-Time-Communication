import express from "express";

import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  validateBookingBeforePayment,
} from "../controllers/userController.js";
import {
  sendVerificationCode,
  verifyEmailCode,
} from "../controllers/emailVerificationController.js";
import {
  requestPasswordReset,
  validateResetToken,
  resetPassword,
} from "../controllers/passwordResetController.js";
import {
  createDepositSession,
  createBalanceSession,
  verifyStripeSession,
} from "../controllers/stripeController.js";
import authUser from "../middlewares/authUser.js";
import requireVerifiedEmail from "../middlewares/requireVerifiedEmail.js";
import upload from "../middlewares/multer.js";

const userRouter = express.Router();

userRouter.post("/send-verification-code", sendVerificationCode);
userRouter.post("/verify-email-code", verifyEmailCode);
userRouter.post("/register", requireVerifiedEmail, registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/forgot-password", requestPasswordReset);
userRouter.get("/validate-reset-token", validateResetToken);
userRouter.post("/reset-password", resetPassword);
userRouter.get("/get-profile", authUser, getProfile);
userRouter.post(
  "/update-profile",
  upload.single("image"),
  authUser,
  updateProfile
);
userRouter.post("/book-appointment", authUser, bookAppointment);
userRouter.post("/validate-booking", authUser, validateBookingBeforePayment);
userRouter.post("/stripe/create-deposit-session", authUser, createDepositSession);
userRouter.post("/stripe/create-balance-session", authUser, createBalanceSession);
userRouter.post("/stripe/verify-session", authUser, verifyStripeSession);
userRouter.get("/appointments", authUser, listAppointment);
userRouter.post("/cancle-appointment", authUser, cancelAppointment);

export default userRouter;
