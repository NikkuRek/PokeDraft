import { Router } from 'express';
import { body, param } from 'express-validator';
import { LeagueController } from '../controllers/league.controller.js';
import { validateFields } from '../middlewares/validate-fields.middlewares.js';
import { optionalJWT, requireLeagueCommissioner } from '../middlewares/validate-token.middlewares.js';

const router = Router();

router.get('/', LeagueController.getAllLeagues);

router.get(
  '/:id',
  [param('id', 'ID de liga inválido').isInt(), validateFields],
  LeagueController.getLeagueById
);

router.post(
  '/',
  [
    optionalJWT,
    body('name', 'El nombre de la liga es obligatorio').trim().notEmpty(),
    validateFields
  ],
  LeagueController.createLeague
);

router.patch(
  '/:id/rules',
  [param('id', 'ID de liga inválido').isInt(), validateFields, requireLeagueCommissioner],
  LeagueController.updateLeagueRules
);

router.get(
  '/:id/tiers',
  [param('id', 'ID de liga inválido').isInt(), validateFields],
  LeagueController.getLeagueTiers
);

router.post(
  '/:id/tiers',
  [
    param('id', 'ID de liga inválido').isInt(),
    body('pokemon_id', 'pokemon_id es requerido').isInt(),
    body('custom_cost', 'custom_cost debe ser un número entero').isInt(),
    validateFields,
    requireLeagueCommissioner
  ],
  LeagueController.setCustomPokemonTier
);

export default router;
