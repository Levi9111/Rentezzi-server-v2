import { Document, Model } from 'mongoose';

export type TUser = {
  name?: string;
  phone: string;
  password: string;
  address?: string;
  imgUrl?: string;
  isDeleted?: boolean;
  refreshTokens: Array<{
    tokenHash: string;
    expiresAt: Date;
    deviceInfo?: string;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface IUserModel extends Model<TUser & Document> {
  isUserExistsByPhone(phone: string): Promise<(TUser & Document) | null>;
  isPasswordMatched(plain: string, hashed: string): Promise<boolean>;
}
