import { UlidHelper, EntityPrefix } from './ulid.helper';

export const generateUserId = (): string => {
  return UlidHelper.generate(EntityPrefix.USER);
};

export const generateProductId = (): string => {
  return UlidHelper.generate(EntityPrefix.PRODUCT);
};

export const generateCategoryId = (): string => {
  return UlidHelper.generate(EntityPrefix.CATEGORY);
};

export const generateCartId = (): string => {
  return UlidHelper.generate(EntityPrefix.CART);
};

export const generateCartItemId = (): string => {
  return UlidHelper.generate(EntityPrefix.CART_ITEM);
};

export const generateId = (prefix: EntityPrefix): string => {
  return UlidHelper.generate(prefix);
};

export const generateMultiple = (prefix: EntityPrefix, count: number): string[] => {
  return UlidHelper.generateMultiple(prefix, count);
};

export const validateId = (id: string): boolean => {
  return UlidHelper.isValid(id);
};

export const validateIdWithPrefix = (id: string, expectedPrefix: EntityPrefix): boolean => {
  return UlidHelper.validatePrefix(id, expectedPrefix);
};
