import { Coach, Match, MatchPokemonStat, Pokemon } from '../models/index.js';

export interface ICoachStanding {
  coach_id: number;
  name: string;
  team_name: string;
  played: number;
  wins: number;
  losses: number;
  differential: number;
  points: number; // 3 pts per win (Premier League style)
  h2h_points?: number;
  h2h_diff?: number;
  tied_on_primary?: boolean;
}

export function sortStandingsWithHeadToHead(
  coaches: Array<{ id: number; name: string; team_name: string }>,
  matches: Array<{ home_coach_id: number; away_coach_id: number; home_score: number; away_score: number }>
): ICoachStanding[] {
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
      points: 0,
      h2h_points: 0,
      h2h_diff: 0,
      tied_on_primary: false
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

  // Compute Head-to-Head mini-table for any coaches tied on primary criteria (points & differential)
  const tieGroups = new Map<string, ICoachStanding[]>();
  Object.values(standingsMap).forEach((row) => {
    const key = `${row.points}:${row.differential}`;
    const group = tieGroups.get(key) || [];
    group.push(row);
    tieGroups.set(key, group);
  });

  tieGroups.forEach((group) => {
    if (group.length < 2) return;
    const memberIds = new Set(group.map((g) => g.coach_id));
    const h2hPoints: Record<number, number> = {};
    const h2hDiff: Record<number, number> = {};
    group.forEach((g) => {
      g.tied_on_primary = true;
      h2hPoints[g.coach_id] = 0;
      h2hDiff[g.coach_id] = 0;
    });

    matches.forEach((m) => {
      if (!memberIds.has(m.home_coach_id) || !memberIds.has(m.away_coach_id)) return;
      const diff = m.home_score - m.away_score;
      h2hDiff[m.home_coach_id] += diff;
      h2hDiff[m.away_coach_id] -= diff;
      if (m.home_score > m.away_score) {
        h2hPoints[m.home_coach_id] += 3;
      } else if (m.away_score > m.home_score) {
        h2hPoints[m.away_coach_id] += 3;
      }
    });

    group.forEach((g) => {
      g.h2h_points = h2hPoints[g.coach_id];
      g.h2h_diff = h2hDiff[g.coach_id];
    });
  });

  return Object.values(standingsMap).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.differential !== a.differential) return b.differential - a.differential;
    if ((b.h2h_points ?? 0) !== (a.h2h_points ?? 0)) return (b.h2h_points ?? 0) - (a.h2h_points ?? 0);
    if ((b.h2h_diff ?? 0) !== (a.h2h_diff ?? 0)) return (b.h2h_diff ?? 0) - (a.h2h_diff ?? 0);
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.name.localeCompare(b.name);
  });
}

export class LeaderboardService {
  public static async getStandings(leagueId: number): Promise<ICoachStanding[]> {
    const coaches = await Coach.findAll({ where: { league_id: leagueId } });
    const matches = await Match.findAll({
      where: { league_id: leagueId, status: 'COMPLETED' }
    });

    return sortStandingsWithHeadToHead(coaches, matches);
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

    const mvpMap: Record<
      number,
      {
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
      }
    > = {};

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
