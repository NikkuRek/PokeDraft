import { Router } from 'express';
import { body, param } from 'express-validator';
import { RosterController } from '../controllers/roster.controller.js';
import { validateFields } from '../middlewares/validate-fields.middlewares.js';

const router = Router();

router.get(
  '/league/:leagueId/transactions',
  [param('leagueId', 'leagueId inválido').isInt(), validateFields],
  RosterController.getLeagueTransactions
);

router.get(
  '/coach/:coachId',
  [param('coachId', 'coachId inválido').isInt(), validateFields],
  RosterController.getCoachRoster
);

router.post(
  '/coach/:coachId/free-agency',
  [
    param('coachId', 'coachId inválido').isInt(),
    body('drop_pokemon_id', 'drop_pokemon_id es requerido').isInt(),
    body('add_pokemon_id', 'add_pokemon_id es requerido').isInt(),
    validateFields
  ],
  RosterController.freeAgencyDropAdd
);

router.patch(
  '/coach/:coachId/entry/:entryId/designations',
  [
    param('coachId', 'coachId inválido').isInt(),
    param('entryId', 'entryId inválido').isInt(),
    validateFields
  ],
  RosterController.updateEntryDesignations
);

export default router;
