import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export const signAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

export default {
  signAccessToken,
  verifyAccessToken
};
