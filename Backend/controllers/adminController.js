import validator from "validator";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";
import paymentModel from "../models/paymentModel.js";
import emailVerificationModel from "../models/emailVerificationModel.js";
import {
  deleteConversationForAppointment,
  releaseDoctorSlot,
} from "./appointmentController.js";
import {
  applyAdminBookingRestriction,
  liftAdminBookingRestriction,
  getBookingRestrictionStatus,
} from "../services/bookingRestrictionService.js";
//Api for adding doctor
const addDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
      phone
    } = req.body;
    const imageFile = req.file;

    //checking for all data to add doctor
    if (
      !name ||
      !email ||
      !password ||
      !speciality ||
      !degree ||
      !experience ||
      !about ||
      !fees ||
      !address
    ) {
      return res.json({ success: false, message: "missing details" });
    }

    // validatin email format

    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    //validating strong password
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter a strong password",
      });
    }

    //check user existed
    const existedUser = await doctorModel.findOne({
      $or: [{ name }, { email }],
    });

    if (existedUser) {
      return res.status(409).json({
        success: false,
        message: "Docter with email already exists",
      });
    }

    // hashing doctor password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // upload image cloudinary

    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image",  
      folder: "DoctorHub/doctors",
    });

    const imageUrl = imageUpload.secure_url;

    const doctorData = {
      name,
      email,
      image: imageUrl,
      password: hashedPassword,
      speciality,
      degree,
      experience,
      about,
      fees,
      phone,
      address: JSON.parse(address),
      date: Date.now(),
    };

    const newDoctor = new doctorModel(doctorData);

    await newDoctor.save();
    res.json({
      success: true,
      message: "doctor added",
    });
  } catch (error) {
    console.log("error:", error);
    res.json({ success: false, message: error.message });
  }
};

// API for admin login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email === "admin@gmail.com" &&
      password === "admin"
    ) {
      const token = jwt.sign(email + password, "awkmadrista");
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credential" });
    }
  } catch (error) {
    console.log("error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Api for get all doctors list
const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select("-password");
    res.json({ success: true, doctors });
  } catch (error) {
    console.log("error:", error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({});
    res.json({ success: true, appointments });
  } catch (error) {
    console.log("error:", error);
    res.json({ success: false, message: error.message });
  }
};

// API for  appointment cancel

const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });

    const { docId, slotDate, slotTime } = appointmentData;
    await releaseDoctorSlot(docId, slotDate, slotTime);
    await deleteConversationForAppointment(appointmentId);

    res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    console.log("error:", error);
    res.json({ success: false, message: error.message });
  }
};

//API to get dashboard data for admin panel

const adminDashboard = async (req, res) => {
  try {
    const doctors = await doctorModel.find({});
    const users = await userModel.find({});
    const appointments = await appointmentModel.find({});

    const dashData = {
      doctors: doctors.length,
      appointments: appointments.length,
      users: users.length,
      latestAppointments: appointments.reverse().slice(0, 5),
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.log("error:", error);
    res.json({ success: false, message: error.message });
  }
};

const updateDoctor = async (req, res) => {
  try {
    const { doctorId } = req.body;
    const {
      name,
      email,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
      phone,
    } = req.body;

    const imageFile = req.file;

    const doctor = await doctorModel.findById(doctorId);
    if (!doctor) {
      return res.json({ success: false, message: "Doctor not found" });
    }

    // If new image uploaded → delete old + upload new
    let imageUrl = doctor.image;

    if (imageFile) {
      // delete old image from cloudinary
      if (doctor.image) {
        const publicId = doctor.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`DoctorHub/doctors/${publicId}`);
      }

      const upload = await cloudinary.uploader.upload(imageFile.path, {
        folder: "DoctorHub/doctors",
      });

      imageUrl = upload.secure_url;
    }

    const updatedDoctor = await doctorModel.findByIdAndUpdate(
      doctorId,
      {
        name,
        email,
        speciality,
        degree,
        experience,
        about,
        fees,
        phone,
        address: JSON.parse(address),
        image: imageUrl,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Doctor updated successfully",
      doctor: updatedDoctor,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
const deleteDoctor = async (req, res) => {
  try {
    const { doctorId } = req.body;

    const doctor = await doctorModel.findById(doctorId);
    if (!doctor) {
      return res.json({ success: false, message: "Doctor not found" });
    }

    // delete image from cloudinary
    if (doctor.image) {
      const publicId = doctor.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`DoctorHub/doctors/${publicId}`);
    }

    await doctorModel.findByIdAndDelete(doctorId);

    res.json({ success: true, message: "Doctor deleted successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const applyBookingRestriction = async (req, res) => {
  try {
    const { userId, period, durationDays, reason } = req.body;

    if (!userId) {
      return res.json({ success: false, message: "userId is required" });
    }

    const user = await applyAdminBookingRestriction(userId, {
      period,
      durationDays,
      reason,
    });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Booking restriction applied",
      bookingRestriction: user.bookingRestriction,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const liftBookingRestriction = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.json({ success: false, message: "userId is required" });
    }

    const user = await liftAdminBookingRestriction(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "Booking restriction lifted" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const getUserBookingRestriction = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await userModel.findById(userId).select("-password");

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      status: getBookingRestrictionStatus(user),
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const updateUserAccountStatus = async (req, res) => {
  try {
    const { userId, accountStatus } = req.body;
    const allowed = ["green", "warning", "restricted", "blocked"];

    if (!userId || !accountStatus) {
      return res.json({
        success: false,
        message: "userId and accountStatus are required",
      });
    }

    if (!allowed.includes(accountStatus)) {
      return res.json({
        success: false,
        message: `accountStatus must be one of: ${allowed.join(", ")}`,
      });
    }

    const user = await userModel.findByIdAndUpdate(
      userId,
      { accountStatus },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: `Account status updated to ${accountStatus}`,
      user: {
        _id: user._id,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.json({ success: false, message: "userId is required" });
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const userIdStr = userId.toString();
    const appointments = await appointmentModel.find({ userId: userIdStr });

    for (const appointment of appointments) {
      if (!appointment.cancelled) {
        await releaseDoctorSlot(
          appointment.docId,
          appointment.slotDate,
          appointment.slotTime
        );
      }
      await deleteConversationForAppointment(appointment._id);
    }

    await appointmentModel.deleteMany({ userId: userIdStr });

    const conversations = await Conversation.find({ userId: userIdStr });
    for (const conversation of conversations) {
      await Message.deleteMany({ conversationId: conversation._id });
    }
    await Conversation.deleteMany({ userId: userIdStr });

    // Keep payment records for audit; snapshot patient info
    await paymentModel.updateMany(
      { userId: userIdStr },
      {
        $set: {
          patientName: user.name,
          patientEmail: user.email,
          userDeleted: true,
        },
      }
    );

    await emailVerificationModel.deleteOne({ email: user.email });

    if (user.image?.includes("cloudinary")) {
      try {
        const publicId = user.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`DoctorHub/users/${publicId}`);
      } catch (err) {
        console.log("cloudinary user image delete:", err.message);
      }
    }

    await userModel.findByIdAndDelete(userId);

    res.json({
      success: true,
      message:
        "Patient deleted. Appointments, chats, and messages removed. Payment records kept.",
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const allUsers = async (req, res) => {
  try {
    const users = await userModel
      .find({})
      .select("-password")
      .sort({ name: 1 });

    const usersWithStatus = users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      image: user.image,
      accountStatus: user.accountStatus,
      totalCancelledAppointments: user.totalCancelledAppointments || 0,
      totalBookedAppointments: user.totalBookedAppointments || 0,
      bookingRestriction: user.bookingRestriction,
      bookingStatus: getBookingRestrictionStatus(user),
    }));

    res.json({ success: true, users: usersWithStatus });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export {
  addDoctor,
  loginAdmin,
  allDoctors,
  appointmentsAdmin,
  appointmentCancel,
  adminDashboard,
  updateDoctor,
  deleteDoctor,
  applyBookingRestriction,
  liftBookingRestriction,
  getUserBookingRestriction,
  allUsers,
  updateUserAccountStatus,
  deleteUser,
};
