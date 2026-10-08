import { Request, Response } from 'express';
import { PokemonService } from '../services/pokemon.service.js';

export class PokemonController {
  public static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { query, type, minCost, maxCost, tier, leagueId, limit, offset } = req.query;

      const result = await PokemonService.getAll({
        query: query ? String(query) : undefined,
        type: type ? String(type) : undefined,
        minCost: minCost ? Number(minCost) : undefined,
        maxCost: maxCost ? Number(maxCost) : undefined,
        tier: tier ? String(tier) : undefined,
        leagueId: leagueId ? Number(leagueId) : undefined,
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0
      });

      res.status(200).json({ ok: true, data: result.rows, total: result.count });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const pokemon = await PokemonService.getById(id);
      res.status(200).json({ ok: true, data: pokemon });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }

  public static async syncPokeApi(req: Request, res: Response): Promise<void> {
    try {
      const { nameOrId, defaultCost } = req.body;
      const pokemon = await PokemonService.syncFromPokeApi(nameOrId, defaultCost);
      res.status(200).json({ ok: true, data: pokemon });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ ok: false, msg: error.message });
    }
  }
}
