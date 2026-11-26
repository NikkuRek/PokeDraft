import { sequelize } from '../config/sequelize.config.js';
import { Coach, RosterEntry, Pokemon, LeagueTier, League, Transaction } from '../models/index.js';
import { exportToShowdownFormat } from '../helpers/showdown-export.helpers.js';
import { isMegaPokemonName, validateRosterSpecialLimits } from '../helpers/pokemon-rules.helpers.js';

const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};

const ALL_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

export class RosterService {
  public static async getCoachRoster(coachId: number) {
    const coach = await Coach.findByPk(coachId, {
      include: [
        {
          model: RosterEntry,
          as: 'Roster',
          where: { status: 'ACTIVE' },
          required: false,
          include: [{ model: Pokemon, as: 'Pokemon' }]
        }
      ]
    });

    if (!coach) {
      throw { statusCode: 404, message: 'Entrenador no encontrado.' };
    }

    const league = await League.findByPk(coach.league_id);
    const freeAgencyUsed = await Transaction.count({
      where: { league_id: coach.league_id, coach_id: coach.id, type: 'FREE_AGENCY' }
    });

    const roster = (coach as any).Roster || [];
    const coverage = this.calculateTeamCoverage(roster);
    const leagueRules = league
      ? {
          id: league.id,
          admin_id: league.admin_id,
          format_name: league.format_name,
          allow_dynamax: league.allow_dynamax,
          allow_z_moves: league.allow_z_moves,
          max_megas: league.max_megas,
          max_z_crystals: league.max_z_crystals,
          max_tera_captains: league.max_tera_captains,
          max_free_agency_moves: league.max_free_agency_moves,
          require_trade_approval: league.require_trade_approval
        }
      : undefined;

    const showdownExport = exportToShowdownFormat(coach.team_name, roster, leagueRules);

    return {
      coach,
      roster,
      coverage,
      showdownExport,
      league: leagueRules,
      free_agency_used: freeAgencyUsed
    };
  }

  public static calculateTeamCoverage(roster: any[]) {
    const matrix: Record<string, { weak: number; resist: number; immune: number; neutral: number }> = {};

    ALL_TYPES.forEach((atkType) => {
      matrix[atkType] = { weak: 0, resist: 0, immune: 0, neutral: 0 };
    });

    for (const entry of roster) {
      if (!entry.Pokemon) continue;
      const t1 = entry.Pokemon.type1.toLowerCase();
      const t2 = entry.Pokemon.type2 ? entry.Pokemon.type2.toLowerCase() : null;

      ALL_TYPES.forEach((atkType) => {
        const vsT1 = TYPE_CHART[atkType]?.[t1] !== undefined ? TYPE_CHART[atkType][t1] : 1;
        const vsT2 = t2 && TYPE_CHART[atkType]?.[t2] !== undefined ? TYPE_CHART[atkType][t2] : 1;
        const multiplier = vsT1 * vsT2;

        if (multiplier === 0) {
          matrix[atkType].immune += 1;
        } else if (multiplier > 1) {
          matrix[atkType].weak += 1;
        } else if (multiplier < 1) {
          matrix[atkType].resist += 1;
        } else {
          matrix[atkType].neutral += 1;
        }
      });
    }

    return matrix;
  }

  public static async freeAgencyDropAdd(coachId: number, dropPokemonId: number, addPokemonId: number) {
    const t = await sequelize.transaction();

    try {
      const coach = await Coach.findByPk(coachId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!coach) throw { statusCode: 404, message: 'Entrenador no encontrado.' };

      const league = await League.findByPk(coach.league_id, { transaction: t });
      if (!league) throw { statusCode: 404, message: 'Liga no encontrada.' };

      if (league.max_free_agency_moves > 0) {
        const usedMoves = await Transaction.count({
          where: { league_id: league.id, coach_id: coach.id, type: 'FREE_AGENCY' },
          transaction: t
        });
        if (usedMoves >= league.max_free_agency_moves) {
          throw {
            statusCode: 400,
            message: `Has alcanzado el límite de movimientos de Free Agency (${usedMoves}/${league.max_free_agency_moves}).`
          };
        }
      }

      const activeEntries = await RosterEntry.findAll({
        where: { coach_id: coachId, status: 'ACTIVE' },
        transaction: t
      });

      const dropEntry = activeEntries.find((e) => e.pokemon_id === dropPokemonId);
      if (!dropEntry) {
        throw { statusCode: 400, message: 'El Pokémon a soltar no está en la plantilla activa.' };
      }

      const addPokemon = await Pokemon.findByPk(addPokemonId, { transaction: t });
      if (!addPokemon) throw { statusCode: 404, message: 'El Pokémon a fichar no existe.' };

      const activeCheck = await RosterEntry.findOne({
        include: [{ model: Coach, as: 'Coach', where: { league_id: league.id } }],
        where: { pokemon_id: addPokemonId, status: 'ACTIVE' },
        transaction: t
      });
      if (activeCheck) {
        throw { statusCode: 400, message: 'El Pokémon a fichar ya pertenece a otro entrenador de la liga.' };
      }

      let addCost = addPokemon.default_cost;
      const customTier = await LeagueTier.findOne({
        where: { league_id: league.id, pokemon_id: addPokemonId },
        transaction: t
      });
      if (customTier) {
        if (customTier.is_banned) {
          throw { statusCode: 400, message: `${addPokemon.name} está baneado en esta liga.` };
        }
        addCost = customTier.custom_cost;
      }

      const refundCost = dropEntry.cost_paid;
      const newBudget = coach.remaining_budget + refundCost - addCost;

      if (league.draft_mode === 'POINTS' && newBudget < 0) {
        throw {
          statusCode: 400,
          message: `Presupuesto insuficiente para este cambio. Saldo resultante: ${newBudget} pts.`
        };
      }

      const isAddMega = isMegaPokemonName(addPokemon.name);
      const simulatedRoster = activeEntries
        .filter((e) => e.id !== dropEntry.id)
        .map((e) => ({
          is_mega: Boolean(e.is_mega),
          is_z_user: Boolean(e.is_z_user),
          is_tera_captain: Boolean(e.is_tera_captain)
        }))
        .concat([{ is_mega: isAddMega, is_z_user: false, is_tera_captain: false }]);

      validateRosterSpecialLimits(simulatedRoster, league);

      await dropEntry.update({ status: 'DROPPED' }, { transaction: t });

      await RosterEntry.create(
        {
          coach_id: coachId,
          pokemon_id: addPokemonId,
          cost_paid: addCost,
          is_mega: isAddMega,
          is_z_user: false,
          is_tera_captain: false,
          status: 'ACTIVE'
        },
        { transaction: t }
      );

      await coach.update({ remaining_budget: newBudget }, { transaction: t });

      await Transaction.create(
        {
          league_id: league.id,
          coach_id: coachId,
          type: 'FREE_AGENCY',
          drop_pokemon_id: dropPokemonId,
          add_pokemon_id: addPokemonId,
          notes: `Suelta ${refundCost} pts · Ficha ${addCost} pts`
        },
        { transaction: t }
      );

      await t.commit();
      return { ok: true, msg: 'Fichaje de Free Agency realizado con éxito.', newBudget };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  public static async updateEntryDesignations(
    coachId: number,
    entryId: number,
    data: { is_mega?: boolean; is_z_user?: boolean; is_tera_captain?: boolean }
  ) {
    const t = await sequelize.transaction();
    try {
      const coach = await Coach.findByPk(coachId, { transaction: t });
      if (!coach) throw { statusCode: 404, message: 'Entrenador no encontrado.' };

      const league = await League.findByPk(coach.league_id, { transaction: t });
      if (!league) throw { statusCode: 404, message: 'Liga no encontrada.' };

      const entries = await RosterEntry.findAll({
        where: { coach_id: coachId, status: 'ACTIVE' },
        include: [{ model: Pokemon, as: 'Pokemon' }],
        transaction: t
      });

      const target = entries.find((e) => e.id === entryId);
      if (!target) {
        throw { statusCode: 404, message: 'Pokémon activo no encontrado en la plantilla.' };
      }

      const nextMega = data.is_mega !== undefined ? Boolean(data.is_mega) : Boolean(target.is_mega);
      const nextZ = data.is_z_user !== undefined ? Boolean(data.is_z_user) : Boolean(target.is_z_user);
      const nextTera =
        data.is_tera_captain !== undefined ? Boolean(data.is_tera_captain) : Boolean(target.is_tera_captain);

      const simulated = entries.map((e) =>
        e.id === entryId
          ? { is_mega: nextMega, is_z_user: nextZ, is_tera_captain: nextTera }
          : {
              is_mega: Boolean(e.is_mega),
              is_z_user: Boolean(e.is_z_user),
              is_tera_captain: Boolean(e.is_tera_captain)
            }
      );

      validateRosterSpecialLimits(simulated, league);

      await target.update(
        {
          is_mega: nextMega,
          is_z_user: nextZ,
          is_tera_captain: nextTera
        },
        { transaction: t }
      );

      await t.commit();
      return target;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  public static async getLeagueTransactions(leagueId: number) {
    return await Transaction.findAll({
      where: { league_id: leagueId },
      include: [
        { model: Coach, as: 'Coach' },
        { model: Coach, as: 'CounterpartyCoach' },
        { model: Pokemon, as: 'DropPokemon' },
        { model: Pokemon, as: 'AddPokemon' }
      ],
      order: [['created_at', 'DESC'], ['id', 'DESC']],
      limit: 100
    });
  }
}
