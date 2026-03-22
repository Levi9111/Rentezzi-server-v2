import { Router } from 'express';
import { AuthControllers } from './auth.controller';
import { AuthValidation } from './auth.validation';
import { authenticate } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';

const router = Router();

// ─── Public Routes ────────────────────────────────────────────────────────────
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

// router.post(
//   '/refresh-token',
//   validateRequest(AuthValidation.refreshTokenValidationSchema),
//   AuthControllers.refreshToken,
// );

// ─── Protected Routes ─────────────────────────────────────────────────────────
router.get('/me', authenticate, AuthControllers.getMe);

router.post('/logout', authenticate, AuthControllers.logout);

export const AuthRoutes = router;
