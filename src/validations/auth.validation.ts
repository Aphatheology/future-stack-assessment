import Joi from 'joi';
import { noSqlInjection, password, sanitizeString } from '../utils/customValidation';

export const register = {
  body: Joi.object({
      email: Joi.string().required().email(),
      password: Joi.string().required().custom(password),
      name: Joi.string().required().custom(sanitizeString).custom(noSqlInjection),
    }),
};

export const login = {
  body: Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
  }),
};
