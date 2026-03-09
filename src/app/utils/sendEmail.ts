import nodemailer from 'nodemailer';
import config from '../config';

export const sendEmail = async (to: string, html: string) => {
  const transporter = nodemailer.createTransport({
    host: 'stmp.gmail.com',
    port: 587,
    secure: config.NODE_ENV === 'production',
    auth: {
      user: 'captainlevi9111@gmail.com',
      pass: 'ohxz zaug rlgn kewr',
    },
  });

  await transporter.sendMail({
    from: 'captainlevi9111.gmail.com',
    to,
    subject: 'Forgot your password?',
    text: 'Reset your password',
    html,
  });
};
