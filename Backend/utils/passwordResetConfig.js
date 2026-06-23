/** Cooldown days between password resets — controlled by PASSWORD_RESET_COOLDOWN_PERIOD */
export const getPasswordResetCooldownDays = () => {
  const period = (
    process.env.PASSWORD_RESET_COOLDOWN_PERIOD || "1_MONTH"
  ).toUpperCase();

  const presets = {
    "15_DAYS": Number(process.env.PASSWORD_RESET_COOLDOWN_15_DAYS) || 15,
    "1_MONTH": Number(process.env.PASSWORD_RESET_COOLDOWN_1_MONTH) || 30,
    "6_MONTHS": Number(process.env.PASSWORD_RESET_COOLDOWN_6_MONTHS) || 180,
  };

  if (presets[period]) {
    return presets[period];
  }

  return Number(process.env.DEFAULT_PASSWORD_RESET_COOLDOWN_DAYS) || 30;
};

export const getPasswordResetTokenExpiryMinutes = () =>
  Number(process.env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES) || 60;
