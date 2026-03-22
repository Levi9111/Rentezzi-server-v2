import { z } from 'zod';

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
        /^01[3-9]\d{8}$/,
        'Please provide a valid phone number (e.g., 01712345678)',
      ),
    password: z
      .string({ message: 'Password is required' })
      .min(6, 'Password must be at least 6 characters')
      .max(50, 'Password cannot exceed 50 characters'),
  }),
});

// ─── Login ────────────────────────────────────────────────────────────────────
const loginValidationSchema = z.object({
  body: z.object({
    phone: z.string({ message: 'Phone number is required' }).min(1),
    password: z.string({ message: 'Password is required' }).min(1),
  }),
});

// ─── Refresh Token ────────────────────────────────────────────────────────────
// const refreshTokenValidationSchema = z.object({
//   body: z.object({
//     refreshToken: z.string({ message: 'Refresh token is required' }).min(1),
//   }),
// });

export const AuthValidation = {
  registerValidationSchema,
  loginValidationSchema,
  // refreshTokenValidationSchema,
};
