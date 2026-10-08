import { Op } from 'sequelize';
import { Pokemon, LeagueTier } from '../models/index.js';
import { IPokemon } from '../interfaces/index.js';
import { PokeApiService } from './pokeapi.service.js';

export interface IPokemonFilters {
  query?: string;
  type?: string;
  minCost?: number;
  maxCost?: number;
  tier?: string;
  leagueId?: number;
  limit?: number;
  offset?: number;
}

export class PokemonService {
  public static async getAll(filters: IPokemonFilters = {}): Promise<{ count: number; rows: any[] }> {
    const { query, type, minCost, maxCost, tier, leagueId, limit = 50, offset = 0 } = filters;
    const where: any = {};

    if (query) {
      where[Op.or] = [
        { name: { [Op.like]: `%${query}%` } },
        { dex_number: isNaN(Number(query)) ? -1 : Number(query) }
      ];
    }

    if (type) {
      where[Op.or] = [
        { type1: type.toLowerCase() },
        { type2: type.toLowerCase() }
      ];
    }

    if (minCost !== undefined || maxCost !== undefined) {
      where.default_cost = {};
      if (minCost !== undefined) where.default_cost[Op.gte] = minCost;
      if (maxCost !== undefined) where.default_cost[Op.lte] = maxCost;
    }

    if (tier) {
      where.default_tier = tier;
    }

    const include: any[] = [];
    if (leagueId) {
      include.push({
        model: LeagueTier,
        as: 'LeagueTiers',
        where: { league_id: leagueId },
        required: false
      });
    }

    const { count, rows } = await Pokemon.findAndCountAll({
      where,
      include,
      limit: Math.min(limit, 200),
      offset,
      order: [['dex_number', 'ASC']]
    });

    // Map custom cost if leagueId is specified
    const mappedRows = rows.map((p: any) => {
      const plain = p.toJSON();
      if (leagueId && plain.LeagueTiers && plain.LeagueTiers.length > 0) {
        plain.cost = plain.LeagueTiers[0].custom_cost;
        plain.tier = plain.LeagueTiers[0].custom_tier;
      } else {
        plain.cost = plain.default_cost;
        plain.tier = plain.default_tier;
      }
      return plain;
    });

    return { count, rows: mappedRows };
  }

  public static async getById(id: number): Promise<IPokemon> {
    const pokemon = await Pokemon.findByPk(id);
    if (!pokemon) {
      throw { statusCode: 404, message: `Pokémon con ID ${id} no encontrado.` };
    }
    return pokemon;
  }

  public static async syncFromPokeApi(nameOrId: string | number, defaultCost: number = 10): Promise<IPokemon> {
    const details = await PokeApiService.fetchPokemonDetails(nameOrId, defaultCost);
    if (!details || !details.name) {
      throw { statusCode: 404, message: `No se pudo encontrar el Pokémon "${nameOrId}" en PokeAPI.` };
    }

    const [pokemon, created] = await Pokemon.findOrCreate({
      where: { dex_number: details.dex_number },
      defaults: details as IPokemon
    });

    if (!created) {
      await pokemon.update(details);
    }

    return pokemon;
  }
}
