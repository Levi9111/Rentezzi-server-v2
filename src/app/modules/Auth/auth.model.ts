import bcrypt from 'bcrypt';
import { Schema, model } from 'mongoose';
import { TUser, IUserModel } from './auth.interface';
import config from '../../config';

const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

// ─── Schema ───────────────────────────────────────────────────────────────────
const userSchema = new Schema<TUser, IUserModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [
        BD_PHONE_REGEX,
        'Please provide a valid phone number (e.g., 01712345678)',
      ],
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    refreshTokens: [{ type: String }],
  },
  { timestamps: true },
);

// ─── Pre-save: Hash Password ──────────────────────────────────────────────────
// NOTE: must be defined BEFORE model() call
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds!),
  );
});

// ─── Static: Find by Phone ────────────────────────────────────────────────────
userSchema.statics.isUserExistsByPhone = async function (phone: string) {
  return this.findOne({ phone }).select('+password');
};

// ─── Static: Compare Password ─────────────────────────────────────────────────
userSchema.statics.isPasswordMatched = async function (
  plain: string,
  hashed: string,
) {
  return bcrypt.compare(plain, hashed);
};

// ─── Model ────────────────────────────────────────────────────────────────────

export const User = model<TUser, IUserModel>('User', userSchema);

export type TOtp = {
  phone: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  isUsed: boolean;
  createdAt?: Date;
};

const otpSchema = new Schema<TOtp>(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// ─── TTL Index: MongoDB auto-deletes expired OTP docs ─────────────────────────
// Runs every 60s — expired docs clean themselves up without any cron job
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = model<TOtp>('Otp', otpSchema);
