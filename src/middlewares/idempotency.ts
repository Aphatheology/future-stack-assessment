import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import ApiError from '../utils/apiError';
import { StatusCodes } from 'http-status-codes';

const idempotencyKeySchema = Joi.string()
  .required()
  .min(1)
  .max(255)
  .pattern(/^[a-zA-Z0-9_-]+$/)
  .messages({
    'string.empty': 'Idempotency key cannot be empty',
    'string.max': 'Idempotency key cannot exceed 255 characters',
    'string.pattern.base': 'Idempotency key can only contain alphanumeric characters, hyphens, and underscores'
  });

export const validateIdempotencyKey = (req: Request, res: Response, next: NextFunction): void => {
  const idempotencyKey = req.headers['x-idempotency-key'] as string;

  if (!idempotencyKey) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'X-Idempotency-Key header is required');
  }

  const { error } = idempotencyKeySchema.validate(idempotencyKey);
  if (error) {
    throw new ApiError(StatusCodes.BAD_REQUEST, error.details[0].message);
  }

  (req as any).idempotencyKey = idempotencyKey;
  next();
};
