import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import Conversation from "../models/conversationModel.js";
import {
  checkAllBookingRestrictions,
  recordSuccessfulBooking,
} from "./bookingRestrictionService.js";

export const calculateDepositAmount = (totalFees) =>
  Math.round(totalFees * 0.1 * 100) / 100;

export const calculateBalanceAmount = (totalFees, depositAmount) =>
  Math.round((totalFees - depositAmount) * 100) / 100;

/**
 * All checks from original bookAppointment — run BEFORE payment (Stripe checkout).
 * No slot is reserved and no appointment is created here.
 */
export const validateBookingEligibility = async (
  userId,
  docId,
  slotDate,
  slotTime
) => {
  if (!userId || !docId || !slotDate || !slotTime) {
    return { eligible: false, message: "Missing booking details" };
  }

  const existingAppointment = await appointmentModel.findOne({
    userId,
    cancelled: false,
    isCompleted: false,
  });

  if (existingAppointment) {
    return {
      eligible: false,
      message:
        "You already have an active appointment. Complete or cancel it before booking a new one.",
    };
  }

  const docData = await doctorModel.findById(docId).select("-password");

  if (!docData) {
    return { eligible: false, message: "Doctor not found" };
  }

  if (!docData.available) {
    return { eligible: false, message: "Doctor is not available" };
  }

  const slots_booked = docData.slots_booked || {};

  if (slots_booked[slotDate]?.includes(slotTime)) {
    return { eligible: false, message: "Slot not available" };
  }

  const restrictionCheck = await checkAllBookingRestrictions(userId);

  if (!restrictionCheck.allowed) {
    return {
      eligible: false,
      message: restrictionCheck.message,
      nextBookingDate: restrictionCheck.nextBookingDate,
    };
  }

  return {
    eligible: true,
    docData,
    userData: restrictionCheck.userData,
    depositAmount: calculateDepositAmount(docData.fees),
    totalFees: docData.fees,
    cooldownDays: restrictionCheck.cooldownDays,
  };
};

/**
 * After successful Stripe deposit — book slot and create appointment.
 * Assumes validateBookingEligibility already passed; re-checks slot race only.
 */
export const finalizeAppointmentAfterPayment = async ({
  userId,
  docId,
  slotDate,
  slotTime,
  depositAmount,
}) => {
  const existingAppointment = await appointmentModel.findOne({
    userId,
    cancelled: false,
    isCompleted: false,
  });

  if (existingAppointment) {
    throw new Error(
      "You already have an active appointment. Contact support if you were charged."
    );
  }

  const docData = await doctorModel.findById(docId).select("-password");

  if (!docData) {
    throw new Error("Doctor not found");
  }

  if (!docData.available) {
    throw new Error("Doctor is no longer available");
  }

  let slots_booked = docData.slots_booked || {};

  if (slots_booked[slotDate]?.includes(slotTime)) {
    throw new Error(
      "This slot was just booked. Please contact support regarding your deposit payment."
    );
  }

  if (slots_booked[slotDate]) {
    slots_booked[slotDate].push(slotTime);
  } else {
    slots_booked[slotDate] = [slotTime];
  }

  const restrictionCheck = await checkAllBookingRestrictions(userId);

  if (!restrictionCheck.allowed) {
    throw new Error(restrictionCheck.message);
  }

  const userData = restrictionCheck.userData;

  const totalFees = docData.fees;
  const balanceAmount = calculateBalanceAmount(totalFees, depositAmount);

  delete docData.slots_booked;

  const appointmentData = {
    userId,
    docId,
    userData,
    docData,
    amount: totalFees,
    depositAmount,
    balanceAmount,
    depositPaid: true,
    balancePaid: false,
    payment: false,
    slotTime,
    slotDate,
    date: Date.now(),
  };

  const newAppointment = new appointmentModel(appointmentData);
  await newAppointment.save();

  await doctorModel.findByIdAndUpdate(docId, { slots_booked });

  const existingConversation = await Conversation.findOne({
    docId,
    userId,
    appointmentId: newAppointment._id,
  });

  if (!existingConversation) {
    await Conversation.create({
      docId,
      userId,
      appointmentId: newAppointment._id,
    });
  }

  await recordSuccessfulBooking(userId, newAppointment._id);

  return newAppointment;
};

/** @deprecated Use validateBookingEligibility */
export const validateSlotForBooking = async (docId, slotDate, slotTime) => {
  const docData = await doctorModel.findById(docId).select("-password");

  if (!docData) {
    return { valid: false, message: "Doctor not found" };
  }

  if (!docData.available) {
    return { valid: false, message: "Doctor is not available" };
  }

  const slots_booked = docData.slots_booked || {};
  if (slots_booked[slotDate]?.includes(slotTime)) {
    return { valid: false, message: "Slot not available" };
  }

  return { valid: true, docData };
};

/** @deprecated Use finalizeAppointmentAfterPayment */
export const createAppointmentAfterDeposit = finalizeAppointmentAfterPayment;
