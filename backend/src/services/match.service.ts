import { sequelize } from '../config/sequelize.config.js';
import { Match, MatchPokemonStat, Coach, Pokemon, League } from '../models/index.js';

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function buildDoubleRoundRobinSchedule(coachIdsInput: number[]): Array<{
  week: number;
  leg: number;
  home_coach_id: number;
  away_coach_id: number;
}> {
  const shuffledCoaches = shuffleArray(coachIdsInput);
  if (shuffledCoaches.length % 2 !== 0) {
    shuffledCoaches.push(-1); // Dummy BYE slot
  }

  const n = shuffledCoaches.length;
  const roundsPerLeg = n - 1;
  const ring = [...shuffledCoaches];
  const leg1Rounds: Array<Array<{ home_coach_id: number; away_coach_id: number }>> = [];

  for (let roundIdx = 0; roundIdx < roundsPerLeg; roundIdx++) {
    const pairings: Array<{ home_coach_id: number; away_coach_id: number }> = [];
    for (let i = 0; i < n / 2; i++) {
      const a = ring[i];
      const b = ring[n - 1 - i];
      if (a !== -1 && b !== -1) {
        const flipHome = (roundIdx + i) % 2 === 1;
        pairings.push(
          flipHome ? { home_coach_id: b, away_coach_id: a } : { home_coach_id: a, away_coach_id: b }
        );
      }
    }
    leg1Rounds.push(shuffleArray(pairings));
    ring.splice(1, 0, ring.pop()!);
  }

  // Randomize round order independently for Ida and Vuelta (Premier League style)
  const randomizedLeg1 = shuffleArray(leg1Rounds);
  const leg2Rounds = leg1Rounds.map((pairings) =>
    shuffleArray(
      pairings.map((p) => ({
        home_coach_id: p.away_coach_id,
        away_coach_id: p.home_coach_id
      }))
    )
  );
  const randomizedLeg2 = shuffleArray(leg2Rounds);

  const schedule: Array<{
    week: number;
    leg: number;
    home_coach_id: number;
    away_coach_id: number;
  }> = [];

  randomizedLeg1.forEach((pairings, idx) => {
    const week = idx + 1;
    pairings.forEach((p) => {
      schedule.push({ week, leg: 1, ...p });
    });
  });

  randomizedLeg2.forEach((pairings, idx) => {
    const week = roundsPerLeg + idx + 1;
    pairings.forEach((p) => {
      schedule.push({ week, leg: 2, ...p });
    });
  });

  return schedule;
}

export class MatchService {
  public static async generateRoundRobinFixture(leagueId: number): Promise<Match[]> {
    const league = await League.findByPk(leagueId);
    if (!league) throw { statusCode: 404, message: 'Liga no encontrada.' };

    const coaches = await Coach.findAll({
      where: { league_id: leagueId },
      order: [['draft_order', 'ASC']]
    });

    if (coaches.length < 2) {
      throw { statusCode: 400, message: 'Se necesitan al menos 2 entrenadores para generar el fixture.' };
    }

    // Clear previous pending matches if regenerating
    await Match.destroy({ where: { league_id: leagueId, status: 'PENDING' } });

    const schedule = buildDoubleRoundRobinSchedule(coaches.map((c) => c.id));
    const matchesToCreate = schedule.map((item) => ({
      league_id: leagueId,
      week: item.week,
      leg: item.leg,
      home_coach_id: item.home_coach_id,
      away_coach_id: item.away_coach_id,
      home_score: 0,
      away_score: 0,
      status: 'PENDING' as const
    }));

    return await Match.bulkCreate(matchesToCreate);
  }

  public static async getMatches(leagueId: number, week?: number) {
    const where: any = { league_id: leagueId };
    if (week) where.week = week;

    return await Match.findAll({
      where,
      include: [
        { model: Coach, as: 'HomeCoach' },
        { model: Coach, as: 'AwayCoach' },
        {
          model: MatchPokemonStat,
          as: 'Stats',
          include: [{ model: Pokemon, as: 'Pokemon' }]
        }
      ],
      order: [
        ['leg', 'ASC'],
        ['week', 'ASC'],
        ['id', 'ASC']
      ]
    });
  }

  public static async recordMatchResult(
    matchId: number,
    data: {
      home_score: number;
      away_score: number;
      replay_url?: string;
      pokemon_stats?: {
        coach_id: number;
        pokemon_id: number;
        kills: number;
        died: boolean;
      }[];
    }
  ) {
    const t = await sequelize.transaction();

    try {
      const match = await Match.findByPk(matchId, { transaction: t });
      if (!match) throw { statusCode: 404, message: 'Partido no encontrado.' };

      await match.update(
        {
          home_score: data.home_score,
          away_score: data.away_score,
          replay_url: data.replay_url || null,
          status: 'COMPLETED'
        },
        { transaction: t }
      );

      await MatchPokemonStat.destroy({ where: { match_id: matchId }, transaction: t });

      if (data.pokemon_stats && data.pokemon_stats.length > 0) {
        const statsRecords = data.pokemon_stats.map((s) => ({
          match_id: matchId,
          coach_id: s.coach_id,
          pokemon_id: s.pokemon_id,
          kills: s.kills || 0,
          died: Boolean(s.died)
        }));
        await MatchPokemonStat.bulkCreate(statsRecords, { transaction: t });
      }

      await t.commit();
      return match;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}
