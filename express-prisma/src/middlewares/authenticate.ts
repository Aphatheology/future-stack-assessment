import { Request, Response, NextFunction } from 'express';
import ApiError from "../utils/apiError";
import { StatusCodes } from "http-status-codes";
import { verifyAccessToken } from '../utils/jwt';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessTokenFromCookie = (req.cookies as { accessToken: string })
      ?.accessToken;

    if (!accessTokenFromCookie) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Please authenticate");
    }

    const decoded = verifyAccessToken(accessTokenFromCookie);

    (req as any).user = decoded;

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid token! Please authenticate'));
    }
    next(error);
  }
};
