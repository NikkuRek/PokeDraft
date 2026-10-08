import { Request, Response } from 'express';
import { DraftService } from '../services/draft.service.js';

export class DraftController {
  public static async startDraft(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.leagueId, 10);
      const league = await DraftService.startDraft(leagueId);
      res.status(200).json({ ok: true, data: league, msg: 'Draft iniciado exitosamente.' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async getDraftState(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.leagueId, 10);
      const state = await DraftService.getDraftState(leagueId);
      res.status(200).json({ ok: true, data: state });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async makePick(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.leagueId, 10);
      const { coach_id, pokemon_id } = req.body;
      const result = await DraftService.makePick(leagueId, coach_id, pokemon_id);
      res.status(200).json({ ok: true, data: result });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async undoLastPick(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.leagueId, 10);
      const result = await DraftService.undoLastPick(leagueId);
      res.status(200).json({ ok: true, data: result });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }
}
