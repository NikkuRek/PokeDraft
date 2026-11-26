import { Router } from 'express';
import { body, param } from 'express-validator';
import { TradeController } from '../controllers/trade.controller.js';
import { validateFields } from '../middlewares/validate-fields.middlewares.js';
import { requireLeagueCommissioner } from '../middlewares/validate-token.middlewares.js';

const router = Router();

router.get(
  '/league/:leagueId',
  [param('leagueId', 'leagueId inválido').isInt(), validateFields],
  TradeController.getLeagueTrades
);

router.post(
  '/league/:leagueId/propose',
  [
    param('leagueId', 'leagueId inválido').isInt(),
    body('proposer_coach_id', 'proposer_coach_id es requerido').isInt(),
    body('receiver_coach_id', 'receiver_coach_id es requerido').isInt(),
    body('proposer_pokemon_ids', 'proposer_pokemon_ids debe ser un arreglo').isArray({ min: 1 }),
    body('receiver_pokemon_ids', 'receiver_pokemon_ids debe ser un arreglo').isArray({ min: 1 }),
    validateFields
  ],
  TradeController.proposeTrade
);

router.post(
  '/:tradeId/respond',
  [
    param('tradeId', 'tradeId inválido').isInt(),
    body('action', 'action inválida').isIn(['ACCEPT', 'REJECT', 'CANCEL']),
    validateFields
  ],
  TradeController.respondToTrade
);

router.post(
  '/league/:leagueId/:tradeId/review',
  [
    param('leagueId', 'leagueId inválido').isInt(),
    param('tradeId', 'tradeId inválido').isInt(),
    body('approve', 'approve debe ser booleano').isBoolean(),
    validateFields,
    requireLeagueCommissioner
  ],
  TradeController.reviewTradeAsCommissioner
);

export default router;
