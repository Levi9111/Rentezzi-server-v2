import bcrypt from 'bcrypt';

import { Schema, model } from 'mongoose';
import { TUser } from './auth.interface';
import config from '../../config';

const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

const userSchema = new Schema<TUser>(
  {
    name: { type: String, required: true },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [
        BD_PHONE_REGEX,
        'Please provide a valid Bangladeshi phone number (e.g., 01712345678)',
      ],
    },
    password: { type: String, required: true, select: false },
    refreshTokens: [{ type: String }],
  },
  { timestamps: true },
);

export const User = model<TUser>('User', userSchema);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds),
  );
});
