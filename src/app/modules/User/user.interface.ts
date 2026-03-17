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
};
