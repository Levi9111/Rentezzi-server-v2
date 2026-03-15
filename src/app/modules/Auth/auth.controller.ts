import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { AuthService } from './auth.service';

const register = catchAsync(async (req, res) => {
  const { name, phone, password } = req.body;

  const { user, tokens } = await AuthService.registerUserIntoDB(
    name,
    phone,
    password,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
      },
      ...tokens,
    },
  });
});

const login = catchAsync(async (req, res) => {
  const { phone, password } = req.body;

  const { user, tokens } = await AuthService.login(phone, password);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User logged in successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
      },
      ...tokens,
    },
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  const tokens = await AuthService.refreshToken(refreshToken);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    data: tokens,
  });
});

const logout = catchAsync(async (req, res) => {
  await AuthService.logout(req);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Logged out',
  });
});

const getMe = catchAsync(async (req, res) => {
  const { userId } = req;

  if (!userId)
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized access!');

  const user = await AuthService.getMe(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User profile retrieved successfully',
    data: { user },
  });
});

export const AuthController = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
};
