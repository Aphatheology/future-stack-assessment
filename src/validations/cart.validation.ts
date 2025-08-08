import Joi from 'joi';
import { ulidWithPrefix } from '../utils/customValidation';
import { EntityPrefix } from '../utils/ulid.helper';

export const addItem = {
  body: Joi.object({
    productId: Joi.string().required().custom(ulidWithPrefix(EntityPrefix.PRODUCT)),
    quantity: Joi.number().integer().min(1).required(),
  }),
};

export const updateItem = {
  params: Joi.object({
    productId: Joi.string().required().custom(ulidWithPrefix(EntityPrefix.PRODUCT)),
  }),
  body: Joi.object({
    quantity: Joi.number().integer().min(1).required(),
  }),
};

export const removeItem = {
  params: Joi.object({
    productId: Joi.string().required().custom(ulidWithPrefix(EntityPrefix.PRODUCT)),
  }),
};