import { Op } from 'sequelize';
import { sequelize } from '../config/sequelize.config.js';
import {
  League,
  Coach,
  Pokemon,
  LeagueTier,
  DraftPick,
  RosterEntry,
  DraftQueueItem
} from '../models/index.js';
import { calculateSnakeTurn, generateDraftSchedule } from '../helpers/snake-draft.helpers.js';
import { isMegaPokemonName } from '../helpers/pokemon-rules.helpers.js';
import { draftEventsHub } from './draft-events.service.js';

const processingTimers = new Set<number>();

export class DraftService {
  private static computeRemainingSeconds(league: League): number | null {
    if (league.status !== 'DRAFTING') return null;
    if (league.is_paused) {
      return Math.max(0, league.paused_remaining_seconds ?? league.time_per_pick_seconds);
    }
    if (!league.turn_started_at) return league.time_per_pick_seconds;
    const elapsedSec = Math.floor((Date.now() - new Date(league.turn_started_at).getTime()) / 1000);
    return Math.max(0, league.time_per_pick_seconds - elapsedSec);
  }

  public static async startDraft(leagueId: number): Promise<League> {
    const league = await League.findByPk(leagueId, {
      include: [{ model: Coach, as: 'Coaches' }]
    });

    if (!league) {
      throw { statusCode: 404, message: 'Liga no encontrada.' };
    }

    const coaches = (league as any).Coaches || [];
    if (coaches.length < 2) {
      throw { statusCode: 400, message: 'Se requieren al menos 2 entrenadores para iniciar el draft.' };
    }

    await league.update({
      status: 'DRAFTING',
      current_pick_turn: 1,
      is_paused: false,
      turn_started_at: new Date(),
      paused_remaining_seconds: null
    });

    draftEventsHub.publish(leagueId, 'draft:update', { action: 'start', league_id: leagueId });
    return league;
  }

  public static async getDraftState(leagueId: number) {
    await this.processExpiredTurnIfNeeded(leagueId);

    const league = await League.findByPk(leagueId);
    if (!league) {
      throw { statusCode: 404, message: 'Liga no encontrada.' };
    }

    const coaches = await Coach.findAll({
      where: { league_id: leagueId },
      include: [
        {
          model: RosterEntry,
          as: 'Roster',
          where: { status: 'ACTIVE' },
          required: false,
          include: [{ model: Pokemon, as: 'Pokemon' }]
        }
      ],
      order: [['draft_order', 'ASC']]
    });

    const picks = await DraftPick.findAll({
      where: { league_id: leagueId },
      include: [
        { model: Coach, as: 'Coach' },
        { model: Pokemon, as: 'Pokemon' }
      ],
      order: [['overall_pick', 'ASC']]
    });

    const bannedTiers = await LeagueTier.findAll({
      where: { league_id: leagueId, is_banned: true }
    });
    const bannedPokemonIds = bannedTiers.map((t) => t.pokemon_id);

    const totalPicks = league.roster_size * coaches.length;
    const isCompleted = league.current_pick_turn > totalPicks;

    let activeTurnInfo = null;
    if (!isCompleted && coaches.length > 0 && league.status === 'DRAFTING') {
      activeTurnInfo = calculateSnakeTurn(
        league.current_pick_turn,
        coaches.map((c) => c.toJSON())
      );
    }

    const schedule = generateDraftSchedule(
      league.roster_size,
      coaches.map((c) => c.toJSON()),
      league.current_pick_turn
    );

    const draftedPokemonIds = picks.map((p) => p.pokemon_id);
    const remainingSeconds = this.computeRemainingSeconds(league);
    const turnExpiresAt =
      league.status === 'DRAFTING' && !league.is_paused && league.turn_started_at
        ? new Date(new Date(league.turn_started_at).getTime() + league.time_per_pick_seconds * 1000).toISOString()
        : null;

    return {
      league: {
        id: league.id,
        admin_id: league.admin_id,
        name: league.name,
        status: league.status,
        draft_mode: league.draft_mode,
        total_budget: league.total_budget,
        roster_size: league.roster_size,
        time_per_pick_seconds: league.time_per_pick_seconds,
        current_pick_turn: league.current_pick_turn,
        total_picks: totalPicks,
        is_completed: isCompleted,
        format_name: league.format_name,
        allow_dynamax: league.allow_dynamax,
        allow_z_moves: league.allow_z_moves,
        max_megas: league.max_megas,
        max_z_crystals: league.max_z_crystals,
        max_tera_captains: league.max_tera_captains,
        max_free_agency_moves: league.max_free_agency_moves,
        require_trade_approval: league.require_trade_approval,
        timeout_action: league.timeout_action,
        is_paused: league.is_paused,
        turn_started_at: league.turn_started_at,
        paused_remaining_seconds: league.paused_remaining_seconds
      },
      active_turn: activeTurnInfo,
      coaches,
      picks,
      drafted_pokemon_ids: draftedPokemonIds,
      banned_pokemon_ids: bannedPokemonIds,
      turn_expires_at: turnExpiresAt,
      remaining_seconds: remainingSeconds,
      schedule
    };
  }

  public static async makePick(
    leagueId: number,
    coachId: number,
    pokemonId: number,
    options?: { forcedByAdmin?: boolean; isAutoPick?: boolean }
  ) {
    const t = await sequelize.transaction();
    let pickResult: any;

    try {
      const league = await League.findByPk(leagueId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!league) {
        throw { statusCode: 404, message: 'Liga no encontrada.' };
      }

      if (league.status !== 'DRAFTING') {
        throw { statusCode: 400, message: 'La liga no está en fase de DRAFT.' };
      }

      if (league.is_paused && !options?.forcedByAdmin) {
        throw { statusCode: 400, message: 'El draft está pausado por el comisionado.' };
      }

      const coaches = await Coach.findAll({
        where: { league_id: leagueId },
        order: [['draft_order', 'ASC']],
        transaction: t
      });

      const totalPicks = league.roster_size * coaches.length;
      if (league.current_pick_turn > totalPicks) {
        throw { statusCode: 400, message: 'El draft ya ha alcanzado el límite de rondas.' };
      }

      const turnInfo = calculateSnakeTurn(
        league.current_pick_turn,
        coaches.map((c) => c.toJSON())
      );
      if (turnInfo.coach.id !== coachId) {
        throw {
          statusCode: 403,
          message: `No es el turno de este entrenador. Turno actual: ${turnInfo.coach.name} (${turnInfo.coach.team_name}).`
        };
      }

      const existingPick = await DraftPick.findOne({
        where: { league_id: leagueId, pokemon_id: pokemonId },
        transaction: t
      });
      if (existingPick) {
        throw { statusCode: 400, message: 'Este Pokémon ya ha sido seleccionado por otro entrenador.' };
      }

      const pokemon = await Pokemon.findByPk(pokemonId, { transaction: t });
      if (!pokemon) {
        throw { statusCode: 404, message: 'Pokémon no encontrado.' };
      }

      let cost = pokemon.default_cost;
      const customTier = await LeagueTier.findOne({
        where: { league_id: leagueId, pokemon_id: pokemonId },
        transaction: t
      });
      if (customTier) {
        if (customTier.is_banned) {
          throw { statusCode: 400, message: `${pokemon.name} está baneado en esta liga.` };
        }
        cost = customTier.custom_cost;
      }

      const coach = await Coach.findByPk(coachId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!coach) {
        throw { statusCode: 404, message: 'Entrenador no encontrado.' };
      }

      if (league.draft_mode === 'POINTS' && coach.remaining_budget < cost) {
        throw {
          statusCode: 400,
          message: `Presupuesto insuficiente. El Pokémon cuesta ${cost} pts y te quedan ${coach.remaining_budget} pts.`
        };
      }

      const isMega = isMegaPokemonName(pokemon.name);
      if (isMega) {
        const activeMegas = await RosterEntry.count({
          where: { coach_id: coachId, status: 'ACTIVE', is_mega: true },
          transaction: t
        });
        if (activeMegas >= league.max_megas) {
          throw {
            statusCode: 400,
            message: `Has alcanzado el límite de Megas permitidas en esta liga (${league.max_megas}).`
          };
        }
      }

      const overallPickNumber = league.current_pick_turn;
      const pick = await DraftPick.create(
        {
          league_id: leagueId,
          coach_id: coachId,
          pokemon_id: pokemonId,
          round: turnInfo.round,
          overall_pick: overallPickNumber
        },
        { transaction: t }
      );

      await RosterEntry.create(
        {
          coach_id: coachId,
          pokemon_id: pokemonId,
          cost_paid: cost,
          is_mega: isMega,
          is_z_user: false,
          is_tera_captain: false,
          status: 'ACTIVE'
        },
        { transaction: t }
      );

      await coach.update({ remaining_budget: coach.remaining_budget - cost }, { transaction: t });

      await DraftQueueItem.destroy({
        where: { league_id: leagueId, pokemon_id: pokemonId },
        transaction: t
      });

      const nextTurn = overallPickNumber + 1;
      const willBeCompleted = nextTurn > totalPicks;

      await league.update(
        {
          current_pick_turn: nextTurn,
          status: willBeCompleted ? 'IN_PROGRESS' : 'DRAFTING',
          is_paused: false,
          paused_remaining_seconds: null,
          turn_started_at: willBeCompleted ? null : new Date()
        },
        { transaction: t }
      );

      await t.commit();

      pickResult = {
        ok: true,
        pick,
        overall_pick: overallPickNumber,
        next_turn: nextTurn,
        is_completed: willBeCompleted
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }

    draftEventsHub.publish(leagueId, 'draft:update', {
      action: options?.isAutoPick ? 'auto_pick' : options?.forcedByAdmin ? 'force_pick' : 'pick',
      overall_pick: pickResult.overall_pick,
      coach_id: coachId,
      pokemon_id: pokemonId,
      is_completed: pickResult.is_completed
    });

    return pickResult;
  }

  public static async pauseDraft(leagueId: number) {
    const league = await League.findByPk(leagueId);
    if (!league) throw { statusCode: 404, message: 'Liga no encontrada.' };
    if (league.status !== 'DRAFTING') {
      throw { statusCode: 400, message: 'Solo se puede pausar una liga en fase de draft.' };
    }
    if (league.is_paused) return league;

    const remaining = this.computeRemainingSeconds(league) ?? league.time_per_pick_seconds;
    await league.update({
      is_paused: true,
      paused_remaining_seconds: remaining,
      turn_started_at: null
    });

    draftEventsHub.publish(leagueId, 'draft:update', { action: 'pause', league_id: leagueId });
    return league;
  }

  public static async resumeDraft(leagueId: number) {
    const league = await League.findByPk(leagueId);
    if (!league) throw { statusCode: 404, message: 'Liga no encontrada.' };
    if (league.status !== 'DRAFTING') {
      throw { statusCode: 400, message: 'Solo se puede reanudar una liga en fase de draft.' };
    }

    const resumeRemaining =
      league.paused_remaining_seconds && league.paused_remaining_seconds > 0
        ? league.paused_remaining_seconds
        : league.time_per_pick_seconds;
    const elapsedMs = Math.max(0, (league.time_per_pick_seconds - resumeRemaining) * 1000);
    const resumedStartedAt = new Date(Date.now() - elapsedMs);

    await league.update({
      is_paused: false,
      paused_remaining_seconds: null,
      turn_started_at: resumedStartedAt
    });

    draftEventsHub.publish(leagueId, 'draft:update', { action: 'resume', league_id: leagueId });
    return league;
  }

  public static async forcePick(leagueId: number, pokemonId: number) {
    const league = await League.findByPk(leagueId);
    if (!league) throw { statusCode: 404, message: 'Liga no encontrada.' };
    if (league.status !== 'DRAFTING') {
      throw { statusCode: 400, message: 'La liga no está en fase de DRAFT.' };
    }

    const coaches = await Coach.findAll({
      where: { league_id: leagueId },
      order: [['draft_order', 'ASC']]
    });
    const turnInfo = calculateSnakeTurn(
      league.current_pick_turn,
      coaches.map((c) => c.toJSON())
    );
    if (!turnInfo.coach?.id) {
      throw { statusCode: 400, message: 'No se pudo determinar el entrenador del turno activo.' };
    }

    return await this.makePick(leagueId, turnInfo.coach.id, pokemonId, { forcedByAdmin: true });
  }

  public static async autoPickForActiveTurn(leagueId: number) {
    const league = await League.findByPk(leagueId);
    if (!league || league.status !== 'DRAFTING') {
      throw { statusCode: 400, message: 'La liga no está en fase de draft activa.' };
    }

    const coaches = await Coach.findAll({
      where: { league_id: leagueId },
      order: [['draft_order', 'ASC']]
    });
    if (coaches.length === 0) return null;

    const totalPicks = league.roster_size * coaches.length;
    if (league.current_pick_turn > totalPicks) return null;

    const turnInfo = calculateSnakeTurn(
      league.current_pick_turn,
      coaches.map((c) => c.toJSON())
    );
    const activeCoach = await Coach.findByPk(turnInfo.coach.id);
    if (!activeCoach) return null;

    const draftedIds = new Set(
      (await DraftPick.findAll({ where: { league_id: leagueId }, attributes: ['pokemon_id'] })).map(
        (p) => p.pokemon_id
      )
    );

    const tiers = await LeagueTier.findAll({ where: { league_id: leagueId } });
    const bannedIds = new Set(tiers.filter((t) => t.is_banned).map((t) => t.pokemon_id));
    const customCostMap = new Map(tiers.map((t) => [t.pokemon_id, t.custom_cost]));

    const activeMegas = await RosterEntry.count({
      where: { coach_id: activeCoach.id, status: 'ACTIVE', is_mega: true }
    });

    const isEligible = (p: Pokemon) => {
      if (draftedIds.has(p.id) || bannedIds.has(p.id)) return false;
      const cost = customCostMap.get(p.id) ?? p.default_cost;
      if (league.draft_mode === 'POINTS' && activeCoach.remaining_budget < cost) return false;
      if (isMegaPokemonName(p.name) && activeMegas >= league.max_megas) return false;
      return true;
    };

    const queueItems = await DraftQueueItem.findAll({
      where: { league_id: leagueId, coach_id: activeCoach.id },
      include: [{ model: Pokemon, as: 'Pokemon' }],
      order: [['priority', 'ASC']]
    });

    let chosenPokemonId: number | null = null;
    for (const q of queueItems) {
      const poke = (q as any).Pokemon as Pokemon | undefined;
      if (poke && isEligible(poke)) {
        chosenPokemonId = poke.id;
        break;
      }
    }

    if (!chosenPokemonId) {
      const candidates = await Pokemon.findAll({ order: [['default_cost', 'ASC'], ['dex_number', 'ASC']] });
      const valid = candidates.filter(isEligible).sort((a, b) => {
        const ca = customCostMap.get(a.id) ?? a.default_cost;
        const cb = customCostMap.get(b.id) ?? b.default_cost;
        return ca - cb || a.dex_number - b.dex_number;
      });
      if (valid.length > 0) {
        chosenPokemonId = valid[0].id;
      }
    }

    if (!chosenPokemonId) {
      await league.update({ is_paused: true, paused_remaining_seconds: 0, turn_started_at: null });
      draftEventsHub.publish(leagueId, 'draft:update', { action: 'pause_no_valid_pick', league_id: leagueId });
      return { ok: false, paused: true, msg: 'No hay Pokémon elegibles para auto-pick; draft pausado.' };
    }

    return await this.makePick(leagueId, activeCoach.id, chosenPokemonId, {
      forcedByAdmin: true,
      isAutoPick: true
    });
  }

  public static async processExpiredTurnIfNeeded(leagueId: number): Promise<void> {
    if (processingTimers.has(leagueId)) return;
    processingTimers.add(leagueId);

    try {
      const league = await League.findByPk(leagueId);
      if (!league || league.status !== 'DRAFTING' || league.is_paused || !league.turn_started_at) {
        return;
      }
      const remaining = this.computeRemainingSeconds(league);
      if (remaining === null || remaining > 0) return;

      if (league.timeout_action === 'PAUSE') {
        await league.update({ is_paused: true, paused_remaining_seconds: 0, turn_started_at: null });
        draftEventsHub.publish(leagueId, 'draft:update', { action: 'timeout_pause', league_id: leagueId });
      } else {
        await this.autoPickForActiveTurn(leagueId);
      }
    } catch (err) {
      console.warn(`[DraftTimer] Error procesando expiración de liga ${leagueId}:`, err);
    } finally {
      processingTimers.delete(leagueId);
    }
  }

  public static async checkAllExpiredDrafts(): Promise<void> {
    const draftingLeagues = await League.findAll({
      where: {
        status: 'DRAFTING',
        is_paused: false,
        turn_started_at: { [Op.ne]: null }
      },
      attributes: ['id', 'turn_started_at', 'time_per_pick_seconds']
    });

    for (const league of draftingLeagues) {
      if (!league.turn_started_at) continue;
      const expiresAt = new Date(league.turn_started_at).getTime() + league.time_per_pick_seconds * 1000;
      if (Date.now() >= expiresAt) {
        await this.processExpiredTurnIfNeeded(league.id);
      }
    }
  }

  public static async undoLastPick(leagueId: number) {
    const t = await sequelize.transaction();

    try {
      const league = await League.findByPk(leagueId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!league || league.current_pick_turn <= 1) {
        throw { statusCode: 400, message: 'No hay elecciones previas para deshacer.' };
      }

      const lastPickNumber = league.current_pick_turn - 1;
      const lastPick = await DraftPick.findOne({
        where: { league_id: leagueId, overall_pick: lastPickNumber },
        transaction: t
      });

      if (!lastPick) {
        throw { statusCode: 404, message: 'No se encontró la última elección.' };
      }

      const coach = await Coach.findByPk(lastPick.coach_id, { transaction: t });
      const rosterEntry = await RosterEntry.findOne({
        where: { coach_id: lastPick.coach_id, pokemon_id: lastPick.pokemon_id, status: 'ACTIVE' },
        transaction: t
      });

      const refundCost = rosterEntry ? rosterEntry.cost_paid : 0;

      if (rosterEntry) await rosterEntry.destroy({ transaction: t });
      await lastPick.destroy({ transaction: t });

      if (coach) {
        await coach.update({ remaining_budget: coach.remaining_budget + refundCost }, { transaction: t });
      }

      await league.update(
        {
          current_pick_turn: lastPickNumber,
          status: 'DRAFTING',
          is_paused: false,
          paused_remaining_seconds: null,
          turn_started_at: new Date()
        },
        { transaction: t }
      );

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }

    draftEventsHub.publish(leagueId, 'draft:update', { action: 'undo', league_id: leagueId });
    return { ok: true, msg: 'Última elección deshecha correctamente.' };
  }

  // Draft Queue (Auto-pick Priorities)
  public static async getCoachQueue(leagueId: number, coachId: number) {
    return await DraftQueueItem.findAll({
      where: { league_id: leagueId, coach_id: coachId },
      include: [{ model: Pokemon, as: 'Pokemon' }],
      order: [['priority', 'ASC'], ['id', 'ASC']]
    });
  }

  public static async addToQueue(leagueId: number, coachId: number, pokemonId: number) {
    const coach = await Coach.findOne({ where: { id: coachId, league_id: leagueId } });
    if (!coach) throw { statusCode: 404, message: 'Entrenador no encontrado en esta liga.' };

    const drafted = await DraftPick.findOne({ where: { league_id: leagueId, pokemon_id: pokemonId } });
    if (drafted) throw { statusCode: 400, message: 'Este Pokémon ya fue drafteado.' };

    const banned = await LeagueTier.findOne({ where: { league_id: leagueId, pokemon_id: pokemonId, is_banned: true } });
    if (banned) throw { statusCode: 400, message: 'Este Pokémon está baneado en esta liga.' };

    const existing = await DraftQueueItem.findOne({
      where: { league_id: leagueId, coach_id: coachId, pokemon_id: pokemonId }
    });
    if (existing) {
      return await this.getCoachQueue(leagueId, coachId);
    }

    const maxPriority = (await DraftQueueItem.max('priority', {
      where: { league_id: leagueId, coach_id: coachId }
    })) as number | null;

    await DraftQueueItem.create({
      league_id: leagueId,
      coach_id: coachId,
      pokemon_id: pokemonId,
      priority: (maxPriority || 0) + 1
    });

    return await this.getCoachQueue(leagueId, coachId);
  }

  public static async reorderQueue(leagueId: number, coachId: number, pokemonIds: number[]) {
    const t = await sequelize.transaction();
    try {
      for (let i = 0; i < pokemonIds.length; i++) {
        await DraftQueueItem.update(
          { priority: i + 1 },
          { where: { league_id: leagueId, coach_id: coachId, pokemon_id: pokemonIds[i] }, transaction: t }
        );
      }
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
    return await this.getCoachQueue(leagueId, coachId);
  }

  public static async removeFromQueue(leagueId: number, coachId: number, pokemonId: number) {
    await DraftQueueItem.destroy({
      where: { league_id: leagueId, coach_id: coachId, pokemon_id: pokemonId }
    });
    const remaining = await this.getCoachQueue(leagueId, coachId);
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].priority !== i + 1) {
        await remaining[i].update({ priority: i + 1 });
      }
    }
    return await this.getCoachQueue(leagueId, coachId);
  }
}
