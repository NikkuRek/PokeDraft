import { Request, Response } from 'express';
import { CoachService } from '../services/coach.service.js';

export class CoachController {
  public static async registerCoach(req: Request, res: Response): Promise<void> {
    try {
      const coach = await CoachService.registerCoach(req.body);
      res.status(201).json({ ok: true, data: coach });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async getCoachesByLeague(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.leagueId, 10);
      const coaches = await CoachService.getCoachesByLeague(leagueId);
      res.status(200).json({ ok: true, data: coaches });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async reorderDraft(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.leagueId, 10);
      const coaches = await CoachService.reorderDraft(leagueId, req.body.coaches);
      res.status(200).json({ ok: true, data: coaches });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }
}
