import { Request, Response } from 'express';
import { MatchService } from '../services/match.service.js';

export class MatchController {
  public static async generateFixture(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.leagueId, 10);
      const matches = await MatchService.generateRoundRobinFixture(leagueId);
      res.status(201).json({ ok: true, data: matches, msg: 'Fixture generado exitosamente.' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async getMatches(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.leagueId, 10);
      const week = req.query.week ? parseInt(String(req.query.week), 10) : undefined;
      const matches = await MatchService.getMatches(leagueId, week);
      res.status(200).json({ ok: true, data: matches });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async recordResult(req: Request, res: Response): Promise<void> {
    try {
      const matchId = parseInt(req.params.id, 10);
      const result = await MatchService.recordMatchResult(matchId, req.body);
      res.status(200).json({ ok: true, data: result, msg: 'Resultado registrado correctamente.' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }
}
