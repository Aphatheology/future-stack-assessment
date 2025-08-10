import redis from '../config/redis';
import { verifyAccessToken } from '../utils/jwt';

export default class TokenBlacklistService {
  private static readonly BLACKLIST_PREFIX = 'blacklisted_token:';
  private static readonly TOKEN_EXPIRY_BUFFER = 60; // 1 minute buffer

  static async addToBlacklist(token: string): Promise<void> {
    try {
      const decoded = verifyAccessToken(token);
      const tokenExpiry = (decoded.exp || 0) * 1000;
      const currentTime = Date.now();

      // Calculate TTL (time to live) for the blacklisted token
      const ttl =
        Math.max(0, Math.floor((tokenExpiry - currentTime) / 1000)) + this.TOKEN_EXPIRY_BUFFER;

      if (ttl > 0) {
        const key = `${this.BLACKLIST_PREFIX}${token}`;
        await redis.setex(key, ttl, '1');
      }
    } catch (error) {
      console.warn('Attempted to blacklist invalid token:', error);
    }
  }

  static async isBlacklisted(token: string): Promise<boolean> {
    try {
      const key = `${this.BLACKLIST_PREFIX}${token}`;
      const exists = await redis.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Error checking token blacklist:', error);
      // If Redis is down, all token remains valid till it expires, possible improvement?
      return false;
    }
  }

  static async removeFromBlacklist(token: string): Promise<void> {
    try {
      const key = `${this.BLACKLIST_PREFIX}${token}`;
      await redis.del(key);
    } catch (error) {
      console.error('Error removing token from blacklist:', error);
    }
  }
}
