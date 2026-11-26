import { Request, Response } from 'express';
import { DraftService } from '../services/draft.service.js';
import { draftEventsHub } from '../services/draft-events.service.js';

export class DraftController {
  public static streamDraftEvents(req: Request, res: Response): void {
    const leagueId = parseInt(req.params.leagueId, 10);
    draftEventsHub.subscribe(leagueId, req, res);
  }

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

  public static async pauseDraft(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.leagueId, 10);
      const league = await DraftService.pauseDraft(leagueId);
      res.status(200).json({ ok: true, data: league, msg: 'Draft pausado.' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async resumeDraft(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.leagueId, 10);
      const league = await DraftService.resumeDraft(leagueId);
      res.status(200).json({ ok: true, data: league, msg: 'Draft reanudado.' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async forcePick(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.leagueId, 10);
      const { pokemon_id } = req.body;
      const result = await DraftService.forcePick(leagueId, pokemon_id);
      res.status(200).json({ ok: true, data: result, msg: 'Pick forzado por el comisionado.' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async skipTurn(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.leagueId, 10);
      const result = await DraftService.autoPickForActiveTurn(leagueId);
      res.status(200).json({ ok: true, data: result, msg: 'Turno avanzado con auto-pick.' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async getCoachQueue(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.leagueId, 10);
      const coachId = parseInt(req.params.coachId, 10);
      const items = await DraftService.getCoachQueue(leagueId, coachId);
      res.status(200).json({ ok: true, data: items });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async addToQueue(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.leagueId, 10);
      const coachId = parseInt(req.params.coachId, 10);
      const { pokemon_id } = req.body;
      const items = await DraftService.addToQueue(leagueId, coachId, pokemon_id);
      res.status(201).json({ ok: true, data: items });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async reorderQueue(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.leagueId, 10);
      const coachId = parseInt(req.params.coachId, 10);
      const { pokemon_ids } = req.body;
      const items = await DraftService.reorderQueue(leagueId, coachId, pokemon_ids);
      res.status(200).json({ ok: true, data: items });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async removeFromQueue(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.leagueId, 10);
      const coachId = parseInt(req.params.coachId, 10);
      const pokemonId = parseInt(req.params.pokemonId, 10);
      const items = await DraftService.removeFromQueue(leagueId, coachId, pokemonId);
      res.status(200).json({ ok: true, data: items });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }
}
