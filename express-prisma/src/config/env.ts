import dotenv from 'dotenv';
import path from 'path';
import Joi from 'joi';

dotenv.config({ path: path.join(__dirname, '../../.env') });

interface EnvVars {
  NODE_ENV: string;
  PORT: string;
  DATABASE_URL: string;
  JWT_ACCESS_TOKEN_SECRET: string;
  JWT_ACCESS_TOKEN_EXPIRE_IN_MINUTE: string;
  JWT_REFRESH_TOKEN_SECRET: string;
  JWT_REFRESH_TOKEN_EXPIRE_IN_DAYS: string;
  CLIENT_URL: string;
}

const envVarsSchema = Joi.object<EnvVars>({
  NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
  PORT: Joi.string().default('4000'),
  DATABASE_URL: Joi.string().required(),
  JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
  JWT_ACCESS_TOKEN_EXPIRE_IN_MINUTE: Joi.number().required(),
  JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
  JWT_REFRESH_TOKEN_EXPIRE_IN_DAYS: Joi.number().required(),
  CLIENT_URL: Joi.string().uri().required(),
}).unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

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
  client: {
    url: envVars.CLIENT_URL,
  },
};

export default config;
