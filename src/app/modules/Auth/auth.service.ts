import bcrypt from 'bcrypt';
import { Request } from 'express';
import { User } from './auth.model';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { generateTokens, verifyToken } from './auth.utils';
import config from '../../config';

const registerUserIntoDB = async (
  name: string,
  phone: string,
  password: string,
) => {
  const existingUser = await User.findOne({ phone });

  if (existingUser)
    throw new AppError(StatusCodes.CONFLICT, 'Phone already registered');

  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds!),
  );

  const user = await User.create({
    name,
    phone,
    password: hashedPassword,
  });

  const tokens = generateTokens(user._id.toString());

  user.refreshTokens.push(tokens.refreshToken);
  await user.save();

  return { user, tokens };
};

const login = async (phone: string, password: string) => {
  const user = await User.findOne({ phone }).select('+password');

  if (!user)
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
  }

  const tokens = generateTokens(user._id.toString());

  user.refreshTokens.push(tokens.refreshToken);
  await user.save();

  const { password: _, refreshTokens: __, ...safeUser } = user.toObject();

  return { user: safeUser, tokens };
};

const refreshToken = async (token: string) => {
  const decoded = verifyToken(token, config.jwt_refresh_secret as string);

  const user = await User.findById(decoded.sub);

  if (!user || !user.refreshTokens.includes(token))
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');

  user.refreshTokens = user.refreshTokens.filter((t) => t !== token);

  const tokens = generateTokens(user._id.toString());

  user.refreshTokens.push(tokens.refreshToken);
  await user.save();

  return tokens;
};

const logout = async (req: Request) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Refresh token is required');
  }

  const user = await User.findById(req.userId);

  if (user) {
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    await user.save();
  }
};

const getMe = async (userId: string) => {
  const user = await User.findById(userId).select('-password');

  return user;
};

export const AuthService = {
  registerUserIntoDB,
  login,
  refreshToken,
  logout,
  getMe,
};
