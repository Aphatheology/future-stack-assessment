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

export const errorHandler = (err: ApiError, _req: Request, res: Response, _next: NextFunction) => {
  let { statusCode, message } = err;

  if (config.env === 'production' && !err.isOperational) {
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    message = 'Internal Server Error';
  }

  res.locals['errorMessage'] = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development') {
    logger.error(err);
  }

  const errorPayload = {
    ...(err.errors || {}),
    ...(config.env === 'development' ? { stack: err.stack } : {})
  };

  sendError(res, statusCode, message, errorPayload);
};