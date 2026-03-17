import { z } from 'zod';

const phoneSchema = z
  .string()
  .regex(
    /^01[3-9]\d{8}$/,
    'Please provide a valid phone number (e.g., 01712345678)',
  );

export const registerValidationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: phoneSchema,
  password: z.string().min(6).max(50),
});

export const loginValidationSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1),
});

export const refreshTokenValidationSchema = z.object({
  refreshToken: z.string().min(1),
});

export const updateUserValidationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: z.string().min(1).max(200).optional(),
  imgUrl: z.string().url().startsWith('https://').optional(),
});

export const UserValidation = {
  registerValidationSchema,
  loginValidationSchema,
  refreshTokenValidationSchema,
  updateUserValidationSchema,
};
