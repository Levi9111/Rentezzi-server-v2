import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { User } from './auth.model';
import { generateTokens } from './auth.utils';
// import { verifyToken } from './auth.utils';
// import config from '../../config';

// ─── Register ─────────────────────────────────────────────────────────────────
const registerUserIntoDB = async (
  name: string,
  phone: string,
  password: string,
) => {
  const existingUser = await User.isUserExistsByPhone(phone);

  if (existingUser)
    throw new AppError(StatusCodes.CONFLICT, 'Phone already registered');

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
  registerUserIntoDB,
  loginFromDB,
  // refreshTokenFromDB,
  logout,
  getMeFromDB,
};
