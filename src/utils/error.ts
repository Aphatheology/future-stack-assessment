import { Request, Response, NextFunction } from 'express';
import config from '../config/env';
import logger from '../config/logger';
import { StatusCodes } from 'http-status-codes';
import { sendError } from './apiResponse';
import ApiError from './apiError';

export const errorConverter = (err: any, _req: Request, _res: Response, next: NextFunction) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    let message = error.message || `${StatusCodes[statusCode]}`;

    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

export const errorHandler = (err: ApiError, req: Request, res: Response, _next: NextFunction) => {
  let { statusCode, message } = err;

  const errorContext = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: (req as any).user?.userId || 'anonymous',
    statusCode,
    message: err.message,
    stack: err.stack,
    isOperational: err.isOperational,
  };

  if (statusCode >= 500) {
    logger.error('Server Error:', errorContext);
  } else if (statusCode >= 400) {
    logger.warn('Client Error:', errorContext);
  }

  if (config.env === 'production' && !err.isOperational) {
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    message = 'Internal Server Error';
  }

  res.locals['errorMessage'] = err.message;

  const errorPayload = {
    ...(err.errors || {}),
    ...(config.env === 'development'
      ? {
          stack: err.stack,
          timestamp: errorContext.timestamp,
        }
      : {}),
  };

  sendError(res, statusCode, message, errorPayload);
};
