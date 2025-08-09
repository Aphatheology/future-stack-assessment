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

export const sanitizeString = (value: string, helpers: CustomHelpers) => {
  if (typeof value !== 'string') {
    return helpers.message({custom: 'Value must be a string'});
  }
  
  const sanitized = value
    .replace(/[<>]/g, '')
    .replace(/[{}]/g, '')
    .replace(/[^\u0020-\u007E\t\n\r]/g, '')
    .trim();
  
  if (sanitized.length === 0 && value.length > 0) {
    return helpers.message({custom: 'String contains only invalid characters'});
  }
  
  return sanitized;
};

export const email = (value: string, helpers: CustomHelpers) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(value)) {
    return helpers.message({custom: 'Invalid email format'});
  }
  
  if (value.length > 254) {
    return helpers.message({custom: 'Email is too long'});
  }
  
  return value.toLowerCase().trim();
};

export const noSqlInjection = (value: string, helpers: CustomHelpers) => {
  const sqlPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    /(--|\/\*|\*\/)/,
    /(\bor\b|\band\b)\s*\d+\s*=\s*\d+/i,
    /['"]\s*(or|and)\s*['"]/i
  ];
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(value)) {
      return helpers.message({custom: 'Input contains potentially malicious content'});
    }
  }
  return value;
};
