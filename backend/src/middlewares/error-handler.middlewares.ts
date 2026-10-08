import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error('💥 Error no controlado:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor.';

  res.status(statusCode).json({
    ok: false,
    msg: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
