import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { Otp, User } from './auth.model';
import {
  generateOtp,
  generateOtpToken,
  generateTokens,
  sendWhatsAppOtp,
  verifyOtpToken,
} from './auth.utils';
import {
  TChangePasswordBody,
  TRegisterBody,
  TSendOtpBody,
  TVerifyOtpBody,
} from './auth.interface';
import config from '../../config';
import bcrypt from 'bcrypt';
// import { verifyToken } from './auth.utils';
// import config from '../../config';

// ─── Send OTP ─────────────────────────────────────────────────────────────────
const sendOtp = async (
  payload: TSendOtpBody & { purpose: 'register' | 'change-password' },
) => {
  const { phone, purpose } = payload;

  // ── Guard: for register, phone must not already exist ─────────────────────
  if (purpose === 'register') {
    const existingUser = await User.isUserExistsByPhone(phone);
    if (existingUser)
      throw new AppError(StatusCodes.CONFLICT, 'Phone already registered');
  }

  // ── Guard: for change-password, phone must exist ───────────────────────────
  if (purpose === 'change-password') {
    const existingUser = await User.isUserExistsByPhone(phone);
    if (!existingUser)
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'No account found with this phone number',
      );
  }

  // ── Invalidate any existing unused OTP for this phone + purpose ───────────
  await Otp.deleteMany({ phone });

  // ── Generate and hash OTP ─────────────────────────────────────────────────
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, Number(config.bcrypt_salt_rounds!));

  // ── Save to DB with 10 min TTL ────────────────────────────────────────────
  await Otp.create({
    phone,
    otpHash,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  // ── Send via WhatsApp ─────────────────────────────────────────────────────
  await sendWhatsAppOtp(phone, otp);
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────
const verifyOtp = async (
  payload: TVerifyOtpBody & { purpose: 'register' | 'change-password' },
) => {
  const { phone, otp, purpose } = payload;

  const otpRecord = await Otp.findOne({ phone });

  // ── OTP not found or already used ─────────────────────────────────────────
  if (!otpRecord || otpRecord.isUsed)
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'OTP is invalid or has expired',
    );

  // ── OTP expired ───────────────────────────────────────────────────────────
  if (otpRecord.expiresAt < new Date())
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'OTP has expired. Please request a new one.',
    );

  // ── Brute force protection: max 5 attempts ────────────────────────────────
  if (otpRecord.attempts >= 5) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw new AppError(
      StatusCodes.TOO_MANY_REQUESTS,
      'Too many failed attempts. Please request a new OTP.',
    );
  }

  // ── Compare OTP ───────────────────────────────────────────────────────────
  const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);

  if (!isMatch) {
    // Increment attempts on failure
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Incorrect OTP. ${5 - otpRecord.attempts} attempts remaining.`,
    );
  }

  // ── Mark OTP as used so it cannot be reused ───────────────────────────────
  otpRecord.isUsed = true;
  await otpRecord.save();

  // ── Issue short-lived otpToken — frontend sends this with register / change-password
  const otpToken = generateOtpToken({ phone, purpose });

  return { otpToken };
};

// ─── Register ─────────────────────────────────────────────────────────────────
const registerUserIntoDB = async (payload: TRegisterBody) => {
  const { name, phone, password, otpToken } = payload;

  // ── Verify otpToken ───────────────────────────────────────────────────────
  const decoded = verifyOtpToken(otpToken);

  if (decoded.phone !== phone)
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'OTP token phone does not match',
    );

  if (decoded.purpose !== 'register')
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid OTP token purpose');

  // ── Final check: phone still not taken ────────────────────────────────────
  const existingUser = await User.isUserExistsByPhone(phone);
  if (existingUser)
    throw new AppError(StatusCodes.CONFLICT, 'Phone already registered');

  // ── Create user — password hashed by pre-save hook in model ───────────────
  const user = await User.create({ name, phone, password });

  const tokens = generateTokens(user._id.toString());

  user.refreshTokens.push(tokens.refreshToken);
  await user.save();

  return { user, tokens };
};

// ─── Login ────────────────────────────────────────────────────────────────────
const loginFromDB = async (phone: string, password: string) => {
  const user = await User.isUserExistsByPhone(phone);

  if (!user)
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');

  const isMatch = await User.isPasswordMatched(password, user.password);

  if (!isMatch)
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');

  const tokens = generateTokens(user._id.toString());

  user.refreshTokens.push(tokens.refreshToken);
  await user.save();

  const { password: _, refreshTokens: __, ...safeUser } = user.toObject();

  return { user: safeUser, tokens };
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
// const refreshTokenFromDB = async (token: string) => {
//   const decoded = verifyToken(token, config.jwt_refresh_secret as string);
//
//   const user = await User.findById(decoded.sub);
//
//   if (!user || !user.refreshTokens.includes(token))
//     throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
//
//   user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
//
//   const tokens = generateTokens(user._id.toString());
//
//   user.refreshTokens.push(tokens.refreshToken);
//   await user.save();
//
//   return tokens;
// };

// ─── Change Password ──────────────────────────────────────────────────────────
const changePasswordIntoDB = async (
  userId: string,
  payload: TChangePasswordBody,
) => {
  const { newPassword, otpToken } = payload;

  const user = await User.findById(userId).select('+password');

  if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');

  // ── Verify otpToken ───────────────────────────────────────────────────────
  const decoded = verifyOtpToken(otpToken);

  if (decoded.phone !== user.phone)
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'OTP token phone does not match account',
    );

  if (decoded.purpose !== 'change-password')
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid OTP token purpose');

  // ── Update password — pre-save hook hashes it ─────────────────────────────
  user.password = newPassword;
  await user.save();

  // ── Invalidate all sessions ───────────────────────────────────────────────
  user.refreshTokens = [];
  await user.save();
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = async (req: Request) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    throw new AppError(StatusCodes.BAD_REQUEST, 'Refresh token is required');

  const user = await User.findById(req.userId);

  if (user) {
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    await user.save();
  }
};

// ─── Get Me ───────────────────────────────────────────────────────────────────
const getMeFromDB = async (userId: string) => {
  const result = await User.findById(userId).select('-password -refreshTokens');

  if (!result) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');

  return result;
};

export const AuthService = {
  sendOtp,
  verifyOtp,
  registerUserIntoDB,
  loginFromDB,
  changePasswordIntoDB,
  logout,
  getMeFromDB,
  // refreshTokenFromDB,
};
