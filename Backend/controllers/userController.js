import express from "express";
import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
 import Conversation from "../models/conversationModel.js";
import emailVerificationModel from "../models/emailVerificationModel.js";
import { validateBookingEligibility } from "../services/appointmentBookingService.js";
import {
  deleteConversationForAppointment,
  releaseDoctorSlot,
} from "../controllers/appointmentController.js";
// API for register user

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.json({ success: false, message: "Missing Detail" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (normalizedEmail !== req.verifiedEmail) {
      return res.json({
        success: false,
        message: "Registered email must match verified email",
      });
    }

    //validating email format
    if (!validator.isEmail(normalizedEmail)) {
      return res.json({ success: false, message: "Enter a valid email" });
    }

    //validating strong password
    if (password.length < 8) {
      return res.json({ success: false, message: "Enter a strong password" });
    }

    //check user existed
    const existedUser = await userModel.findOne({ email: normalizedEmail });

    if (existedUser) {
      return res.status(409).json({
        success: false,
        message: "User with email already exists",
      });
    }

    //hashing the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email: normalizedEmail,
      password: hashedPassword,
    };

    const newUser = new userModel(userData);

    const user = await newUser.save();

    await emailVerificationModel.deleteOne({ email: normalizedEmail });

    const token = jwt.sign({ id: user._id }, "awkmadrista");

    res.json({ success: true, token, message: "Account created successfully" });
  } catch (error) {
    console.log("error:", error);

    return res.json({ success: false, message: error.message });
  }
};

//api for user login

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    //check user exist
    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }

    //check for password
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, "awkmadrista");
      return res.json({ success: true, token });
    } else {
      return res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log("error:", error);
    res.json({ success: false, message: error.message });
  }
};

//API to get user profile data

const getProfile = async (req, res) => {
  try {
    const { userId } = req.body;

    const userData = await userModel.findById(userId).select("-password");

    res.json({ success: true, userData });
  } catch (error) {
    console.log("error:", error);
    res.json({ success: false, message: error.message });
  }
};

//API to update user profile

const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, address, dob, gender } = req.body;

    const imageFile = req.file;

    if (!name || !phone || !dob || !gender) {
      return res.json({ success: false, message: "Data missing" });
    }

    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender,
    });

    if (imageFile) {
      // upload image to cloudinary
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });

      const imageURL = imageUpload.secure_url;

      await userModel.findByIdAndUpdate(userId, { image: imageURL });
    }

    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.log("error:", error);
    res.json({ success: false, message: error.message });
  }
};


//API to book appointment — use Stripe deposit flow
const bookAppointment = async (req, res) => {
  return res.json({
    success: false,
    message:
      "Please pay the 10% deposit via Stripe to book an appointment.",
  });
};

// Validate all booking rules BEFORE opening Stripe checkout (no payment yet)
const validateBookingBeforePayment = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { docId, slotDate, slotTime } = req.body;

    const eligibility = await validateBookingEligibility(
      userId,
      docId,
      slotDate,
      slotTime
    );

    if (!eligibility.eligible) {
      return res.json({ success: false, message: eligibility.message });
    }

    res.json({
      success: true,
      message: "You can book this appointment",
      depositAmount: eligibility.depositAmount,
      totalFees: eligibility.totalFees,
    });
  } catch (error) {
    console.log("validateBookingBeforePayment error:", error);
    res.json({ success: false, message: error.message });
  }
};

//API to get user appointments for backend my-appointments page

const listAppointment = async (req, res) => {
  try {
    const { userId } = req.body;
    const appointments = await appointmentModel.find({ userId });

    if (!appointments) {
      return res.json({ success: false, message: "No Appointment" });
    }

    res.json({ success: true, appointments });
  } catch (error) {
    console.log("error:", error);
    res.json({ success: false, message: error.message });
  }
};

// API to cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData.userId !== userId) {
      return res.json({ success: false, message: "Unauthorized action" });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });

    // ================= CANCEL TRACKING =================
    const userData = await userModel.findById(userId);
    const currentYear = new Date().getFullYear();

    let yearData = userData.yearlyCancelledAppointments.find(
      (y) => y.year === currentYear
    );

    // create year object if not exists
    if (!yearData) {
      userData.yearlyCancelledAppointments.push({
        year: currentYear,
        cancelAppointmentCount: 0,
        cancelledAppointments: [],
      });

      // re-fetch reference after push
      yearData = userData.yearlyCancelledAppointments.find(
        (y) => y.year === currentYear
      );
    }

    // increase yearly count
    yearData.cancelAppointmentCount += 1;

    // store cancelled appointment
    yearData.cancelledAppointments.push({
      appointmentId,
      cancelledAt: new Date(),
    });

    // increase total count
    userData.totalCancelledAppointments += 1;

    // account status logic
    const limit = Number(process.env.CANCEL_APPOINTMENT_LIMIT) ;

    if (yearData.cancelAppointmentCount === 0) {
      userData.accountStatus = "green";
    } else if (yearData.cancelAppointmentCount < limit) {
      userData.accountStatus = "warning";
    } else {
      userData.accountStatus = "restricted";
    }

    await userData.save();

    const { docId, slotDate, slotTime } = appointmentData;
    await releaseDoctorSlot(docId, slotDate, slotTime);
    await deleteConversationForAppointment(appointmentId);

    res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    console.log("error:", error);
    res.json({ success: false, message: error.message });
  }
};

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  validateBookingBeforePayment,
};
