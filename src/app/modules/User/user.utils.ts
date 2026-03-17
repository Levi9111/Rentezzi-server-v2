import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../../config';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import bcrypt from 'bcrypt';

const MAX_REFRESH_TOKENS = 5;

// ✅ Hash refresh token before storing
export const hashRefreshToken = async (token: string): Promise<string> => {
  return bcrypt.hash(token, 10);
};

// ✅ Compare incoming token with stored hash
export const verifyRefreshTokenHash = async (
  token: string,
  tokenHash: string,
): Promise<boolean> => {
  return bcrypt.compare(token, tokenHash);
};

// ✅ Clean up expired tokens and enforce max token limit
export const cleanupRefreshTokens = (
  refreshTokens: Array<{
    tokenHash: string;
    expiresAt: Date;
    deviceInfo?: string;
  }>,
): Array<{ tokenHash: string; expiresAt: Date; deviceInfo?: string }> => {
  const now = new Date();
  // Remove expired tokens
  let validTokens = refreshTokens.filter((entry) => entry.expiresAt > now);
  // Keep only the most recent MAX_REFRESH_TOKENS
  if (validTokens.length > MAX_REFRESH_TOKENS) {
    validTokens = validTokens.slice(-MAX_REFRESH_TOKENS);
  }
  return validTokens;
};

export const verifyToken = (token: string, secret: string): { sub: string } => {
  try {
    const decoded = jwt.verify(token, secret);
    if (
      typeof decoded === 'object' &&
      decoded !== null &&
      typeof decoded.sub === 'string'
    ) {
      return { sub: decoded.sub };
    }
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid token payload');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized access!');
  }
};

export const generateTokens = (userId: string) => {
  if (!config.jwt_access_secret || !config.jwt_refresh_secret) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'JWT secrets are not configured',
    );
  }

  const accessToken = jwt.sign(
    { sub: userId },
    config.jwt_access_secret as string,
    {
      expiresIn:
        (config.jwt_access_expires_in as jwt.SignOptions['expiresIn']) ?? '15m',
    },
  );

  const refreshToken = jwt.sign(
    { sub: userId },
    config.jwt_refresh_secret as string,
    {
      expiresIn:
        (config.jwt_refresh_expires_in as jwt.SignOptions['expiresIn']) ?? '7d',
    },
  );

  return { accessToken, refreshToken };
};
