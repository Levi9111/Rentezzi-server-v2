import bcrypt from 'bcrypt';
import { Schema, model, models } from 'mongoose';
import { TUser, IUserModel } from './user.interface';
import config from '../../config';

const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

const userSchema = new Schema<TUser, IUserModel>(
  {
    name: { type: String },
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
    password: { type: String, required: true, select: false },
    address: { type: String },
    imgUrl: { type: String },
    isDeleted: { type: Boolean, default: false },
    refreshTokens: [
      {
        tokenHash: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        deviceInfo: { type: String },
      },
    ],
  },
  { timestamps: true },
);

// ─── Pre-save: Hash Password ──────────────────────────────────────────────────
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds) || 10,
  );
});

// ─── Static: Find by Phone ────────────────────────────────────────────────────
userSchema.statics.isUserExistsByPhone = async function (phone: string) {
  return this.findOne({ phone, isDeleted: { $ne: true } }).select('+password');
};

// ─── Static: Compare Password ─────────────────────────────────────────────────
userSchema.statics.isPasswordMatched = async function (
  plain: string,
  hashed: string,
) {
  return bcrypt.compare(plain, hashed);
};

export const User = models.User || model<TUser, IUserModel>('User', userSchema);
