import nodemailer from 'nodemailer';

const port = Number(process.env.SMTP_PORT || 465);
const secure = port === 465;

export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});
