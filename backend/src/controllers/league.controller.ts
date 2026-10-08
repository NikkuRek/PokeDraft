import { Request, Response } from 'express';
import { LeagueService } from '../services/league.service.js';
import { AuthenticatedRequest } from '../middlewares/validate-token.middlewares.js';

export class LeagueController {
  public static async createLeague(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const admin_id = req.user ? req.user.id : (req.body.admin_id || 1);
      const league = await LeagueService.createLeague({
        admin_id,
        name: req.body.name,
        draft_mode: req.body.draft_mode,
        total_budget: req.body.total_budget,
        roster_size: req.body.roster_size,
        time_per_pick_seconds: req.body.time_per_pick_seconds
      });
      res.status(201).json({ ok: true, data: league });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async getAllLeagues(req: Request, res: Response): Promise<void> {
    try {
      const leagues = await LeagueService.getAllLeagues();
      res.status(200).json({ ok: true, data: leagues });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async getLeagueById(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.id, 10);
      const league = await LeagueService.getLeagueById(leagueId);
      res.status(200).json({ ok: true, data: league });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async setCustomPokemonTier(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.id, 10);
      const { pokemon_id, custom_cost, custom_tier } = req.body;
      const tier = await LeagueService.setCustomPokemonTier(leagueId, pokemon_id, custom_cost, custom_tier);
      res.status(200).json({ ok: true, data: tier });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }
}
