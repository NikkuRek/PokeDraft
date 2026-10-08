import jwt from 'jsonwebtoken';
import { IAuthPayload } from '../interfaces/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'pokedraft_super_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const generateJWT = (payload: IAuthPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
  });
};

export const verifyJWT = (token: string): IAuthPayload => {
  return jwt.verify(token, JWT_SECRET) as IAuthPayload;
};
