import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
      userId?: string;
    }
  }

  interface ErrorConstructor {
    captureStackTrace(
      targetObject: object,
      constructorOpt?: (this: void, ...args: any[]) => any,
    ): void;
  }
}
