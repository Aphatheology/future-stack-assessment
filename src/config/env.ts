import dotenv from 'dotenv';
import path from 'path';
import Joi from 'joi';
import { Request } from 'express';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

interface EnvVars {
  NODE_ENV: string;
  PORT: string;
  DATABASE_URL: string;
  JWT_ACCESS_TOKEN_SECRET: string;
  JWT_ACCESS_TOKEN_EXPIRE_IN_MINUTE: string;
  JWT_REFRESH_TOKEN_SECRET: string;
  JWT_REFRESH_TOKEN_EXPIRE_IN_DAYS: string;
  REDIS_HOST?: string;
  REDIS_PORT?: string;
  REDIS_PASSWORD?: string;
}

const envVarsSchema = Joi.object<EnvVars>({
  NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
  PORT: Joi.string().default('4000'),
  DATABASE_URL: Joi.string().required(),
  JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
  JWT_ACCESS_TOKEN_EXPIRE_IN_MINUTE: Joi.number().required(),
  JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
  JWT_REFRESH_TOKEN_EXPIRE_IN_DAYS: Joi.number().required(),
  REDIS_HOST: Joi.string().optional(),
  REDIS_PORT: Joi.string().optional(),
  REDIS_PASSWORD: Joi.string().optional(),
}).unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const getServerUrl = (req?: Request): string => {
  if (req) {
    let protocol = req.protocol;
    const host = req.get('host');
    
    if (req.get('x-forwarded-proto')) {
      const forwardedProto = req.get('x-forwarded-proto');
      if (forwardedProto) {
        protocol = forwardedProto;
      }
    }
    
    return `${protocol}://${host}`;
  }
  
  const port = envVars.PORT || '3000';
  return `http://localhost:${port}`;
};

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  jwt: {
    accessTokenSecret: envVars.JWT_ACCESS_TOKEN_SECRET,
    accessTokenExpireInMinute: envVars.JWT_ACCESS_TOKEN_EXPIRE_IN_MINUTE,
    refreshTokenExpireInDays: envVars.JWT_REFRESH_TOKEN_EXPIRE_IN_DAYS,
    refreshTokenSecret: envVars.JWT_REFRESH_TOKEN_SECRET,
  },
  db: {
    url: envVars.DATABASE_URL,
  },
  redis: {
    host: envVars.REDIS_HOST || 'localhost',
    port: parseInt(envVars.REDIS_PORT || '6379'),
    password: envVars.REDIS_PASSWORD,
  },
  getServerUrl,
};

export default config;
