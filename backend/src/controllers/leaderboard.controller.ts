import { Request, Response } from 'express';
import { LeaderboardService } from '../services/leaderboard.service.js';

export class LeaderboardController {
  public static async getStandings(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.leagueId, 10);
      const standings = await LeaderboardService.getStandings(leagueId);
      res.status(200).json({ ok: true, data: standings });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async getPokemonMvpRanking(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.leagueId, 10);
      const ranking = await LeaderboardService.getPokemonMvpRanking(leagueId);
      res.status(200).json({ ok: true, data: ranking });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }
}
