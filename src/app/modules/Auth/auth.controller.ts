import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import AppError from '../../errors/AppError';
import { AuthService } from './auth.service';

// ─── Send OTP ─────────────────────────────────────────────────────────────────
const sendOtp = catchAsync(async (req: Request, res: Response) => {
  const { phone, purpose } = req.body;
  await AuthService.sendOtp({ phone, purpose });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `OTP sent to WhatsApp number ${req.body.phone}`,
  });
});

// ─── Verify OTP ───────────────────────────────────────────────────────────────
const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const { phone, otp, purpose } = req.body;
  const result = await AuthService.verifyOtp({ phone, otp, purpose });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'OTP verified successfully',
    data: result, // { otpToken }
  });
});

// ─── Register ─────────────────────────────────────────────────────────────────
const register = catchAsync(async (req: Request, res: Response) => {
  const { name, phone, password, otpToken } = req.body;
  const { user, tokens } = await AuthService.registerUserIntoDB({
    name,
    phone,
    password,
    otpToken,
  });

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

// ─── Change Password ──────────────────────────────────────────────────────────
const changePassword = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId)
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized access!');

  const { newPassword, otpToken } = req.body;
  await AuthService.changePasswordIntoDB(req.userId, { newPassword, otpToken });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Password changed successfully',
  });
});

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

export const AuthControllers = {
  sendOtp,
  verifyOtp,
  register,
  login,
  changePassword,
  logout,
  getMe,
  // refreshToken
};
