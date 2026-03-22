import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import axios from 'axios';
import crypto from 'crypto';
import AppError from '../../errors/AppError';
import config from '../../config';
import { TOtpTokenPayload } from './auth.interface';

// ─── Verify Token ─────────────────────────────────────────────────────────────
export const verifyToken = (token: string, secret: string): { sub: string } => {
  try {
    const decoded = jwt.verify(token, secret);

    if (
      typeof decoded === 'object' &&
      decoded !== null &&
      typeof decoded.sub === 'string'
    ) {
      return { sub: decoded.sub };
    }

    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid token payload');
  } catch {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized access!');
  }
};

// ─── Generate Tokens ──────────────────────────────────────────────────────────
export const generateTokens = (userId: string) => {
  if (!config.jwt_access_secret || !config.jwt_refresh_secret) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'JWT secrets are not configured',
    );
  }

  const accessToken = jwt.sign(
    { sub: userId },
    config.jwt_access_secret as string,
    {
      expiresIn:
        (config.jwt_access_expires_in as jwt.SignOptions['expiresIn']) ?? '15m',
    },
  );

  const refreshToken = jwt.sign(
    { sub: userId },
    config.jwt_refresh_secret as string,
    {
      expiresIn:
        (config.jwt_refresh_expires_in as jwt.SignOptions['expiresIn']) ?? '7d',
    },
  );

  return { accessToken, refreshToken };
};

// ─── Generate OTP Token (short-lived JWT after OTP verified) ──────────────────
// Frontend holds this and sends it with /register or /change-password
// Proves the phone was verified without storing state on the server
export const generateOtpToken = (payload: TOtpTokenPayload): string => {
  if (!config.jwt_otp_secret) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'OTP JWT secret is not configured',
    );
  }

  return jwt.sign(payload, config.jwt_otp_secret as string, {
    expiresIn: '15m',
  });
};

// ─── Verify OTP Token ─────────────────────────────────────────────────────────
export const verifyOtpToken = (token: string): TOtpTokenPayload => {
  if (!config.jwt_otp_secret) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'OTP JWT secret is not configured',
    );
  }

  try {
    const decoded = jwt.verify(
      token,
      config.jwt_otp_secret as string,
    ) as TOtpTokenPayload;

    return decoded;
  } catch {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      'OTP session expired. Please verify your phone again.',
    );
  }
};

// ─── Generate 6-digit OTP ─────────────────────────────────────────────────────
export const generateOtp = (): string => {
  // crypto.randomInt is cryptographically secure — Math.random() is NOT safe for OTPs
  return crypto.randomInt(100000, 999999).toString();
};

// ─── Send OTP via WhatsApp ────────────────────────────────────────────────────
// Supports two providers — set WHATSAPP_PROVIDER=twilio or meta in .env
export const sendWhatsAppOtp = async (
  phone: string,
  otp: string,
): Promise<void> => {
  const provider = config.whatsapp_provider;
  const message = `Your Rentezzi verification code is: *${otp}*\n\nThis code expires in 10 minutes. Do not share it with anyone.`;

  if (provider === 'twilio') {
    await sendViaTwilio(phone, message);
  } else {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'WhatsApp provider is not configured',
    );
  }
};

// ─── Twilio WhatsApp ──────────────────────────────────────────────────────────
const sendViaTwilio = async (phone: string, message: string): Promise<void> => {
  const accountSid = config.twilio_account_sid as string;
  const authToken = config.twilio_auth_token as string;
  const fromNumber = config.twilio_whatsapp_number as string; // e.g. whatsapp:+14155238886

  if (!accountSid || !authToken || !fromNumber) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Twilio credentials are not configured',
    );
  }

  // Bangladeshi phone → international format: 01XXXXXXXXX → +880XXXXXXXXX
  const toNumber = `whatsapp:+88${phone}`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  await axios.post(
    url,
    new URLSearchParams({
      From: fromNumber,
      To: toNumber,
      Body: message,
    }),
    {
      auth: { username: accountSid, password: authToken },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
  );
};
