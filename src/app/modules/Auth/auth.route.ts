import { Router } from 'express';
import { AuthControllers } from './auth.controller';
import { AuthValidation } from './auth.validation';
import { authenticate } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';

const router = Router();

// ─── OTP Routes (public) ──────────────────────────────────────────────────────
// Step 1: request OTP
router.post(
  '/send-otp',
  validateRequest(AuthValidation.sendOtpValidationSchema),
  AuthControllers.sendOtp,
);

// Step 2: verify OTP → receive otpToken
router.post(
  '/verify-otp',
  validateRequest(AuthValidation.verifyOtpValidationSchema),
  AuthControllers.verifyOtp,
);

// ─── Public Routes ────────────────────────────────────────────────────────────
// Step 3: register with otpToken
router.post(
  '/register',
  validateRequest(AuthValidation.registerValidationSchema),
  AuthControllers.register,
);

router.post(
  '/login',
  validateRequest(AuthValidation.loginValidationSchema),
  AuthControllers.login,
);

// ─── Protected Routes ─────────────────────────────────────────────────────────
router.get('/me', authenticate, AuthControllers.getMe);

router.post('/logout', authenticate, AuthControllers.logout);

// router.post(
//   '/refresh-token',
//   validateRequest(AuthValidation.refreshTokenValidationSchema),
//   AuthControllers.refreshToken,
// );

// change-password: requires both Bearer token AND otpToken in body
router.post(
  '/change-password',
  authenticate,
  validateRequest(AuthValidation.changePasswordValidationSchema),
  AuthControllers.changePassword,
);

export const AuthRoutes = router;
