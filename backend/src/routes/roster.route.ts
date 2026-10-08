import { Router } from 'express';
import { body, param } from 'express-validator';
import { RosterController } from '../controllers/roster.controller.js';
import { validateFields } from '../middlewares/validate-fields.middlewares.js';

const router = Router();

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

export default router;
