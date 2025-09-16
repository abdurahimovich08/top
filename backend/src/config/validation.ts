import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3000),
  CORS_ORIGINS: Joi.string().default('*'),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  OTP_TTL: Joi.number().default(300),
  DATABASE_URL: Joi.string().uri().required(),
  REDIS_URL: Joi.string().optional(),
});
