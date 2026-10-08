import { Coach, League, RosterEntry, Pokemon } from '../models/index.js';
import { ICoach } from '../interfaces/index.js';

export class CoachService {
  public static async registerCoach(data: {
    league_id: number;
    user_id?: number | null;
    name: string;
    team_name: string;
    draft_order?: number;
  }): Promise<Coach> {
    const league = await League.findByPk(data.league_id);
    if (!league) {
      throw { statusCode: 404, message: 'Liga no encontrada.' };
    }

    if (league.status !== 'SETUP') {
      throw { statusCode: 400, message: 'No se pueden añadir participantes una vez iniciado o finalizado el draft.' };
    }

    // Determine draft order automatically if not specified
    let order = data.draft_order;
    if (!order) {
      const count = await Coach.count({ where: { league_id: data.league_id } });
      order = count + 1;
    }

    return await Coach.create({
      league_id: data.league_id,
      user_id: data.user_id || null,
      name: data.name,
      team_name: data.team_name,
      draft_order: order,
      remaining_budget: league.total_budget
    });
  }

  public static async getCoachesByLeague(leagueId: number): Promise<Coach[]> {
    return await Coach.findAll({
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
  }

  public static async reorderDraft(leagueId: number, coachOrders: { coachId: number; draftOrder: number }[]): Promise<Coach[]> {
    for (const item of coachOrders) {
      await Coach.update(
        { draft_order: item.draftOrder },
        { where: { id: item.coachId, league_id: leagueId } }
      );
    }
    return await this.getCoachesByLeague(leagueId);
  }
}
