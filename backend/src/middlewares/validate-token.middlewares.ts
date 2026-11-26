import { Request, Response, NextFunction } from 'express';
import { verifyJWT } from '../helpers/jwt.helpers.js';
import { IAuthPayload } from '../interfaces/index.js';
import { League } from '../models/index.js';

export interface AuthenticatedRequest extends Request {
  user?: IAuthPayload;
}

export const optionalJWT = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.header('Authorization');
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    try {
      req.user = verifyJWT(token);
    } catch {
      // Ignore invalid/expired token when auth is optional
    }
  }
  next();
};

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

export const requireLeagueCommissioner = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  validateJWT(req, res, async () => {
    if (!req.user) return;
    const rawLeagueId = req.params.leagueId || req.params.id;
    const leagueId = parseInt(String(rawLeagueId || ''), 10);
    if (isNaN(leagueId)) {
      res.status(400).json({ ok: false, msg: 'ID de liga inválido.' });
      return;
    }

    try {
      const league = await League.findByPk(leagueId);
      if (!league) {
        res.status(404).json({ ok: false, msg: 'Liga no encontrada.' });
        return;
      }

      if (req.user.role !== 'ADMIN' && league.admin_id !== req.user.id) {
        res.status(403).json({
          ok: false,
          msg: 'Solo el comisionado de la liga puede realizar esta acción.'
        });
        return;
      }

      next();
    } catch (err: any) {
      res.status(500).json({ ok: false, msg: err.message || 'Error validando permisos.' });
    }
  });
};
