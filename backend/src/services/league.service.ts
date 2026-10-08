import { League, Coach, LeagueTier, Pokemon, DraftPick, Match } from '../models/index.js';
import { ILeague, LeagueStatus, DraftMode } from '../interfaces/index.js';

export class LeagueService {
  public static async createLeague(data: {
    admin_id: number;
    name: string;
    draft_mode?: DraftMode;
    total_budget?: number;
    roster_size?: number;
    time_per_pick_seconds?: number;
  }): Promise<League> {
    return await League.create({
      admin_id: data.admin_id,
      name: data.name,
      draft_mode: data.draft_mode || 'POINTS',
      total_budget: data.total_budget || 100,
      roster_size: data.roster_size || 10,
      time_per_pick_seconds: data.time_per_pick_seconds || 120,
      status: 'SETUP',
      current_pick_turn: 1
    });
  }

  public static async getAllLeagues(): Promise<League[]> {
    return await League.findAll({
      include: [
        { model: Coach, as: 'Coaches' }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  public static async getLeagueById(id: number): Promise<League> {
    const league = await League.findByPk(id, {
      include: [
        {
          model: Coach,
          as: 'Coaches',
          include: ['Roster']
        },
        {
          model: DraftPick,
          as: 'DraftPicks',
          include: [
            { model: Pokemon, as: 'Pokemon' },
            { model: Coach, as: 'Coach' }
          ]
        },
        {
          model: Match,
          as: 'Matches',
          include: ['HomeCoach', 'AwayCoach']
        }
      ]
    });

    if (!league) {
      throw { statusCode: 404, message: `Liga con ID ${id} no encontrada.` };
    }
    return league;
  }

  public static async updateLeagueStatus(id: number, status: LeagueStatus): Promise<League> {
    const league = await this.getLeagueById(id);
    await league.update({ status });
    return league;
  }

  public static async setCustomPokemonTier(leagueId: number, pokemonId: number, customCost: number, customTier?: string): Promise<LeagueTier> {
    const [tier, created] = await LeagueTier.findOrCreate({
      where: { league_id: leagueId, pokemon_id: pokemonId },
      defaults: {
        league_id: leagueId,
        pokemon_id: pokemonId,
        custom_cost: customCost,
        custom_tier: customTier || null
      }
    });

    if (!created) {
      await tier.update({ custom_cost: customCost, custom_tier: customTier || null });
    }

    return tier;
  }
}
