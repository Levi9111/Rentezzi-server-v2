import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../../config';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';

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
