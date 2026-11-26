import { League, Coach, LeagueTier, Pokemon, DraftPick, Match } from '../models/index.js';
import { LeagueStatus, DraftMode, TimeoutAction } from '../interfaces/index.js';
import { draftEventsHub } from './draft-events.service.js';

export class LeagueService {
  public static async createLeague(data: {
    admin_id: number;
    name: string;
    draft_mode?: DraftMode;
    total_budget?: number;
    roster_size?: number;
    time_per_pick_seconds?: number;
    format_name?: string;
    allow_dynamax?: boolean;
    allow_z_moves?: boolean;
    max_megas?: number;
    max_z_crystals?: number;
    max_tera_captains?: number;
    max_free_agency_moves?: number;
    require_trade_approval?: boolean;
    timeout_action?: TimeoutAction;
  }): Promise<League> {
    return await League.create({
      admin_id: data.admin_id,
      name: data.name,
      draft_mode: data.draft_mode || 'POINTS',
      total_budget: data.total_budget ?? 100,
      roster_size: data.roster_size ?? 10,
      time_per_pick_seconds: data.time_per_pick_seconds ?? 43200,
      format_name: data.format_name || 'NatDex Gen 9',
      allow_dynamax: Boolean(data.allow_dynamax ?? false),
      allow_z_moves: Boolean(data.allow_z_moves ?? false),
      max_megas: data.max_megas ?? 1,
      max_z_crystals: data.max_z_crystals ?? 1,
      max_tera_captains: data.max_tera_captains ?? 0,
      max_free_agency_moves: data.max_free_agency_moves ?? 6,
      require_trade_approval: Boolean(data.require_trade_approval ?? false),
      timeout_action: data.timeout_action || 'AUTO_PICK',
      is_paused: false,
      status: 'SETUP',
      current_pick_turn: 1
    });
  }

  public static async getAllLeagues(): Promise<League[]> {
    return await League.findAll({
      include: [{ model: Coach, as: 'Coaches' }],
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

  public static async updateLeagueRules(
    leagueId: number,
    data: Partial<{
      format_name: string;
      time_per_pick_seconds: number;
      timeout_action: TimeoutAction;
      max_megas: number;
      max_z_crystals: number;
      max_tera_captains: number;
      max_free_agency_moves: number;
      require_trade_approval: boolean;
      allow_dynamax: boolean;
      allow_z_moves: boolean;
    }>
  ): Promise<League> {
    const league = await League.findByPk(leagueId);
    if (!league) {
      throw { statusCode: 404, message: `Liga con ID ${leagueId} no encontrada.` };
    }

    const patch: any = {};
    if (data.format_name !== undefined) patch.format_name = String(data.format_name).trim() || 'NatDex Gen 9';
    if (data.time_per_pick_seconds !== undefined) patch.time_per_pick_seconds = Math.max(30, Number(data.time_per_pick_seconds));
    if (data.timeout_action === 'AUTO_PICK' || data.timeout_action === 'PAUSE') patch.timeout_action = data.timeout_action;
    if (data.max_megas !== undefined) patch.max_megas = Math.max(0, Number(data.max_megas));
    if (data.max_z_crystals !== undefined) patch.max_z_crystals = Math.max(0, Number(data.max_z_crystals));
    if (data.max_tera_captains !== undefined) patch.max_tera_captains = Math.max(0, Number(data.max_tera_captains));
    if (data.max_free_agency_moves !== undefined) patch.max_free_agency_moves = Math.max(0, Number(data.max_free_agency_moves));
    if (data.require_trade_approval !== undefined) patch.require_trade_approval = Boolean(data.require_trade_approval);
    if (data.allow_dynamax !== undefined) patch.allow_dynamax = Boolean(data.allow_dynamax);
    if (data.allow_z_moves !== undefined) patch.allow_z_moves = Boolean(data.allow_z_moves);

    await league.update(patch);

    if (league.status === 'DRAFTING') {
      draftEventsHub.publish(leagueId, 'draft:update', { action: 'rules_updated', league_id: leagueId });
    }

    return league;
  }

  public static async getLeagueTiers(leagueId: number): Promise<LeagueTier[]> {
    return await LeagueTier.findAll({
      where: { league_id: leagueId },
      include: [{ model: Pokemon, as: 'Pokemon' }],
      order: [['id', 'ASC']]
    });
  }

  public static async setCustomPokemonTier(
    leagueId: number,
    pokemonId: number,
    customCost: number,
    customTier?: string | null,
    isBanned: boolean = false
  ): Promise<LeagueTier> {
    const [tier, created] = await LeagueTier.findOrCreate({
      where: { league_id: leagueId, pokemon_id: pokemonId },
      defaults: {
        league_id: leagueId,
        pokemon_id: pokemonId,
        custom_cost: customCost,
        custom_tier: customTier || null,
        is_banned: Boolean(isBanned)
      }
    });

    if (!created) {
      await tier.update({
        custom_cost: customCost,
        custom_tier: customTier || null,
        is_banned: Boolean(isBanned)
      });
    }

    const league = await League.findByPk(leagueId);
    if (league && league.status === 'DRAFTING') {
      draftEventsHub.publish(leagueId, 'draft:update', {
        action: 'tier_updated',
        league_id: leagueId,
        pokemon_id: pokemonId
      });
    }

    return tier;
  }
}
