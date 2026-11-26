import { sequelize } from '../config/sequelize.config.js';
import {
  Coach,
  League,
  Pokemon,
  RosterEntry,
  Trade,
  TradeItem,
  Transaction
} from '../models/index.js';
import { isMegaPokemonName, validateRosterSpecialLimits } from '../helpers/pokemon-rules.helpers.js';

export class TradeService {
  private static validatePostTradeSimulation(
    coachA: Coach,
    coachB: Coach,
    rosterA: RosterEntry[],
    rosterB: RosterEntry[],
    fromAIds: number[],
    fromBIds: number[],
    league: League
  ) {
    const outA = rosterA.filter((e) => fromAIds.includes(e.pokemon_id));
    const outB = rosterB.filter((e) => fromBIds.includes(e.pokemon_id));

    if (outA.length !== fromAIds.length) {
      throw { statusCode: 400, message: `${coachA.name} ya no posee alguno de los Pokémon ofrecidos.` };
    }
    if (outB.length !== fromBIds.length) {
      throw { statusCode: 400, message: `${coachB.name} ya no posee alguno de los Pokémon solicitados.` };
    }

    const sumOutA = outA.reduce((acc, e) => acc + e.cost_paid, 0);
    const sumOutB = outB.reduce((acc, e) => acc + e.cost_paid, 0);

    const newBudgetA = coachA.remaining_budget + sumOutA - sumOutB;
    const newBudgetB = coachB.remaining_budget + sumOutB - sumOutA;

    if (league.draft_mode === 'POINTS') {
      if (newBudgetA < 0) {
        throw {
          statusCode: 400,
          message: `Presupuesto insuficiente para ${coachA.name} tras el trade (${newBudgetA} pts).`
        };
      }
      if (newBudgetB < 0) {
        throw {
          statusCode: 400,
          message: `Presupuesto insuficiente para ${coachB.name} tras el trade (${newBudgetB} pts).`
        };
      }
    }

    const finalRosterA = rosterA
      .filter((e) => !fromAIds.includes(e.pokemon_id))
      .map((e) => ({
        is_mega: Boolean(e.is_mega),
        is_z_user: Boolean(e.is_z_user),
        is_tera_captain: Boolean(e.is_tera_captain)
      }))
      .concat(
        outB.map((e) => ({
          is_mega: Boolean(e.is_mega) || isMegaPokemonName((e as any).Pokemon?.name || ''),
          is_z_user: false,
          is_tera_captain: false
        }))
      );

    const finalRosterB = rosterB
      .filter((e) => !fromBIds.includes(e.pokemon_id))
      .map((e) => ({
        is_mega: Boolean(e.is_mega),
        is_z_user: Boolean(e.is_z_user),
        is_tera_captain: Boolean(e.is_tera_captain)
      }))
      .concat(
        outA.map((e) => ({
          is_mega: Boolean(e.is_mega) || isMegaPokemonName((e as any).Pokemon?.name || ''),
          is_z_user: false,
          is_tera_captain: false
        }))
      );

    if (finalRosterA.length > league.roster_size) {
      throw { statusCode: 400, message: `${coachA.name} excedería el tamaño máximo de plantilla (${league.roster_size}).` };
    }
    if (finalRosterB.length > league.roster_size) {
      throw { statusCode: 400, message: `${coachB.name} excedería el tamaño máximo de plantilla (${league.roster_size}).` };
    }

    validateRosterSpecialLimits(finalRosterA, league);
    validateRosterSpecialLimits(finalRosterB, league);

    return { outA, outB, newBudgetA, newBudgetB };
  }

  public static async proposeTrade(data: {
    league_id: number;
    proposer_coach_id: number;
    receiver_coach_id: number;
    proposer_pokemon_ids: number[];
    receiver_pokemon_ids: number[];
    notes?: string;
  }) {
    if (data.proposer_coach_id === data.receiver_coach_id) {
      throw { statusCode: 400, message: 'No puedes proponer un intercambio contigo mismo.' };
    }

    const fromAIds = Array.from(new Set(data.proposer_pokemon_ids.map(Number).filter(Boolean)));
    const fromBIds = Array.from(new Set(data.receiver_pokemon_ids.map(Number).filter(Boolean)));

    if (fromAIds.length === 0 || fromBIds.length === 0) {
      throw { statusCode: 400, message: 'Cada lado del trade debe incluir al menos 1 Pokémon.' };
    }

    const league = await League.findByPk(data.league_id);
    if (!league) throw { statusCode: 404, message: 'Liga no encontrada.' };

    const proposer = await Coach.findOne({ where: { id: data.proposer_coach_id, league_id: data.league_id } });
    const receiver = await Coach.findOne({ where: { id: data.receiver_coach_id, league_id: data.league_id } });
    if (!proposer || !receiver) {
      throw { statusCode: 404, message: 'Ambos entrenadores deben pertenecer a la liga.' };
    }

    const rosterA = await RosterEntry.findAll({
      where: { coach_id: proposer.id, status: 'ACTIVE' },
      include: [{ model: Pokemon, as: 'Pokemon' }]
    });
    const rosterB = await RosterEntry.findAll({
      where: { coach_id: receiver.id, status: 'ACTIVE' },
      include: [{ model: Pokemon, as: 'Pokemon' }]
    });

    const { outA, outB } = this.validatePostTradeSimulation(
      proposer,
      receiver,
      rosterA,
      rosterB,
      fromAIds,
      fromBIds,
      league
    );

    const t = await sequelize.transaction();
    try {
      const trade = await Trade.create(
        {
          league_id: data.league_id,
          proposer_coach_id: proposer.id,
          receiver_coach_id: receiver.id,
          status: 'PENDING',
          notes: data.notes ? String(data.notes).slice(0, 250) : null
        },
        { transaction: t }
      );

      const items = [
        ...outA.map((e) => ({
          trade_id: trade.id,
          from_coach_id: proposer.id,
          to_coach_id: receiver.id,
          pokemon_id: e.pokemon_id,
          cost_paid: e.cost_paid
        })),
        ...outB.map((e) => ({
          trade_id: trade.id,
          from_coach_id: receiver.id,
          to_coach_id: proposer.id,
          pokemon_id: e.pokemon_id,
          cost_paid: e.cost_paid
        }))
      ];

      await TradeItem.bulkCreate(items, { transaction: t });
      await t.commit();
      return await this.getTradeById(trade.id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  public static async getTradeById(tradeId: number) {
    return await Trade.findByPk(tradeId, {
      include: [
        { model: Coach, as: 'ProposerCoach' },
        { model: Coach, as: 'ReceiverCoach' },
        {
          model: TradeItem,
          as: 'Items',
          include: [
            { model: Pokemon, as: 'Pokemon' },
            { model: Coach, as: 'FromCoach' },
            { model: Coach, as: 'ToCoach' }
          ]
        }
      ]
    });
  }

  public static async getLeagueTrades(leagueId: number) {
    return await Trade.findAll({
      where: { league_id: leagueId },
      include: [
        { model: Coach, as: 'ProposerCoach' },
        { model: Coach, as: 'ReceiverCoach' },
        {
          model: TradeItem,
          as: 'Items',
          include: [
            { model: Pokemon, as: 'Pokemon' },
            { model: Coach, as: 'FromCoach' },
            { model: Coach, as: 'ToCoach' }
          ]
        }
      ],
      order: [['created_at', 'DESC'], ['id', 'DESC']]
    });
  }

  public static async respondToTrade(tradeId: number, action: 'ACCEPT' | 'REJECT' | 'CANCEL') {
    const trade = await Trade.findByPk(tradeId);
    if (!trade) throw { statusCode: 404, message: 'Propuesta de intercambio no encontrada.' };

    if (trade.status !== 'PENDING') {
      throw { statusCode: 400, message: `El intercambio ya fue procesado (${trade.status}).` };
    }

    if (action === 'REJECT') {
      await trade.update({ status: 'REJECTED' });
      return await this.getTradeById(tradeId);
    }

    if (action === 'CANCEL') {
      await trade.update({ status: 'CANCELLED' });
      return await this.getTradeById(tradeId);
    }

    const league = await League.findByPk(trade.league_id);
    if (!league) throw { statusCode: 404, message: 'Liga no encontrada.' };

    if (league.require_trade_approval) {
      await trade.update({ status: 'AWAITING_APPROVAL' });
      return await this.getTradeById(tradeId);
    }

    return await this.executeTrade(tradeId);
  }

  public static async reviewTradeAsCommissioner(tradeId: number, approve: boolean) {
    const trade = await Trade.findByPk(tradeId);
    if (!trade) throw { statusCode: 404, message: 'Intercambio no encontrado.' };

    if (trade.status !== 'AWAITING_APPROVAL' && trade.status !== 'PENDING') {
      throw { statusCode: 400, message: `El intercambio no está pendiente de revisión (${trade.status}).` };
    }

    if (!approve) {
      await trade.update({ status: 'REJECTED' });
      return await this.getTradeById(tradeId);
    }

    return await this.executeTrade(tradeId);
  }

  public static async executeTrade(tradeId: number) {
    const t = await sequelize.transaction();

    try {
      const trade = await Trade.findByPk(tradeId, {
        include: [{ model: TradeItem, as: 'Items', include: [{ model: Pokemon, as: 'Pokemon' }] }],
        transaction: t,
        lock: t.LOCK.UPDATE
      });
      if (!trade) throw { statusCode: 404, message: 'Intercambio no encontrado.' };

      const league = await League.findByPk(trade.league_id, { transaction: t });
      if (!league) throw { statusCode: 404, message: 'Liga no encontrada.' };

      const proposer = await Coach.findByPk(trade.proposer_coach_id, { transaction: t, lock: t.LOCK.UPDATE });
      const receiver = await Coach.findByPk(trade.receiver_coach_id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!proposer || !receiver) throw { statusCode: 404, message: 'Entrenadores no encontrados.' };

      const rosterA = await RosterEntry.findAll({
        where: { coach_id: proposer.id, status: 'ACTIVE' },
        include: [{ model: Pokemon, as: 'Pokemon' }],
        transaction: t
      });
      const rosterB = await RosterEntry.findAll({
        where: { coach_id: receiver.id, status: 'ACTIVE' },
        include: [{ model: Pokemon, as: 'Pokemon' }],
        transaction: t
      });

      const items: TradeItem[] = ((trade as any).Items || []) as TradeItem[];
      const fromAIds = items.filter((i) => i.from_coach_id === proposer.id).map((i) => i.pokemon_id);
      const fromBIds = items.filter((i) => i.from_coach_id === receiver.id).map((i) => i.pokemon_id);

      const { outA, outB, newBudgetA, newBudgetB } = this.validatePostTradeSimulation(
        proposer,
        receiver,
        rosterA,
        rosterB,
        fromAIds,
        fromBIds,
        league
      );

      for (const entry of outA) {
        await entry.update({ status: 'TRADED' }, { transaction: t });
        await RosterEntry.create(
          {
            coach_id: receiver.id,
            pokemon_id: entry.pokemon_id,
            cost_paid: entry.cost_paid,
            is_mega: Boolean(entry.is_mega) || isMegaPokemonName((entry as any).Pokemon?.name || ''),
            is_z_user: false,
            is_tera_captain: false,
            status: 'ACTIVE'
          },
          { transaction: t }
        );
      }

      for (const entry of outB) {
        await entry.update({ status: 'TRADED' }, { transaction: t });
        await RosterEntry.create(
          {
            coach_id: proposer.id,
            pokemon_id: entry.pokemon_id,
            cost_paid: entry.cost_paid,
            is_mega: Boolean(entry.is_mega) || isMegaPokemonName((entry as any).Pokemon?.name || ''),
            is_z_user: false,
            is_tera_captain: false,
            status: 'ACTIVE'
          },
          { transaction: t }
        );
      }

      await proposer.update({ remaining_budget: newBudgetA }, { transaction: t });
      await receiver.update({ remaining_budget: newBudgetB }, { transaction: t });
      await trade.update({ status: 'ACCEPTED' }, { transaction: t });

      const namesA = outA.map((e) => (e as any).Pokemon?.name || `#${e.pokemon_id}`).join(', ');
      const namesB = outB.map((e) => (e as any).Pokemon?.name || `#${e.pokemon_id}`).join(', ');

      await Transaction.create(
        {
          league_id: league.id,
          coach_id: proposer.id,
          counterparty_coach_id: receiver.id,
          type: 'TRADE',
          drop_pokemon_id: outA[0]?.pokemon_id || null,
          add_pokemon_id: outB[0]?.pokemon_id || null,
          trade_id: trade.id,
          notes: `${proposer.name} envía (${namesA}) ↔ ${receiver.name} envía (${namesB})`
        },
        { transaction: t }
      );

      await t.commit();
      return await this.getTradeById(tradeId);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}
