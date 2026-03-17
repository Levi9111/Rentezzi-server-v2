import bcrypt from 'bcrypt';
import { User } from './user.model';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import {
  generateTokens,
  verifyToken,
  hashRefreshToken,
  verifyRefreshTokenHash,
  cleanupRefreshTokens,
} from './user.utils';
import config from '../../config';
import { TUser } from './user.interface';
import QueryBuilder from '../../builder/Querybuilder';

const createUserIntoDB = async (
  phone: string,
  password: string,
  name?: string,
) => {
  const existingUser = await User.findOne({ phone, isDeleted: { $ne: true } });

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

// ✅ Update User (phone cannot be updated)
const updateUserInDB = async (userId: string, updateData: Partial<TUser>) => {
  const dataToUpdate = { ...updateData };
  // ❌ Prevent phone update
  if (dataToUpdate.phone) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Phone number cannot be updated',
    );
  }

  const user = await User.findById(userId);

  if (!user || user.isDeleted) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // Optional: hash password if updating password
  if (dataToUpdate.password) {
    dataToUpdate.password = await bcrypt.hash(
      dataToUpdate.password,
      Number(config.bcrypt_salt_rounds!),
    );
  }

  const updatedUser = await User.findByIdAndUpdate(userId, dataToUpdate, {
    new: true,
    runValidators: true,
  }).select('-password');

  return updatedUser;
};

// ✅ Soft Delete User
const deleteUserFromDB = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user || user.isDeleted) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  user.isDeleted = true;
  await user.save();

  return null;
};

// ✅ Get All Users (with filtering, pagination)
const getAllUsersFromDB = async (query: Record<string, unknown>) => {
  const baseQuery = User.find({ isDeleted: { $ne: true } }).select('-password');

  const queryBuilder = new QueryBuilder(baseQuery, query)
    .search(['name', 'phone'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const users = await queryBuilder.modelQuery;

  return users;
};

// ✅ Get Single User
const getUserByIdFromDB = async (userId: string) => {
  const user = await User.findOne({
    _id: userId,
    isDeleted: { $ne: true },
  }).select('-password');

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  return user;
};

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

// ✅ Get Me
const getMe = async (userId: string) => {
  return getUserByIdFromDB(userId);
};

export const UserService = {
  createUserIntoDB,
  updateUserInDB,
  deleteUserFromDB,
  getAllUsersFromDB,
  getUserByIdFromDB,
  loginUser,
  refreshToken,
  logoutUser,
  getMe,
};
