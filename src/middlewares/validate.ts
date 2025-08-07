import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import pick from '../utils/pick';
import ApiError from '../utils/apiError';
import { StatusCodes } from 'http-status-codes';

const validate =
  (schema: Record<string, any>) =>
    (req: Request, _res: Response, next: NextFunction): void => {
      const validSchema = pick(schema, ['params', 'query', 'body']);
      const object = pick(req, Object.keys(validSchema));
      const { value, error } = Joi.compile(validSchema)
        .prefs({ errors: { label: 'key' }, abortEarly: false })
        .validate(object);

      if (error) {
        const fieldErrors: Record<string, string> = {};
        const messages = error.details.map((detail) => detail.message);

        fieldErrors.general = messages.join(', ');

        error.details.forEach((detail) => {
          const key = detail.path.join('.');
          fieldErrors[key] = detail.message;
        });

        return next(
          new ApiError(StatusCodes.BAD_REQUEST, 'Validation failed', true, undefined, fieldErrors)
        );
      }

      Object.assign(req, value);
      return next();
    };

export default validate;

