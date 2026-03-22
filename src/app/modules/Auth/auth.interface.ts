import { Document, Model } from 'mongoose';

// ─── User ─────────────────────────────────────────────────────────────────────
export type TUser = {
  name: string;
  phone: string;
  password: string;
  refreshTokens: string[];
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
};

export type TLoginBody = {
  phone: string;
  password: string;
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
