import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { StatusCodes } from 'http-status-codes';
import UserService from '../services/user.service';
import { sendSuccess } from '../utils/apiResponse';
import { SanitizedUser } from '../types/user.type';

const userService = new UserService();

export const getProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as any).user;
  const user = await userService.getUserProfile(userId);
  sendSuccess<SanitizedUser>(res, StatusCodes.OK, 'User profile retrieved successfully', user);
});
