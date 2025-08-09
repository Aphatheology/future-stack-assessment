import { StatusCodes } from 'http-status-codes';
import { LoginDto, RefreshTokenDto, RegisterDto } from '../dtos/auth.dto';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { UlidHelper, EntityPrefix } from '../utils/ulid.helper';
import ApiError from '../utils/apiError';
import { SanitizedUser } from '../types/user.type';
import prisma from '../config/prisma';
import config from '../config/env';

export default class AuthService {
  async isEmailTaken(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    return !!user;
  }

  async register(registerDto: RegisterDto): Promise<{ user: SanitizedUser; accessToken: string; refreshToken: string }> {
    const { name, email, password: plainPassword } = registerDto;

    if (await this.isEmailTaken(email)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Email already registered");
    }

    const hashedPassword = await hashPassword(plainPassword);
    const userId = UlidHelper.generate(EntityPrefix.USER);
    const sessionId = UlidHelper.generate(EntityPrefix.USER_SESSION);

    const user = await prisma.user.create({
      data: {
        id: userId,
        name,
        email,
        password: hashedPassword,
      }
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(config.jwt.refreshTokenExpireInDays));

    const refreshToken = generateRefreshToken({ userId: user.id, sessionId });

    await prisma.userSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshToken,
        expiresAt,
      }
    });

    const accessToken = generateAccessToken({ userId: user.id });

    const { password, ...sanitizedUser } = user;
    return { user: sanitizedUser, accessToken, refreshToken };
  }

  async login(loginDto: LoginDto): Promise<{ user: SanitizedUser; accessToken: string; refreshToken: string }> {
    const { email, password } = loginDto;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !(await comparePassword(password, user.password))) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Incorrect email or password');
    }

    const sessionId = UlidHelper.generate(EntityPrefix.USER_SESSION);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(config.jwt.refreshTokenExpireInDays));

    const refreshToken = generateRefreshToken({ userId: user.id, sessionId });

    await prisma.userSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshToken,
        expiresAt,
      }
    });

    const accessToken = generateAccessToken({ userId: user.id });

    const { password: userPassword, ...sanitizedUser } = user;
    return { user: sanitizedUser, accessToken, refreshToken };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{ user: SanitizedUser; accessToken: string; refreshToken: string }> {
    const { refreshToken } = refreshTokenDto;

    try {
      const decoded = verifyRefreshToken(refreshToken);
      
      const session = await prisma.userSession.findFirst({
        where: {
          id: decoded.sessionId,
          userId: decoded.userId,
          refreshToken,
          deleted: false,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: true
        }
      });

      if (!session) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
      }

      const user = session.user;
      const newSessionId = UlidHelper.generate(EntityPrefix.USER_SESSION);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(config.jwt.refreshTokenExpireInDays));

      await prisma.userSession.update({
        where: { id: session.id },
        data: { deleted: true, deletedAt: new Date() }
      });

      await prisma.userSession.create({
        data: {
          id: newSessionId,
          userId: user.id,
          refreshToken: generateRefreshToken({ userId: user.id, sessionId: newSessionId }),
          expiresAt,
        }
      });

      const accessToken = generateAccessToken({
        userId: user.id,
      });

      const newRefreshToken = generateRefreshToken({
        userId: user.id,
        sessionId: newSessionId,
      });

      const { password, ...sanitizedUser } = user;
      return { user: sanitizedUser, accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
    }
  }

  async logout(refreshTokenDto: RefreshTokenDto): Promise<void> {
    const { refreshToken } = refreshTokenDto;

    try {
      const decoded = verifyRefreshToken(refreshToken);

      const session = await prisma.userSession.findFirst({
        where: {
          id: decoded.sessionId,
          userId: decoded.userId,
          refreshToken,
          deleted: false,
        },
      });

      if (!session) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
      }

      await prisma.userSession.update({
        where: { id: session.id },
        data: { deleted: true, deletedAt: new Date() },
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
    }
  }
}
