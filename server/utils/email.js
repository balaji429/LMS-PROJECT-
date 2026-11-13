// Email delivery helper for account verification and recovery.
import nodemailer from "nodemailer";

const smtpPassword = () => process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
export const emailConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && smtpPassword());

export async function sendAccountEmail({ to, subject, text, url }) {
  if (!emailConfigured()) {
    if (process.env.NODE_ENV === "production") return false;
    console.info(`[SmartLearn email preview] ${to}: ${url}`);
    return true;
  }
  const port = Number(process.env.SMTP_PORT || 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user: process.env.SMTP_USER, pass: smtpPassword() },
  });
  await transport.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text: `${text}\n\n${url}\n\nIf you did not request this, you can ignore this email.`,
  });
  return true;
}
