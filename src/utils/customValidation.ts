import { CustomHelpers } from 'joi';
import { UlidHelper, EntityPrefix } from './ulid.helper';

export const password = (value: string, helpers: CustomHelpers) => {
  const hasMinLength = value.length >= 8;
  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value);
  
  if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
    return helpers.message({
      custom: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
    });
  }
  
  return value;
};

export const ulid = (value: string, helpers: CustomHelpers) => {
  if (!UlidHelper.isValid(value)) {
    return helpers.message({custom: 'Invalid ULID format'});
  }
  
  return value;
};

export const ulidWithPrefix = (expectedPrefix: EntityPrefix) => {
  return (value: string, helpers: CustomHelpers) => {
    if (!UlidHelper.isValid(value)) {
      return helpers.message({custom: 'Invalid ULID format'});
    }
    
    if (!UlidHelper.validatePrefix(value, expectedPrefix)) {
      return helpers.message({
        custom: `Invalid ULID format or prefix. Expected prefix: ${expectedPrefix}`
      });
    }
    
    return value;
  };
};