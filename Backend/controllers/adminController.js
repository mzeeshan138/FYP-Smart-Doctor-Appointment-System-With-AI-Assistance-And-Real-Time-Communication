import validator from "validator";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
import {
  deleteConversationForAppointment,
  releaseDoctorSlot,
} from "./appointmentController.js";
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

export {
  addDoctor,
  loginAdmin,
  allDoctors,
  appointmentsAdmin,
  appointmentCancel,
  adminDashboard,
  updateDoctor,
  deleteDoctor,
};
