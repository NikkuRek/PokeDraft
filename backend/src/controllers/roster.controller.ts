import { Request, Response } from 'express';
import { RosterService } from '../services/roster.service.js';

export class RosterController {
  public static async getCoachRoster(req: Request, res: Response): Promise<void> {
    try {
      const coachId = parseInt(req.params.coachId, 10);
      const data = await RosterService.getCoachRoster(coachId);
      res.status(200).json({ ok: true, data });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async freeAgencyDropAdd(req: Request, res: Response): Promise<void> {
    try {
      const coachId = parseInt(req.params.coachId, 10);
      const { drop_pokemon_id, add_pokemon_id } = req.body;
      const result = await RosterService.freeAgencyDropAdd(coachId, drop_pokemon_id, add_pokemon_id);
      res.status(200).json({ ok: true, data: result });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async updateEntryDesignations(req: Request, res: Response): Promise<void> {
    try {
      const coachId = parseInt(req.params.coachId, 10);
      const entryId = parseInt(req.params.entryId, 10);
      const updated = await RosterService.updateEntryDesignations(coachId, entryId, req.body);
      res.status(200).json({ ok: true, data: updated });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async getLeagueTransactions(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.leagueId, 10);
      const transactions = await RosterService.getLeagueTransactions(leagueId);
      res.status(200).json({ ok: true, data: transactions });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }
}
