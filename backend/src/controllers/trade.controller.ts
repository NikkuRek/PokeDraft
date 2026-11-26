import { Request, Response } from 'express';
import { TradeService } from '../services/trade.service.js';

export class TradeController {
  public static async getLeagueTrades(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.leagueId, 10);
      const trades = await TradeService.getLeagueTrades(leagueId);
      res.status(200).json({ ok: true, data: trades });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async proposeTrade(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = parseInt(req.params.leagueId, 10);
      const trade = await TradeService.proposeTrade({
        league_id: leagueId,
        proposer_coach_id: req.body.proposer_coach_id,
        receiver_coach_id: req.body.receiver_coach_id,
        proposer_pokemon_ids: req.body.proposer_pokemon_ids,
        receiver_pokemon_ids: req.body.receiver_pokemon_ids,
        notes: req.body.notes
      });
      res.status(201).json({ ok: true, data: trade, msg: 'Propuesta de trade enviada.' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async respondToTrade(req: Request, res: Response): Promise<void> {
    try {
      const tradeId = parseInt(req.params.tradeId, 10);
      const trade = await TradeService.respondToTrade(tradeId, req.body.action);
      res.status(200).json({ ok: true, data: trade });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async reviewTradeAsCommissioner(req: Request, res: Response): Promise<void> {
    try {
      const tradeId = parseInt(req.params.tradeId, 10);
      const trade = await TradeService.reviewTradeAsCommissioner(tradeId, Boolean(req.body.approve));
      res.status(200).json({ ok: true, data: trade });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }
}
