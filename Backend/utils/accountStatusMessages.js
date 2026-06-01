export const getAccountBannedMessage = () => {
  const helpline =
    process.env.HELPLINE_CONTACT ||
    "support@doctorhub.com";

  return `Your account has been banned. You cannot use this platform. Please contact our helpline: ${helpline}`;
};
