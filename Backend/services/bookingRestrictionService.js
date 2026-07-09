import userModel from "../models/userModel.js";
import {
  getBookingCooldownDays,
  resolveRestrictionDays,
} from "../utils/bookingRestrictionConfig.js";

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const daysUntil = (futureDate) =>
  Math.max(
    0,
    Math.ceil((new Date(futureDate) - new Date()) / (1000 * 60 * 60 * 24))
  );

/** Clear admin restriction if end date has passed */
export const clearExpiredAdminRestriction = async (userData) => {
  const restriction = userData.bookingRestriction;

  if (!restriction?.isRestricted || !restriction.restrictionEndDate) {
    return userData;
  }

  if (new Date() >= new Date(restriction.restrictionEndDate)) {
    restriction.isRestricted = false;
    restriction.restrictionReason =
      restriction.restrictionReason || "";
    await userData.save();
  }

  return userData;
};

/** Block booking when account is restricted/blocked (too many cancellations) */
export const checkCancelAccountRestriction = (userData) => {
  const status = userData.accountStatus;

  if (status === "restricted" || status === "blocked") {
    const limit = Number(process.env.CANCEL_APPOINTMENT_LIMIT);

    return {
      allowed: false,
      message: `Your account is restricted due to excessive cancellations (${limit}+ per year). You cannot book new appointments.`,
      accountStatus: status,
    };
  }

  return { allowed: true };
};

/** Admin-imposed booking ban */
export const checkAdminBookingRestriction = async (userData) => {
  await clearExpiredAdminRestriction(userData);

  const restriction = userData.bookingRestriction;

  if (!restriction?.isRestricted) {
    return { allowed: true };
  }

  const endDate = restriction.restrictionEndDate
    ? new Date(restriction.restrictionEndDate)
    : null;

  if (endDate && new Date() < endDate) {
    const reason =
      restriction.restrictionReason ||
      "Your account is under a booking restriction.";

    return {
      allowed: false,
      message: `You cannot book until ${endDate.toLocaleDateString()}. Reason: ${reason}`,
      restrictionEndDate: endDate,
    };
  }

  return { allowed: true };
};

/** One booking per cooldown period (2 / 3 / 6 months from env) */
export const checkBookingCooldown = (userData) => {
  const history = userData.bookingHistory || [];

  if (history.length === 0) {
    return { allowed: true };
  }

  const lastBooking = [...history].sort(
    (a, b) => new Date(b.bookedAt) - new Date(a.bookedAt)
  )[0];

  if (!lastBooking?.bookedAt) {
    return { allowed: true };
  }

  const cooldownDays = getBookingCooldownDays();
  const nextAllowedDate = addDays(new Date(lastBooking.bookedAt), cooldownDays);

  if (new Date() < nextAllowedDate) {
    const daysLeft = daysUntil(nextAllowedDate);

    return {
      allowed: false,
      message: `You can book again in ${daysLeft} day(s) (${nextAllowedDate.toLocaleDateString()}). Only one appointment is allowed every ${cooldownDays} days.`,
      nextBookingDate: nextAllowedDate,
      cooldownDays,
    };
  }

  return { allowed: true, cooldownDays };
};

export const checkAllBookingRestrictions = async (userId) => {
  const userData = await userModel.findById(userId);

  if (!userData) {
    return { allowed: false, message: "User not found" };
  }

  const accountCheck = checkCancelAccountRestriction(userData);
  if (!accountCheck.allowed) {
    return accountCheck;
  }

  const adminCheck = await checkAdminBookingRestriction(userData);
  if (!adminCheck.allowed) {
    return adminCheck;
  }

  const cooldownCheck = checkBookingCooldown(userData);
  if (!cooldownCheck.allowed) {
    return cooldownCheck;
  }

  return {
    allowed: true,
    userData,
    cooldownDays: cooldownCheck.cooldownDays ?? getBookingCooldownDays(),
  };
};

export const recordSuccessfulBooking = async (userId, appointmentId) => {
  const userData = await userModel.findById(userId);

  if (!userData) return;

  userData.totalBookedAppointments =
    (userData.totalBookedAppointments || 0) + 1;

  userData.bookingHistory.push({
    appointmentId,
    bookedAt: new Date(),
  });

  await userData.save();
};

export const applyAdminBookingRestriction = async (
  userId,
  { period = "3_MONTHS", durationDays, reason = "" }
) => {
  const days = durationDays ?? resolveRestrictionDays(period);
  const now = new Date();
  const endDate = addDays(now, days);

  const userData = await userModel.findByIdAndUpdate(
    userId,
    {
      bookingRestriction: {
        isRestricted: true,
        restrictedAt: now,
        restrictionEndDate: endDate,
        restrictionDurationDays: days,
        restrictionReason: reason,
      },
    },
    { new: true }
  );

  return userData;
};

export const liftAdminBookingRestriction = async (userId) => {
  return userModel.findByIdAndUpdate(
    userId,
    {
      bookingRestriction: {
        isRestricted: false,
        restrictedAt: null,
        restrictionEndDate: null,
        restrictionDurationDays: 0,
        restrictionReason: "",
      },
    },
    { new: true }
  );
};

export const getBookingRestrictionStatus = (userData) => {
  const cooldownDays = getBookingCooldownDays();
  const history = userData.bookingHistory || [];
  const lastBooking =
    history.length > 0
      ? [...history].sort(
          (a, b) => new Date(b.bookedAt) - new Date(a.bookedAt)
        )[0]
      : null;

  let nextBookingDate = null;
  if (lastBooking?.bookedAt) {
    nextBookingDate = addDays(new Date(lastBooking.bookedAt), cooldownDays);
  }

  const restriction = userData.bookingRestriction || {};

  const accountCheck = checkCancelAccountRestriction(userData);

  return {
    accountStatus: userData.accountStatus || "green",
    totalCancelledAppointments: userData.totalCancelledAppointments || 0,
    canBookByAccountStatus: accountCheck.allowed,
    totalBookedAppointments: userData.totalBookedAppointments || 0,
    bookingCooldownDays: cooldownDays,
    lastBookedAt: lastBooking?.bookedAt || null,
    nextBookingDate,
    canBookByCooldown: !nextBookingDate || new Date() >= nextBookingDate,
    adminRestriction: {
      isRestricted: !!restriction.isRestricted,
      restrictedAt: restriction.restrictedAt || null,
      restrictionEndDate: restriction.restrictionEndDate || null,
      restrictionDurationDays: restriction.restrictionDurationDays || 0,
      restrictionReason: restriction.restrictionReason || "",
    },
  };
};
