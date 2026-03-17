import bcrypt from 'bcrypt';
import { User } from './user.model';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { generateTokens, verifyToken } from './user.utils';
import config from '../../config';
import { TUser } from './user.interface';
import QueryBuilder from '../../builder/Querybuilder';

const createUserIntoDB = async (
  phone: string,
  password: string,
  name?: string,
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
  // ❌ Prevent phone update
  if (updateData.phone) {
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
  if (updateData.password) {
    updateData.password = await bcrypt.hash(
      updateData.password,
      Number(config.bcrypt_salt_rounds!),
    );
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
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

  user.refreshTokens.push(tokens.refreshToken);
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
const refreshToken = async (refreshToken: string) => {
  const decoded = verifyToken(refreshToken, config.jwt_refresh_secret!);

  const user = await User.findById(decoded.sub);

  if (!user || user.isDeleted || !user.refreshTokens.includes(refreshToken)) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
  }

  const tokens = generateTokens(user._id.toString());

  user.refreshTokens = user.refreshTokens.filter(
    (token) => token !== refreshToken,
  );
  user.refreshTokens.push(tokens.refreshToken);
  await user.save();

  return tokens;
};

// ✅ Logout User
const logoutUser = async (userId: string, refreshToken: string) => {
  const user = await User.findById(userId);

  if (user) {
    user.refreshTokens = user.refreshTokens.filter(
      (token) => token !== refreshToken,
    );
    await user.save();
  }

  return null;
};

// ✅ Get Me
const getMe = async (userId: string) => {
  const user = await User.findOne({
    _id: userId,
    isDeleted: { $ne: true },
  }).select('-password');

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  return user;
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
