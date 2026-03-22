import { z } from 'zod';

const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

// ─── Send OTP ─────────────────────────────────────────────────────────────────
const sendOtpValidationSchema = z.object({
  body: z.object({
    phone: z
      .string({ message: 'Phone number is required' })
      .regex(
        BD_PHONE_REGEX,
        'Please provide a valid phone number (e.g., 01712345678)',
      ),
    purpose: z.enum(['register', 'change-password'], {
      message:
        'Purpose is required, Purpose must be register or change-password',
    }),
  }),
});

// ─── Verify OTP ───────────────────────────────────────────────────────────────
const verifyOtpValidationSchema = z.object({
  body: z.object({
    phone: z
      .string({ message: 'Phone number is required' })
      .regex(
        BD_PHONE_REGEX,
        'Please provide a valid phone number (e.g., 01712345678)',
      ),
    otp: z
      .string({ message: 'OTP is required' })
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^\d{6}$/, 'OTP must contain only digits'),
    purpose: z.enum(['register', 'change-password'], {
      message: 'Purpose is required',
    }),
  }),
});

// ─── Register ─────────────────────────────────────────────────────────────────

const registerValidationSchema = z.object({
  body: z.object({
    name: z
      .string({ message: 'Name is required' })
      .min(1, 'Name is required')
      .max(100, 'Name cannot exceed 100 characters')
      .trim(),
    phone: z
      .string({ message: 'Phone number is required' })
      .regex(
        BD_PHONE_REGEX,
        'Please provide a valid phone number (e.g., 01712345678)',
      ),
    password: z
      .string({ message: 'Password is required' })
      .min(6, 'Password must be at least 6 characters')
      .max(50, 'Password cannot exceed 50 characters'),
    otpToken: z.string({ message: 'OTP verification token is required' }),
  }),
});
// ─── Login ────────────────────────────────────────────────────────────────────
const loginValidationSchema = z.object({
  body: z.object({
    phone: z.string({ message: 'Phone number is required' }).min(1),
    password: z.string({ message: 'Password is required' }).min(1),
  }),
});
// ─── Change Password ──────────────────────────────────────────────────────────
const changePasswordValidationSchema = z.object({
  body: z.object({
    newPassword: z
      .string({ message: 'New password is required' })
      .min(6, 'Password must be at least 6 characters')
      .max(50, 'Password cannot exceed 50 characters'),
    otpToken: z.string({ message: 'OTP verification token is required' }),
  }),
});
// ─── Refresh Token ────────────────────────────────────────────────────────────
// const refreshTokenValidationSchema = z.object({
//   body: z.object({
//     refreshToken: z.string({ message: 'Refresh token is required' }).min(1),
//   }),
// });

export const AuthValidation = {
  sendOtpValidationSchema,
  verifyOtpValidationSchema,
  registerValidationSchema,
  loginValidationSchema,
  changePasswordValidationSchema,
  // refreshTokenValidationSchema,
};
