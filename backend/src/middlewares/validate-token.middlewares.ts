import { Request, Response, NextFunction } from 'express';
import { verifyJWT } from '../helpers/jwt.helpers.js';
import { IAuthPayload } from '../interfaces/index.js';

export interface AuthenticatedRequest extends Request {
  user?: IAuthPayload;
}

export const validateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    res.status(401).json({
      ok: false,
      msg: 'No se ha proporcionado el token de autenticación (Header Authorization requerido).'
    });
    return;
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  try {
    const payload = verifyJWT(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({
      ok: false,
      msg: 'Token no válido o expirado.'
    });
  }
};

export const requireRole = (role: 'ADMIN' | 'COACH') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ ok: false, msg: 'Usuario no autenticado.' });
      return;
    }
    if (req.user.role !== role && req.user.role !== 'ADMIN') {
      res.status(403).json({ ok: false, msg: `Acceso denegado. Se requiere rol ${role}.` });
      return;
    }
    next();
  };
};
