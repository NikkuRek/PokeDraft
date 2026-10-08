import { Coach, Match, MatchPokemonStat, Pokemon } from '../models/index.js';

export interface ICoachStanding {
  coach_id: number;
  name: string;
  team_name: string;
  played: number;
  wins: number;
  losses: number;
  differential: number;
  points: number; // 3 pts per win
}

export class LeaderboardService {
  public static async getStandings(leagueId: number): Promise<ICoachStanding[]> {
    const coaches = await Coach.findAll({ where: { league_id: leagueId } });
    const matches = await Match.findAll({
      where: { league_id: leagueId, status: 'COMPLETED' }
    });

    const standingsMap: Record<number, ICoachStanding> = {};

    coaches.forEach((c) => {
      standingsMap[c.id] = {
        coach_id: c.id,
        name: c.name,
        team_name: c.team_name,
        played: 0,
        wins: 0,
        losses: 0,
        differential: 0,
        points: 0
      };
    });

    matches.forEach((m) => {
      const home = standingsMap[m.home_coach_id];
      const away = standingsMap[m.away_coach_id];

      if (home && away) {
        home.played += 1;
        away.played += 1;

        const diff = m.home_score - m.away_score;
        home.differential += diff;
        away.differential -= diff;

        if (m.home_score > m.away_score) {
          home.wins += 1;
          home.points += 3;
          away.losses += 1;
        } else if (m.away_score > m.home_score) {
          away.wins += 1;
          away.points += 3;
          home.losses += 1;
        }
      }
    });

    // Sort by Points DESC, Differential DESC, Wins DESC
    return Object.values(standingsMap).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.differential !== a.differential) return b.differential - a.differential;
      return b.wins - a.wins;
    });
  }

  public static async getPokemonMvpRanking(leagueId: number) {
    const stats = await MatchPokemonStat.findAll({
      include: [
        {
          model: Match,
          as: 'Match',
          where: { league_id: leagueId }
        },
        { model: Pokemon, as: 'Pokemon' },
        { model: Coach, as: 'Coach' }
      ]
    });

    const mvpMap: Record<number, {
      pokemon_id: number;
      name: string;
      sprite_url: string;
      sprite_animated_url?: string | null;
      type1: string;
      type2?: string | null;
      coach_name: string;
      team_name: string;
      kills: number;
      deaths: number;
      kd_ratio: number;
      appearances: number;
    }> = {};

    stats.forEach((s: any) => {
      const pId = s.pokemon_id;
      if (!mvpMap[pId] && s.Pokemon) {
        mvpMap[pId] = {
          pokemon_id: pId,
          name: s.Pokemon.name,
          sprite_url: s.Pokemon.sprite_url,
          sprite_animated_url: s.Pokemon.sprite_animated_url,
          type1: s.Pokemon.type1,
          type2: s.Pokemon.type2,
          coach_name: s.Coach ? s.Coach.name : 'Libre',
          team_name: s.Coach ? s.Coach.team_name : 'Libre',
          kills: 0,
          deaths: 0,
          kd_ratio: 0,
          appearances: 0
        };
      }

      if (mvpMap[pId]) {
        mvpMap[pId].kills += s.kills;
        if (s.died) mvpMap[pId].deaths += 1;
        mvpMap[pId].appearances += 1;
      }
    });

    // Calculate K/D ratio and sort
    const ranking = Object.values(mvpMap).map((item) => {
      item.kd_ratio = item.deaths === 0 ? item.kills : Number((item.kills / item.deaths).toFixed(2));
      return item;
    });

    return ranking.sort((a, b) => {
      if (b.kills !== a.kills) return b.kills - a.kills;
      return b.kd_ratio - a.kd_ratio;
    });
  }
}
