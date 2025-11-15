import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const mailerConfig = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAIL_EMAIL_USER || "",
    pass: process.env.NODEMAIL_EMAIL_PASSWORD || "",
  }
});

export default mailerConfig;