import TokenBlacklistService from '../../src/services/tokenBlacklist.service';
import { generateAccessToken } from '../../src/utils/jwt';
import redis from '../../src/config/redis';

jest.mock('../../src/config/redis', () => ({
  setex: jest.fn(),
  exists: jest.fn(),
  del: jest.fn(),
}));

describe('TokenBlacklistService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });



  describe('addToBlacklist', () => {
    it('should add a valid token to blacklist', async () => {
      const mockSetex = redis.setex as jest.MockedFunction<typeof redis.setex>;
      mockSetex.mockResolvedValue('OK');

      const token = generateAccessToken({ userId: 'test-user-id' });
      
      await TokenBlacklistService.addToBlacklist(token);

      expect(mockSetex).toHaveBeenCalledWith(
        expect.stringContaining('blacklisted_token:'),
        expect.any(Number),
        '1'
      );
    });

    it('should handle invalid tokens gracefully', async () => {
      const mockSetex = redis.setex as jest.MockedFunction<typeof redis.setex>;
      
      await TokenBlacklistService.addToBlacklist('invalid-token');

      expect(mockSetex).not.toHaveBeenCalled();
    });
  });

  describe('isBlacklisted', () => {
    it('should return true for blacklisted token', async () => {
      const mockExists = redis.exists as jest.MockedFunction<typeof redis.exists>;
      mockExists.mockResolvedValue(1);

      const result = await TokenBlacklistService.isBlacklisted('test-token');

      expect(result).toBe(true);
      expect(mockExists).toHaveBeenCalledWith(expect.stringContaining('blacklisted_token:'));
    });

    it('should return false for non-blacklisted token', async () => {
      const mockExists = redis.exists as jest.MockedFunction<typeof redis.exists>;
      mockExists.mockResolvedValue(0);

      const result = await TokenBlacklistService.isBlacklisted('test-token');

      expect(result).toBe(false);
    });

    it('should handle Redis errors gracefully', async () => {
      const mockExists = redis.exists as jest.MockedFunction<typeof redis.exists>;
      mockExists.mockRejectedValue(new Error('Redis connection error'));

      const result = await TokenBlacklistService.isBlacklisted('test-token');

      expect(result).toBe(false);
    });
  });

  describe('removeFromBlacklist', () => {
    it('should remove token from blacklist', async () => {
      const mockDel = redis.del as jest.MockedFunction<typeof redis.del>;
      mockDel.mockResolvedValue(1);

      await TokenBlacklistService.removeFromBlacklist('test-token');

      expect(mockDel).toHaveBeenCalledWith(expect.stringContaining('blacklisted_token:'));
    });

    it('should handle Redis errors gracefully', async () => {
      const mockDel = redis.del as jest.MockedFunction<typeof redis.del>;
      mockDel.mockRejectedValue(new Error('Redis connection error'));

      await expect(TokenBlacklistService.removeFromBlacklist('test-token')).resolves.not.toThrow();
    });
  });
});
