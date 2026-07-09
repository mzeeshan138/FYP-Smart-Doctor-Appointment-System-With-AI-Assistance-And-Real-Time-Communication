/** Cooldown days between bookings — controlled by BOOKING_COOLDOWN_PERIOD */
export const getBookingCooldownDays = () => {
  const period = process.env.BOOKING_COOLDOWN_PERIOD.toUpperCase();

  const presets = {
    "2_MONTHS": Number(process.env.BOOKING_RESTRICTION_2_MONTHS),
    "3_MONTHS": Number(process.env.BOOKING_RESTRICTION_3_MONTHS),
    "6_MONTHS": Number(process.env.BOOKING_RESTRICTION_6_MONTHS),
  };

  if (presets[period]) {
    return presets[period];
  }

  return Number(process.env.DEFAULT_BOOKING_RESTRICTION_DAYS);
};

export const resolveRestrictionDays = (periodOrDays) => {
  if (typeof periodOrDays === "number" && periodOrDays > 0) {
    return periodOrDays;
  }

  const key = String(periodOrDays || "").toUpperCase();
  const presets = {
    "2_MONTHS": Number(process.env.BOOKING_RESTRICTION_2_MONTHS),
    "3_MONTHS": Number(process.env.BOOKING_RESTRICTION_3_MONTHS),
    "6_MONTHS": Number(process.env.BOOKING_RESTRICTION_6_MONTHS),
  };

  return presets[key] || getBookingCooldownDays();
};
