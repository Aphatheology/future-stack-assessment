import request from 'supertest';
import { Express } from 'express';
import app from '../../src/app';
import AuthService from '../../src/services/auth.service';

describe('Logout Integration Tests', () => {
  let testApp: Express;
  let authService: AuthService;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    testApp = app;
  });

  beforeEach(async () => {
    authService = new AuthService();

    const registerData = {
      name: 'Test User',
      email: 'logout_test@example.com',
      password: 'P@ssw0rd123',
    };

    const result = await authService.register(registerData);
    accessToken = result.accessToken;
    refreshToken = result.refreshToken;
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout user and invalidate access token', async () => {
      const response = await request(testApp)
        .post('/api/v1/auth/logout')
        .set('Cookie', [
          `accessToken=${accessToken}`,
          `refreshToken=${refreshToken}`,
        ])
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('User logged out successfully');

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();

      const accessTokenCookie = cookies.find(cookie =>
        cookie.includes('accessToken')
      );
      const refreshTokenCookie = cookies.find(cookie =>
        cookie.includes('refreshToken')
      );

      expect(accessTokenCookie).toContain('Max-Age=0');
      expect(refreshTokenCookie).toContain('Max-Age=0');
    });

    it('should reject requests with blacklisted access token', async () => {
      await request(testApp)
        .post('/api/v1/auth/logout')
        .set('Cookie', [
          `accessToken=${accessToken}`,
          `refreshToken=${refreshToken}`,
        ])
        .expect(200);

      const response = await request(testApp)
        .get('/api/v1/carts')
        .set('Cookie', [`accessToken=${accessToken}`])
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Token has been invalidated');
    });

    it('should reject requests with manually added blacklisted token in header', async () => {
      await request(testApp)
        .post('/api/v1/auth/logout')
        .set('Cookie', [
          `accessToken=${accessToken}`,
          `refreshToken=${refreshToken}`,
        ])
        .expect(200);

      const response = await request(testApp)
        .get('/api/v1/carts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('No token provided');
    });

    it('should allow access with new token after logout', async () => {
      await request(testApp)
        .post('/api/v1/auth/logout')
        .set('Cookie', [
          `accessToken=${accessToken}`,
          `refreshToken=${refreshToken}`,
        ])
        .expect(200);

      const loginData = {
        email: 'logout_test@example.com',
        password: 'P@ssw0rd123',
      };

      const loginResponse = await request(testApp)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      const cookies = loginResponse.headers[
        'set-cookie'
      ] as unknown as string[];
      const accessTokenCookie = cookies.find(cookie =>
        cookie.startsWith('accessToken=')
      );

      const response = await request(testApp)
        .get('/api/v1/carts')
        .set('Cookie', [accessTokenCookie as string]);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should handle logout without refresh token gracefully', async () => {
      const response = await request(testApp)
        .post('/api/v1/auth/logout')
        .set('Cookie', [`accessToken=${accessToken}`])
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('No refresh token found');
    });

    it('should handle logout with invalid refresh token', async () => {
      const response = await request(testApp)
        .post('/api/v1/auth/logout')
        .set('Cookie', [
          `accessToken=${accessToken}`,
          'refreshToken=invalid-refresh-token',
        ])
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid refresh token');
    });
  });
});
