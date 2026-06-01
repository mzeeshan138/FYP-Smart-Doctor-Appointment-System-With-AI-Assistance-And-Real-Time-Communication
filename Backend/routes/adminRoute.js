import expres from "express";

import {
  addDoctor,
  adminDashboard,
  allDoctors,
  appointmentCancel,
  appointmentsAdmin,
  loginAdmin,
  updateDoctor,
  deleteDoctor,
  applyBookingRestriction,
  liftBookingRestriction,
  getUserBookingRestriction,
  allUsers,
  updateUserAccountStatus,
  deleteUser,
} from "../controllers/adminController.js";
import upload from "../middlewares/multer.js";
import authAdmin from "../middlewares/authAdmin.js";
import { changeAvailabilty } from "../controllers/doctorController.js";

const adminRouter = expres.Router();

adminRouter.post("/add-doctor", authAdmin, upload.single("image"), addDoctor);
adminRouter.post("/login", loginAdmin);
adminRouter.get("/all-doctors", authAdmin, allDoctors);
adminRouter.post("/change-availability", authAdmin, changeAvailabilty);
adminRouter.get("/appointments", authAdmin, appointmentsAdmin);
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel);
adminRouter.get("/dashboard", authAdmin, adminDashboard);
adminRouter.post("/update-doctor", authAdmin, upload.single("image"), updateDoctor);
adminRouter.post("/delete-doctor", authAdmin, deleteDoctor);
adminRouter.post("/apply-booking-restriction", authAdmin, applyBookingRestriction);
adminRouter.post("/lift-booking-restriction", authAdmin, liftBookingRestriction);
adminRouter.get(
  "/user-booking-restriction/:userId",
  authAdmin,
  getUserBookingRestriction
);
adminRouter.get("/all-users", authAdmin, allUsers);
adminRouter.post(
  "/update-account-status",
  authAdmin,
  updateUserAccountStatus
);
adminRouter.post("/delete-user", authAdmin, deleteUser);

export default adminRouter;
