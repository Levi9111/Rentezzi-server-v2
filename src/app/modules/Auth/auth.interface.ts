import { Document, Model } from 'mongoose';

// ─── User ─────────────────────────────────────────────────────────────────────
export type TUser = {
  name: string;
  phone: string;
  password: string;
  refreshTokens: Array<{
    tokenHash: string;
    expiresAt: Date;
    deviceInfo?: string;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
};

// ─── Statics ──────────────────────────────────────────────────────────────────
export interface IUserModel extends Model<TUser & Document> {
  isUserExistsByPhone(phone: string): Promise<(TUser & Document) | null>;
  isPasswordMatched(plain: string, hashed: string): Promise<boolean>;
}

// ─── Request Bodies ───────────────────────────────────────────────────────────
export type TRegisterBody = {
  name: string;
  phone: string;
  password: string;
  otpToken: string; // short-lived JWT returned by /verify-otp
};

export type TLoginBody = {
  phone: string;
  password: string;
};

export type TSendOtpBody = {
  phone: string;
};

export type TVerifyOtpBody = {
  phone: string;
  otp: string;
};

export type TChangePasswordBody = {
  newPassword: string;
  otpToken: string; // short-lived JWT returned by /verify-otp
};

// ─── Return Types ─────────────────────────────────────────────────────────────
export type TAuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type TLoginResult = {
  user: Partial<TUser & Document>;
  tokens: TAuthTokens;
};

// ─── OTP Token Payload (short-lived JWT after OTP verified) ───────────────────
export type TOtpTokenPayload = {
  phone: string;
  purpose: 'register' | 'change-password';
};
