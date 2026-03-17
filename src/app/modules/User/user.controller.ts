import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { UserService } from './user.service';
import AppError from '../../errors/AppError';

// ✅ Register
const register = catchAsync(async (req, res) => {
  const { phone, password, name } = req.body;

  const { user, tokens } = await UserService.createUserIntoDB(
    phone,
    password,
    name,
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED, // ✅ fixed
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      ...tokens,
    },
  });
});

// ✅ Update User (self)
const updateUser = catchAsync(async (req, res) => {
  const userId = req.userId; // from auth middleware

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  const { name, phone, imgUrl } = req.body; // whitelist allowed fields
  const updateData: Partial<{ name: string; phone: string; imgUrl: string }> =
    {};
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (imgUrl !== undefined) updateData.imgUrl = imgUrl;

  const result = await UserService.updateUserInDB(userId, updateData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User updated successfully',
    data: result,
  });
});

// ✅ Soft Delete User
const deleteUser = catchAsync(async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  await UserService.deleteUserFromDB(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User deleted successfully',
    data: null,
  });
});

// ✅ Get All Users (admin use)
const getAllUsers = catchAsync(async (req, res) => {
  const result = await UserService.getAllUsersFromDB(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Users retrieved successfully',
    data: result,
  });
});

// (Optional) Get user by ID (admin)
const getUserById = catchAsync(async (req, res) => {
  const { id } = req.params as { id: string };

  if (!id) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User ID is required');
  }

  const result = await UserService.getUserByIdFromDB(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User retrieved successfully',
    data: result,
  });
});

export const UserController = {
  register,
  updateUser,
  deleteUser,
  getAllUsers,
  getUserById,
};
