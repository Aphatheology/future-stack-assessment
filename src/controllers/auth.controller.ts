import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { StatusCodes } from 'http-status-codes';
import AuthService from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import config from '../config/env';
import { parseTimeToMs } from '../utils/time';
import { SanitizedUser } from "../types/user.type";

const authService = new AuthService();

const getRefreshCookieOptions = () => {
  const isProduction = config.env === 'production';
  const sameSite: 'strict' | 'lax' = isProduction ? 'strict' : 'lax';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    path: '/api/v1/auth/refresh-token',
    maxAge: parseTimeToMs(`${config.jwt.refreshTokenExpireInDays}d`),
  };
};

const getAccessCookieOptions = () => {
  const isProduction = config.env === 'production';
  const sameSite: 'strict' | 'lax' = isProduction ? 'strict' : 'lax';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    path: '/',
    maxAge: parseTimeToMs(`${config.jwt.accessTokenExpireInMinute}m`),
  };
};

export const register = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.register(req.body);
  res.cookie(
    'refreshToken',
    result.refreshToken,
    getRefreshCookieOptions(),
  );
  res.cookie(
    'accessToken',
    result.accessToken,
    getAccessCookieOptions(),
  );
  sendSuccess<SanitizedUser>(res, StatusCodes.CREATED, 'User registered successfully', result.user);
});

export const login = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.login(req.body);
  res.cookie(
    'refreshToken',
    result.refreshToken,
    getRefreshCookieOptions(),
  );
  res.cookie(
    'accessToken',
    result.accessToken,
    getAccessCookieOptions(),
  );
  sendSuccess(res, StatusCodes.OK, 'User logged in successfully', result.user);
});

export const refreshToken = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const refreshTokenFromCookie = (req.cookies as { refreshToken: string })
      ?.refreshToken;

  if (!refreshTokenFromCookie) {
    sendError(res, StatusCodes.UNAUTHORIZED, 'No refresh token found');
    return;
  }

  const result = await authService.refreshToken({ refreshToken: refreshTokenFromCookie });
  res.cookie(
    'accessToken',
    result.accessToken,
    getAccessCookieOptions(),
  );
  res.cookie(
    'refreshToken',
    result.refreshToken,
    getRefreshCookieOptions(),
  );
  sendSuccess(res, StatusCodes.OK, 'Token refreshed successfully');
});

export const logout = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const refreshTokenFromCookie = (req.cookies as { refreshToken: string })?.refreshToken;

  if (!refreshTokenFromCookie) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      status: 'error',
      message: 'No refresh token provided',
    });
    return;
  }

  await authService.logout({ refreshToken: refreshTokenFromCookie });

  // Clear cookies
  res.cookie('accessToken', '', { ...getAccessCookieOptions(), maxAge: 0 });
  res.cookie('refreshToken', '', { ...getRefreshCookieOptions(), maxAge: 0 });

  sendSuccess(res, StatusCodes.OK, 'User logged out successfully');
});
