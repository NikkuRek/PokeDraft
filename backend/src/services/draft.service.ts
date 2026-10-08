import { sequelize } from '../config/sequelize.config.js';
import { League, Coach, Pokemon, LeagueTier, DraftPick, RosterEntry } from '../models/index.js';
import { calculateSnakeTurn, generateDraftSchedule } from '../helpers/snake-draft.helpers.js';

export class DraftService {
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
      current_pick_turn: 1
    });

    return league;
  }

  public static async getDraftState(leagueId: number) {
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

    const totalPicks = league.roster_size * coaches.length;
    const isCompleted = league.current_pick_turn > totalPicks;

    let activeTurnInfo = null;
    if (!isCompleted && coaches.length > 0 && league.status === 'DRAFTING') {
      activeTurnInfo = calculateSnakeTurn(league.current_pick_turn, coaches.map((c) => c.toJSON()));
    }

    const schedule = generateDraftSchedule(
      league.roster_size,
      coaches.map((c) => c.toJSON()),
      league.current_pick_turn
    );

    // List of all drafted pokemon IDs in this league
    const draftedPokemonIds = picks.map((p) => p.pokemon_id);

    return {
      league: {
        id: league.id,
        name: league.name,
        status: league.status,
        draft_mode: league.draft_mode,
        total_budget: league.total_budget,
        roster_size: league.roster_size,
        time_per_pick_seconds: league.time_per_pick_seconds,
        current_pick_turn: league.current_pick_turn,
        total_picks: totalPicks,
        is_completed: isCompleted
      },
      active_turn: activeTurnInfo,
      coaches,
      picks,
      drafted_pokemon_ids: draftedPokemonIds,
      schedule
    };
  }

  public static async makePick(leagueId: number, coachId: number, pokemonId: number) {
    const t = await sequelize.transaction();

    try {
      const league = await League.findByPk(leagueId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!league) {
        throw { statusCode: 404, message: 'Liga no encontrada.' };
      }

      if (league.status !== 'DRAFTING') {
        throw { statusCode: 400, message: 'La liga no está en fase de DRAFT.' };
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

      // Check whose turn it is
      const turnInfo = calculateSnakeTurn(league.current_pick_turn, coaches.map((c) => c.toJSON()));
      if (turnInfo.coach.id !== coachId) {
        throw {
          statusCode: 403,
          message: `No es el turno de este entrenador. Turno actual: ${turnInfo.coach.name} (${turnInfo.coach.team_name}).`
        };
      }

      // Check if Pokémon is already drafted in this league (Unique Picks Rule)
      const existingPick = await DraftPick.findOne({
        where: { league_id: leagueId, pokemon_id: pokemonId },
        transaction: t
      });

      if (existingPick) {
        throw { statusCode: 400, message: 'Este Pokémon ya ha sido seleccionado por otro entrenador.' };
      }

      // Determine Pokemon cost
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
        cost = customTier.custom_cost;
      }

      // Check coach budget
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

      // Create DraftPick record
      const pick = await DraftPick.create(
        {
          league_id: leagueId,
          coach_id: coachId,
          pokemon_id: pokemonId,
          round: turnInfo.round,
          overall_pick: league.current_pick_turn
        },
        { transaction: t }
      );

      // Create RosterEntry record
      await RosterEntry.create(
        {
          coach_id: coachId,
          pokemon_id: pokemonId,
          cost_paid: cost,
          is_tera_captain: false,
          status: 'ACTIVE'
        },
        { transaction: t }
      );

      // Deduct budget
      await coach.update(
        { remaining_budget: coach.remaining_budget - cost },
        { transaction: t }
      );

      // Advance turn
      const nextTurn = league.current_pick_turn + 1;
      const willBeCompleted = nextTurn > totalPicks;

      await league.update(
        {
          current_pick_turn: nextTurn,
          status: willBeCompleted ? 'IN_PROGRESS' : 'DRAFTING'
        },
        { transaction: t }
      );

      await t.commit();

      return {
        ok: true,
        pick,
        next_turn: nextTurn,
        is_completed: willBeCompleted
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  public static async undoLastPick(leagueId: number) {
    const t = await sequelize.transaction();

    try {
      const league = await League.findByPk(leagueId, { transaction: t });
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
        where: { coach_id: lastPick.coach_id, pokemon_id: lastPick.pokemon_id },
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
          status: 'DRAFTING'
        },
        { transaction: t }
      );

      await t.commit();
      return { ok: true, msg: 'Última elección deshecha correctamente.' };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}
