import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/apiError';
import { StatusCodes } from 'http-status-codes';
import { verifyAccessToken } from '../utils/jwt';
import TokenBlacklistService from '../services/tokenBlacklist.service';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessTokenFromCookie = (req.cookies as { accessToken: string })?.accessToken;

    if (!accessTokenFromCookie) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'No token provided. Please authenticate');
    }

    const isBlacklisted = await TokenBlacklistService.isBlacklisted(accessTokenFromCookie);
    if (isBlacklisted) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Token has been invalidated. Please login again'
      );
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
