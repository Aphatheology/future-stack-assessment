import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';
import config from '../config/env';
import { StatusCodes } from 'http-status-codes';

const keyGenerator = (req: Request & { user?: { id: string } }) => {
  let baseKey: string;

  if (req.user?.id) {
    baseKey = `user:${req.user.id}`;
  } else if (req.ip) {
    baseKey = ipKeyGenerator(req.ip);
  } else {
    baseKey = 'unknown';
  }

  return `${req.baseUrl}${req.path}:${baseKey}`;
};

// not sure if this is needed or enough
export const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req: Request & { user?: { id: string } }) => {
    return req.user ? 2000 : 100;
  },
  keyGenerator,
  message: {
    status: 'error',
    message: 'Rate limit exceeded. Please try again later.',
    hint: 'Consider signing in for higher rate limits.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  skip: () => config.env === 'test',
});

export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  keyGenerator,
  message: {
    status: 'error',
    message: 'Too many authentication attempts. Please try again later.',
    retryAfter: '5 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
  skipSuccessfulRequests: true,
});
