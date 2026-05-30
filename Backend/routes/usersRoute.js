import express from "express";

import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  paymentRazorpay,
  uploadPaymentProof,
  verifyRazorpay,
} from "../controllers/userController.js";
import {
  sendVerificationCode,
  verifyEmailCode,
} from "../controllers/emailVerificationController.js";
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
userRouter.get("/appointments", authUser, listAppointment);
userRouter.post("/appointments/payment/:id",uploadPaymentProof);
userRouter.post("/cancle-appointment", authUser, cancelAppointment);
userRouter.post("/payment-razorpay", authUser, paymentRazorpay);
userRouter.post("/verify-razorpay", authUser, verifyRazorpay);

export default userRouter;
