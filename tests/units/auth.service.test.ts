import AuthService from '../../src/services/auth.service';
import { prisma } from '../setup';
import { UlidHelper, EntityPrefix } from '../../src/utils/ulid.helper';
import { hashPassword } from '../../src/utils/password';
import jwt from 'jsonwebtoken';
import config from '../../src/config/env';

describe('AuthService', () => {
  let authService: AuthService;
  let testUser: any;

  beforeEach(async () => {
    authService = new AuthService();
  });

  afterEach(async () => {
    await prisma.userSession.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('isEmailTaken', () => {
    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          id: UlidHelper.generate(EntityPrefix.USER),
          email: 'existing@example.com',
          name: 'Existing User',
          password: await hashPassword('P@ssw0rd123'),
        },
      });
    });

    it('should return true for existing email', async () => {
      const result = await authService.isEmailTaken('existing@example.com');
      expect(result).toBe(true);
    });

    it('should return false for non-existing email', async () => {
      const result = await authService.isEmailTaken('nonexisting@example.com');
      expect(result).toBe(false);
    });

    it('should be case insensitive', async () => {
      const result = await authService.isEmailTaken('EXISTING@EXAMPLE.COM');
      expect(result).toBe(true);
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto = {
        name: 'Test User',
        email: `reg_${Date.now()}_${Math.random()}@example.com`,
        password: 'P@ssw0rd123',
      };

      const result = await authService.register(registerDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(registerDto.email);
      expect(result.user.name).toBe(registerDto.name);
      expect(result.user).not.toHaveProperty('password');

      const createdUser = await prisma.user.findUnique({
        where: { email: registerDto.email },
      });
      expect(createdUser).toBeTruthy();
      expect(createdUser?.password).not.toBe(registerDto.password); // Should be hashed

      const session = await prisma.userSession.findFirst({
        where: { userId: createdUser?.id },
      });
      expect(session).toBeTruthy();
    });

    it('should throw error if email already exists', async () => {
      const registerDto = {
        name: 'Test User',
        email: `dup_${Date.now()}_${Math.random()}@example.com`,
        password: 'P@ssw0rd123',
      };

      await authService.register(registerDto);

      await expect(authService.register({
        ...registerDto,
        name: 'Another User',
      })).rejects.toThrow('Email already registered');
    });

    it('should generate valid JWT tokens', async () => {
      const registerDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'P@ssw0rd123',
      };

      const result = await authService.register(registerDto);

      // Verify access token is valid
      const accessPayload = jwt.verify(result.accessToken, config.jwt.accessTokenSecret) as any;
      expect(accessPayload.userId).toBe(result.user.id);

      // Verify refresh token is valid
      const refreshPayload = jwt.verify(result.refreshToken, config.jwt.refreshTokenSecret) as any;
      expect(refreshPayload.userId).toBe(result.user.id);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      const loginEmail = `login_${Date.now()}_${Math.random()}@example.com`;
      testUser = await prisma.user.create({
        data: {
          id: UlidHelper.generate(EntityPrefix.USER),
          email: loginEmail,
          name: 'Test User',
          password: await hashPassword('P@ssw0rd123'),
        },
      });
    });

    it('should successfully login with correct credentials', async () => {
      const loginDto = {
        email: testUser.email,
        password: 'P@ssw0rd123',
      };

      const result = await authService.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(loginDto.email);
      expect(result.user).not.toHaveProperty('password');

      // Verify session was created
      const session = await prisma.userSession.findFirst({
        where: { userId: testUser.id },
      });
      expect(session).toBeTruthy();
    });

    it('should throw error for non-existent email', async () => {
      const loginDto = {
        email: 'non-existent@example.com',
        password: 'password123',
      };

      await expect(authService.login(loginDto)).rejects.toThrow('Incorrect email or password');
    });

    it('should throw error for incorrect password', async () => {
      const loginDto = {
        email: testUser.email,
        password: 'wrongpassword',
      };

      await expect(authService.login(loginDto)).rejects.toThrow('Incorrect email or password');
    });

    it('should create new session on each login', async () => {
      const loginDto = {
        email: testUser.email,
        password: 'P@ssw0rd123',
      };

      // First login
      await authService.login(loginDto);
      const firstSessionCount = await prisma.userSession.count({
        where: { userId: testUser.id },
      });

      // Second login
      await authService.login(loginDto);
      const secondSessionCount = await prisma.userSession.count({
        where: { userId: testUser.id },
      });

      expect(secondSessionCount).toBe(firstSessionCount + 1);
    });
  });

  describe('refreshToken', () => {
    let refreshToken: string;
    let sessionId: string;

    beforeEach(async () => {
      const refreshEmail = `refresh_${Date.now()}_${Math.random()}@example.com`;
      testUser = await prisma.user.create({
        data: {
          id: UlidHelper.generate(EntityPrefix.USER),
          email: refreshEmail,
          name: 'Test User',
          password: await hashPassword('P@ssw0rd123'),
        },
      });

      // Create a session with refresh token
      sessionId = UlidHelper.generate(EntityPrefix.USER_SESSION);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const testRefreshToken = jwt.sign(
        { userId: testUser.id, sessionId },
        config.jwt.refreshTokenSecret,
        { expiresIn: '7d' }
      );

      const session = await prisma.userSession.create({
        data: {
          id: sessionId,
          userId: testUser.id,
          refreshToken: testRefreshToken,
          expiresAt,
        },
      });

      refreshToken = session.refreshToken;
    });

    it('should successfully refresh token with valid refresh token', async () => {
      const refreshDto = { refreshToken };

      const result = await authService.refreshToken(refreshDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.id).toBe(testUser.id);

      // New refresh token should be different
      expect(result.refreshToken).not.toBe(refreshToken);
    });

    it('should throw error for invalid refresh token', async () => {
      const refreshDto = { refreshToken: 'invalid-token' };

      await expect(authService.refreshToken(refreshDto)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error for expired session', async () => {
      // Manually expire the session
      await prisma.userSession.update({
        where: { id: sessionId },
        data: { expiresAt: new Date(Date.now() - 1000) }, // 1 second ago
      });

      const refreshDto = { refreshToken };

      await expect(authService.refreshToken(refreshDto)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error for non-existent session', async () => {
      // Delete the session
      await prisma.userSession.delete({ where: { id: sessionId } });

      const refreshDto = { refreshToken };

      await expect(authService.refreshToken(refreshDto)).rejects.toThrow('Invalid refresh token');
    });

    it('should invalidate old refresh token and create new one', async () => {
      const refreshDto = { refreshToken };

      const result = await authService.refreshToken(refreshDto);

      // Old refresh token should no longer work
      await expect(authService.refreshToken({ refreshToken })).rejects.toThrow();

      // New refresh token should work
      const secondResult = await authService.refreshToken({ refreshToken: result.refreshToken });
      expect(secondResult).toHaveProperty('accessToken');
    });
  });

  describe('logout', () => {
    let refreshToken: string;
    let sessionId: string;

    beforeEach(async () => {
      const email = `logout_${Date.now()}_${Math.random()}@example.com`;
      testUser = await prisma.user.create({
        data: {
          id: UlidHelper.generate(EntityPrefix.USER),
          email,
          name: 'Test User',
          password: await hashPassword('P@ssw0rd123'),
        },
      });

      sessionId = UlidHelper.generate(EntityPrefix.USER_SESSION);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      refreshToken = jwt.sign(
        { userId: testUser.id, sessionId },
        config.jwt.refreshTokenSecret,
        { expiresIn: '7d' },
      );

      await prisma.userSession.create({
        data: {
          id: sessionId,
          userId: testUser.id,
          refreshToken,
          expiresAt,
        },
      });
    });

    it('should successfully logout with valid refresh token', async () => {
      const logoutDto = { refreshToken };

      await expect(authService.logout(logoutDto)).resolves.not.toThrow();

      const session = await prisma.userSession.findUnique({ where: { id: sessionId } });
      expect(session?.deleted).toBe(true);
    });

    it('should throw error for invalid refresh token', async () => {
      await expect(authService.logout({ refreshToken: 'invalid-token' })).rejects.toThrow('Invalid refresh token');
    });
  });


});