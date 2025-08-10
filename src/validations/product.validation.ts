import Joi from 'joi';
import { ulidWithPrefix, sanitizeString, noSqlInjection } from '../utils/customValidation';
import { EntityPrefix } from '../utils/ulid.helper';

export const createProduct = {
  body: Joi.object({
    name: Joi.string().required().max(255).custom(sanitizeString).custom(noSqlInjection),
    description: Joi.string().required().custom(sanitizeString).custom(noSqlInjection),
    price: Joi.number().positive().required(),
    stockLevel: Joi.number().integer().min(0).required(),
    categoryId: Joi.string().required().custom(ulidWithPrefix(EntityPrefix.CATEGORY)),
  }),
};

export const updateProduct = {
  params: Joi.object({
    productId: Joi.string().required().custom(ulidWithPrefix(EntityPrefix.PRODUCT)),
  }),
  body: Joi.object({
    name: Joi.string().max(255).custom(sanitizeString).custom(noSqlInjection),
    description: Joi.string().custom(sanitizeString).custom(noSqlInjection),
    price: Joi.number().positive(),
    stockLevel: Joi.number().integer().min(0),
    categoryId: Joi.string().custom(ulidWithPrefix(EntityPrefix.CATEGORY)),
  }).min(1),
};

export const getProduct = {
  params: Joi.object({
    productId: Joi.string().required().custom(ulidWithPrefix(EntityPrefix.PRODUCT)),
  }),
};

export const deleteProduct = {
  params: Joi.object({
    productId: Joi.string().required().custom(ulidWithPrefix(EntityPrefix.PRODUCT)),
  }),
};

export const getProducts = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string()
      .valid('name', 'price', 'stockLevel', 'createdAt', 'updatedAt')
      .default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    categoryId: Joi.string().custom(ulidWithPrefix(EntityPrefix.CATEGORY)),
    search: Joi.string().max(100).custom(sanitizeString).custom(noSqlInjection),
    minPrice: Joi.number().positive(),
    maxPrice: Joi.number().positive(),
    inStock: Joi.boolean(),
  }),
};
