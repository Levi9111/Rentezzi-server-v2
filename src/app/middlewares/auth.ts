import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import AppError from '../errors/AppError';
import { NextFunction, Request, Response } from 'express';
import config from '../config';
import { verifyToken } from '../modules/Auth/auth.utils';

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer '))
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized access!');

  const token = authHeader.split(' ')[1];

  const decoded = verifyToken(token, config.jwt_access_secret as string);

  if (!decoded.sub) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid token payload');
  }

  req.userId = decoded.sub;

  next();
};
