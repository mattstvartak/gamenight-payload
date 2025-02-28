import nodemailer from "nodemailer";

// Create a transporter using environment variables
export const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
};

export const sendEmail = async (payload: EmailPayload) => {
  const defaultFrom = process.env.EMAIL_FROM || "noreply@yourdomain.com";

  try {
    const result = await emailTransporter.sendMail({
      from: payload.from || defaultFrom,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });

    return result;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
