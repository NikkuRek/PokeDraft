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
}
