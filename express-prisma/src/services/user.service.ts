import { StatusCodes } from 'http-status-codes';
import ApiError from '../utils/apiError';
import { SanitizedUser } from '../types/user.type';
import prisma from '../config/prisma';

export default class UserService {
  async getUserProfile(userId: string): Promise<SanitizedUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }

    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}