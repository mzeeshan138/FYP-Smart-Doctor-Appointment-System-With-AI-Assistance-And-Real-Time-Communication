import express from "express";

import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  uploadPaymentProof,
} from "../controllers/userController.js";
import {
  sendVerificationCode,
  verifyEmailCode,
} from "../controllers/emailVerificationController.js";
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
userRouter.get("/get-profile", authUser, getProfile);
userRouter.post(
  "/update-profile",
  upload.single("image"),
  authUser,
  updateProfile
);
userRouter.post("/book-appointment", authUser, bookAppointment);
userRouter.post("/stripe/create-deposit-session", authUser, createDepositSession);
userRouter.post("/stripe/create-balance-session", authUser, createBalanceSession);
userRouter.post("/stripe/verify-session", authUser, verifyStripeSession);
userRouter.get("/appointments", authUser, listAppointment);
userRouter.post("/appointments/payment/:id",uploadPaymentProof);
userRouter.post("/cancle-appointment", authUser, cancelAppointment);

export default userRouter;
