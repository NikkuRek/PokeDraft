import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../middlewares/validate-token.middlewares.js';

export class AuthController {
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, role } = req.body;
      const result = await AuthService.register(email, password, role);
      res.status(201).json({ ok: true, data: result });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message || 'Error en el registro.' });
    }
  }

  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.status(200).json({ ok: true, data: result });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message || 'Error en el inicio de sesión.' });
    }
  }

  public static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ ok: false, msg: 'No autenticado.' });
        return;
      }
      const user = await AuthService.getProfile(req.user.id);
      res.status(200).json({ ok: true, data: user });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }
}
