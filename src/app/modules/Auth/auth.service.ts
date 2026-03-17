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
/*


// ✅ Login User
const loginUser = async (phone: string, password: string) => {
  const user = await User.findOne({ phone }).select('+password');

  if (!user || user.isDeleted) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
  }

  const tokens = generateTokens(user._id.toString());

  // Hash and store refresh token with expiration
  const tokenHash = await hashRefreshToken(tokens.refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  user.refreshTokens.push({ tokenHash, expiresAt });

  // Cleanup old/expired tokens and enforce max limit
  user.refreshTokens = cleanupRefreshTokens(user.refreshTokens);
  await user.save();

  return {
    user: {
      id: user._id,
      name: user.name,
      phone: user.phone,
    },
    tokens,
  };
};

// ✅ Refresh Token
const refreshToken = async (refreshTokenValue: string) => {
  const decoded = verifyToken(refreshTokenValue, config.jwt_refresh_secret!);

  const user = await User.findById(decoded.sub);

  if (!user || user.isDeleted) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
  }

  // Verify the refresh token hash matches one in the stored list
  let tokenFound = false;
  for (const entry of user.refreshTokens) {
    const isValid = await verifyRefreshTokenHash(
      refreshTokenValue,
      entry.tokenHash,
    );
    if (isValid && entry.expiresAt > new Date()) {
      tokenFound = true;
      break;
    }
  }

  if (!tokenFound) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
  }

  const tokens = generateTokens(user._id.toString());

  // Find and remove the old token by comparing hashes
  const updatedTokens = [];
  for (const entry of user.refreshTokens) {
    const isOldToken = await verifyRefreshTokenHash(
      refreshTokenValue,
      entry.tokenHash,
    );
    if (!isOldToken) {
      updatedTokens.push(entry);
    }
  }
  user.refreshTokens = updatedTokens;

  // Hash and store new refresh token
  const newTokenHash = await hashRefreshToken(tokens.refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  user.refreshTokens.push({ tokenHash: newTokenHash, expiresAt });

  // Cleanup old/expired tokens
  user.refreshTokens = cleanupRefreshTokens(user.refreshTokens);
  await user.save();

  return tokens;
};

// ✅ Logout User
const logoutUser = async (userId: string, refreshTokenValue: string) => {
  const user = await User.findById(userId);

  if (user) {
    // Find and remove token by comparing hashes
    const updatedTokens = [];
    for (const entry of user.refreshTokens) {
      const isMatchingToken = await verifyRefreshTokenHash(
        refreshTokenValue,
        entry.tokenHash,
      );
      if (!isMatchingToken) {
        updatedTokens.push(entry);
      }
    }
    user.refreshTokens = updatedTokens;
    await user.save();
  }

  return null;
};
*/
