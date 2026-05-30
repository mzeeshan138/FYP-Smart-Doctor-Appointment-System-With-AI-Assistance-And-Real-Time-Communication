import nodemailer from "nodemailer";

const getTransporter = () => {
  const user = process.env.GOOGLE_APP_USER;
  const pass = process.env.GOOGLE_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "Gmail credentials missing. Set GOOGLE_APP_USER and GOOGLE_APP_PASSWORD in config.env"
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
};

export const sendVerificationEmail = async (email, code) => {
  const fromName = process.env.GOOGLE_FROM_NAME || "doctorhub";
  const fromEmail = process.env.GOOGLE_APP_USER;

  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: email,
    subject: "Verify your email — DoctorHub",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2563eb;">DoctorHub Email Verification</h2>
        <p>Use the code below to verify your email and complete registration:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111;">${code}</p>
        <p style="color: #666;">This code expires in 10 minutes. If you did not request this, ignore this email.</p>
      </div>
    `,
  });
};
