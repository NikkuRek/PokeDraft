import { sequelize } from '../config/sequelize.config.js';
import { Coach, RosterEntry, Pokemon, LeagueTier, League } from '../models/index.js';
import { exportToShowdownFormat } from '../helpers/showdown-export.helpers.js';

// Pokémon Type Chart Matrix for defense calculation
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

    const roster = (coach as any).Roster || [];
    const coverage = this.calculateTeamCoverage(roster);
    const showdownExport = exportToShowdownFormat(coach.team_name, roster);

    return {
      coach,
      roster,
      coverage,
      showdownExport
    };
  }

  public static calculateTeamCoverage(roster: any[]) {
    // Counts how many pokemon resist (mult < 1), are weak (mult > 1), or immune (mult = 0) to each type
    const matrix: Record<string, { weak: number; resist: number; immune: number; neutral: number }> = {};

    ALL_TYPES.forEach((atkType) => {
      matrix[atkType] = { weak: 0, resist: 0, immune: 0, neutral: 0 };
    });

    for (const entry of roster) {
      if (!entry.Pokemon) continue;
      const t1 = entry.Pokemon.type1.toLowerCase();
      const t2 = entry.Pokemon.type2 ? entry.Pokemon.type2.toLowerCase() : null;

      ALL_TYPES.forEach((atkType) => {
        let multiplier = 1;
        const vsT1 = TYPE_CHART[atkType]?.[t1] !== undefined ? TYPE_CHART[atkType][t1] : 1;
        const vsT2 = t2 && TYPE_CHART[atkType]?.[t2] !== undefined ? TYPE_CHART[atkType][t2] : 1;

        multiplier = vsT1 * vsT2;

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

      // Check drop roster entry
      const dropEntry = await RosterEntry.findOne({
        where: { coach_id: coachId, pokemon_id: dropPokemonId, status: 'ACTIVE' },
        transaction: t
      });
      if (!dropEntry) {
        throw { statusCode: 400, message: 'El Pokémon a soltar no está en la plantilla activa.' };
      }

      // Check add Pokemon cost and availability
      const addPokemon = await Pokemon.findByPk(addPokemonId, { transaction: t });
      if (!addPokemon) throw { statusCode: 404, message: 'El Pokémon a fichar no existe.' };

      // Check if addPokemon is already on ANY active roster in this league
      const activeCheck = await RosterEntry.findOne({
        include: [{ model: Coach, as: 'Coach', where: { league_id: league.id } }],
        where: { pokemon_id: addPokemonId, status: 'ACTIVE' },
        transaction: t
      });
      if (activeCheck) {
        throw { statusCode: 400, message: 'El Pokémon a fichar ya pertenece a otro entrenador de la liga.' };
      }

      // Cost calculation
      let addCost = addPokemon.default_cost;
      const customTier = await LeagueTier.findOne({
        where: { league_id: league.id, pokemon_id: addPokemonId },
        transaction: t
      });
      if (customTier) addCost = customTier.custom_cost;

      const refundCost = dropEntry.cost_paid;
      const newBudget = coach.remaining_budget + refundCost - addCost;

      if (league.draft_mode === 'POINTS' && newBudget < 0) {
        throw { statusCode: 400, message: `Presupuesto insuficiente para este cambio. Saldo resultante: ${newBudget} pts.` };
      }

      // Drop
      await dropEntry.update({ status: 'DROPPED' }, { transaction: t });

      // Add
      await RosterEntry.create({
        coach_id: coachId,
        pokemon_id: addPokemonId,
        cost_paid: addCost,
        is_tera_captain: false,
        status: 'ACTIVE'
      }, { transaction: t });

      // Update budget
      await coach.update({ remaining_budget: newBudget }, { transaction: t });

      await t.commit();
      return { ok: true, msg: 'Fichaje de Free Agency realizado con éxito.', newBudget };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}
