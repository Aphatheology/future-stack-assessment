import jwt from 'jsonwebtoken';
import config from '../config/env';

export interface TokenPayload {
  userId: string;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.accessTokenSecret, {
    expiresIn: parseInt(config.jwt.accessTokenExpireInMinute) * 60,
  });
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, config.jwt.refreshTokenSecret, {
    expiresIn: parseInt(config.jwt.refreshTokenExpireInDays) * 24 * 60 * 60,
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.accessTokenSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, config.jwt.refreshTokenSecret) as RefreshTokenPayload;
};

 