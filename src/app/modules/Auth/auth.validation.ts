import { z } from 'zod';

export const registerValidationSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z
    .string()
    .regex(
      /^01[3-9]\d{8}$/,
      'Please provide a valid phone number (e.g., 01712345678)',
    ),
  password: z.string().min(6).max(50),
});

export const loginValidationSchema = z.object({
  phone: z.string().min(1),
  password: z.string().min(1),
});

export const refreshTokenValidationSchema = z.object({
  refreshToken: z.string().min(1),
});

export const AuthValidation = {
  registerValidationSchema,
  loginValidationSchema,
  refreshTokenValidationSchema,
};
