import { sequelize } from '../config/sequelize.config.js';
import { Match, MatchPokemonStat, Coach, Pokemon, League } from '../models/index.js';

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

    const coachIds = coaches.map((c) => c.id);
    // If odd number of coaches, add a dummy bye (-1)
    const isOdd = coachIds.length % 2 !== 0;
    if (isOdd) {
      coachIds.push(-1);
    }

    const n = coachIds.length;
    const totalWeeks = n - 1;
    const matchesToCreate: any[] = [];

    // Standard Round-Robin rotation algorithm
    for (let week = 1; week <= totalWeeks; week++) {
      for (let i = 0; i < n / 2; i++) {
        const home = coachIds[i];
        const away = coachIds[n - 1 - i];

        if (home !== -1 && away !== -1) {
          matchesToCreate.push({
            league_id: leagueId,
            week,
            home_coach_id: home,
            away_coach_id: away,
            home_score: 0,
            away_score: 0,
            status: 'PENDING'
          });
        }
      }

      // Rotate list keeping first element fixed
      coachIds.splice(1, 0, coachIds.pop()!);
    }

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

      // Clean old stats for this match if editing
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
