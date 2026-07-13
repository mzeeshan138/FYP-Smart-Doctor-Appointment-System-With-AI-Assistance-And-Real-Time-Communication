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
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user, pass },
    connectionTimeout: 10000,
    socketTimeout: 10000,
    family: 4,
  });
};

export const sendPasswordResetEmail = async (email, resetLink, expiryMinutes) => {
  const fromName = process.env.GOOGLE_FROM_NAME;
  const fromEmail = process.env.GOOGLE_APP_USER;

  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: email,
    subject: "Reset your password — DoctorHub",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2563eb;">DoctorHub Password Reset</h2>
        <p>We received a request to reset your password. Click the button below to choose a new password:</p>
        <p style="margin: 24px 0;">
          <a href="${resetLink}" style="background-color: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </p>
        <p style="color: #666; font-size: 14px;">Or copy this link into your browser:<br/>${resetLink}</p>
        <p style="color: #666;">This link expires in ${expiryMinutes} minutes. If you did not request a password reset, ignore this email.</p>
      </div>
    `,
  });
};

export const sendVerificationEmail = async (email, code) => {
  const fromName = process.env.GOOGLE_FROM_NAME;
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
