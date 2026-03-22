import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import AppError from '../../errors/AppError';
import { AuthService } from './auth.service';

// ─── Register ─────────────────────────────────────────────────────────────────
const register = catchAsync(async (req: Request, res: Response) => {
  const { name, phone, password } = req.body;

  const { user, tokens } = await AuthService.registerUserIntoDB(
    name,
    phone,
    password,
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
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

// ─── Login ────────────────────────────────────────────────────────────────────
const login = catchAsync(async (req: Request, res: Response) => {
  const { phone, password } = req.body;

  const { user, tokens } = await AuthService.loginFromDB(phone, password);

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

// ─── Refresh Token ────────────────────────────────────────────────────────────
// const refreshToken = catchAsync(async (req: Request, res: Response) => {
//   const { refreshToken } = req.body;
//
//   const tokens = await AuthService.refreshTokenFromDB(refreshToken);
//
//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: 'Token refreshed successfully',
//     data: tokens,
//   });
// });

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = catchAsync(async (req: Request, res: Response) => {
  await AuthService.logout(req);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Logged out successfully',
  });
});

// ─── Get Me ───────────────────────────────────────────────────────────────────
const getMe = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId)
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized access!');

  const result = await AuthService.getMeFromDB(req.userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User profile retrieved successfully',
    data: result,
  });
});

export const AuthControllers = {
  register,
  login,
  // refreshToken,
  logout,
  getMe,
};
