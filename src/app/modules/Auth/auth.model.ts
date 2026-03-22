import { Schema, model, models } from 'mongoose';
import { User } from '../User/user.model';

export { User };

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

export const Otp = models.Otp || model<TOtp>('Otp', otpSchema);
