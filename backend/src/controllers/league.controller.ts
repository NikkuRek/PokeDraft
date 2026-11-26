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
        time_per_pick_seconds: req.body.time_per_pick_seconds,
        format_name: req.body.format_name,
        allow_dynamax: req.body.allow_dynamax,
        allow_z_moves: req.body.allow_z_moves,
        max_megas: req.body.max_megas,
        max_z_crystals: req.body.max_z_crystals,
        max_tera_captains: req.body.max_tera_captains,
        max_free_agency_moves: req.body.max_free_agency_moves,
        require_trade_approval: req.body.require_trade_approval,
        timeout_action: req.body.timeout_action
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

  public static async updateLeagueRules(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.id, 10);
      const league = await LeagueService.updateLeagueRules(leagueId, req.body);
      res.status(200).json({ ok: true, data: league });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async getLeagueTiers(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.id, 10);
      const tiers = await LeagueService.getLeagueTiers(leagueId);
      res.status(200).json({ ok: true, data: tiers });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async setCustomPokemonTier(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.id, 10);
      const { pokemon_id, custom_cost, custom_tier, is_banned } = req.body;
      const tier = await LeagueService.setCustomPokemonTier(
        leagueId,
        pokemon_id,
        custom_cost,
        custom_tier,
        Boolean(is_banned)
      );
      res.status(200).json({ ok: true, data: tier });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }
}
