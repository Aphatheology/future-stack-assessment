import request from 'supertest';
import { Express } from 'express';
import { UlidHelper, EntityPrefix } from '../../src/utils/ulid.helper';
import { prisma } from '../setup';
import { hashPassword } from '../../src/utils/password';
import AuthService from '../../src/services/auth.service';
import app from '../../src/app';
import { User } from '@prisma/client';

describe('Auth API Integration Tests', () => {
  let testApp: Express;
  let testUser: User;

  beforeAll(async () => {
    testApp = app;
  });

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a new user', async () => {
      const registerData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'P@ssw0rd123',
      };

      const response = await request(testApp)
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body).toMatchObject({
        status: 'success',
        message: 'User registered successfully',
        data: {
          id: expect.stringMatching(/^usr_/),
          email: registerData.email,
          name: registerData.name,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });

      // Should not include password
      expect(response.body.data).not.toHaveProperty('password');

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes('accessToken'))).toBe(true);
      expect(cookies.some((cookie: string) => cookie.includes('refreshToken'))).toBe(true);

      const createdUser = await prisma.user.findUnique({
        where: { email: registerData.email },
      });
      expect(createdUser).toBeTruthy();
    });

    it('should return 400 for duplicate email', async () => {
      const registerData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'P@ssw0rd123',
      };

      // Register first user
      await request(testApp).post('/api/v1/auth/register').send(registerData).expect(201);

      // Try to register with same email
      const response = await request(testApp)
        .post('/api/v1/auth/register')
        .send({
          ...registerData,
          name: 'Another User',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        status: 'error',
        message: 'Email already registered',
      });
    });

    it('should return 400 for invalid email format', async () => {
      const registerData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'P@ssw0rd123',
      };

      const response = await request(testApp)
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Validation');
    });

    it('should return 400 for weak password', async () => {
      const registerData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass123', // Too weak
      };

      const response = await request(testApp)
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.status).toBe('error');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(testApp)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          // Missing email and password
        })
        .expect(400);

      expect(response.body.status).toBe('error');
    });

    it('should sanitize user input', async () => {
      const registerData = {
        name: 'Test <script>alert("xss")</script> User',
        email: 'test@example.com',
        password: 'P@ssw0rd123',
      };

      const response = await request(testApp)
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(201);

      // Name should be sanitized
      expect(response.body.data.name).not.toContain('<script>');
      expect(response.body.data.name).toBe('Test scriptalert("xss")/script User');
    });

    it('should respect rate limiting', async () => {
      const registerData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'P@ssw0rd123',
      };

      // Make multiple rapid requests
      const promises = Array(12)
        .fill(0)
        .map((_, i) =>
          request(testApp)
            .post('/api/v1/auth/register')
            .send({
              ...registerData,
              email: `test${i}@example.com`,
            })
        );

      const responses = await Promise.all(promises);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/v1/auth/login', () => {
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
      const loginData = {
        email: testUser.email,
        password: 'P@ssw0rd123',
      };

      const response = await request(testApp)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        message: 'User logged in successfully',
        data: {
          id: testUser.id,
          email: loginData.email,
          name: testUser.name,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });

      // Should set cookies
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes('accessToken'))).toBe(true);
      expect(cookies.some((cookie: string) => cookie.includes('refreshToken'))).toBe(true);
    });

    it('should return 401 for non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'P@ssw0rd123',
      };

      const response = await request(testApp)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        status: 'error',
        message: 'Incorrect email or password',
      });
    });

    it('should return 401 for incorrect password', async () => {
      const loginData = {
        email: testUser.email,
        password: 'WrongPassword123!',
      };

      const response = await request(testApp)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        status: 'error',
        message: 'Incorrect email or password',
      });
    });

    it('should return 400 for invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'P@ssw0rd123',
      };

      const response = await request(testApp)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.status).toBe('error');
    });

    it('should respect rate limiting', async () => {
      const loginData = {
        email: testUser.email,
        password: 'WrongPassword123',
      };

      // Make multiple failed login attempts
      const promises = Array(12)
        .fill(0)
        .map(() => request(testApp).post('/api/v1/auth/login').send(loginData));

      const responses = await Promise.all(promises);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const authService = new AuthService();
      const registerData = {
        name: 'Test User',
        email: 'refresh_test@example.com',
        password: 'P@ssw0rd123',
      };
      const result = await authService.register(registerData);
      refreshToken = result.refreshToken;
    });

    it('should successfully refresh token with valid refresh token', async () => {
      const response = await request(testApp)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        message: 'Token refreshed successfully',
      });

      // Should set new cookies
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes('accessToken'))).toBe(true);
      expect(cookies.some((cookie: string) => cookie.includes('refreshToken'))).toBe(true);
    });

    it('should return 401 for missing refresh token', async () => {
      const response = await request(testApp).post('/api/v1/auth/refresh-token').expect(401);

      expect(response.body.status).toBe('error');
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(testApp)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', ['refreshToken=invalid-token'])
        .expect(401);

      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const authService = new AuthService();
      const registerData = {
        name: 'Test User',
        email: 'logout_test@example.com',
        password: 'P@ssw0rd123',
      };
      const result = await authService.register(registerData);
      refreshToken = result.refreshToken;
    });

    it('should successfully logout with valid refresh token', async () => {
      const response = await request(testApp)
        .post('/api/v1/auth/logout')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        message: 'User logged out successfully',
      });

      // Should clear cookies
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes('accessToken=;'))).toBe(true);
      expect(cookies.some((cookie: string) => cookie.includes('refreshToken=;'))).toBe(true);

      // Refresh token should no longer work
      await request(testApp)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(401);
    });

    it('should return 401 for missing refresh token', async () => {
      const response = await request(testApp).post('/api/v1/auth/logout').expect(401);

      expect(response.body.status).toBe('error');
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(testApp)
        .post('/api/v1/auth/logout')
        .set('Cookie', ['refreshToken=invalid-token'])
        .expect(401);

      expect(response.body.status).toBe('error');
    });
  });

  describe('Authentication middleware integration', () => {
    let accessToken: string;

    beforeEach(async () => {
      const authService = new AuthService();
      const registerData = {
        name: 'Test User',
        email: 'auth_test@example.com',
        password: 'P@ssw0rd123',
      };
      const result = await authService.register(registerData);
      accessToken = result.accessToken;
    });

    it('should access protected route with valid token', async () => {
      const response = await request(testApp)
        .get('/api/v1/carts')
        .set('Cookie', [`accessToken=${accessToken}`])
        .expect(200);

      expect(response.body.status).toBe('success');
    });

    it('should reject protected route without token', async () => {
      const response = await request(testApp).get('/api/v1/carts').expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('token');
    });

    it('should reject protected route with invalid token', async () => {
      const response = await request(testApp)
        .get('/api/v1/carts')
        .set('Cookie', ['accessToken=invalid-token'])
        .expect(401);

      expect(response.body.status).toBe('error');
    });
  });
});
