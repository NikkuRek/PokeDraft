import { Router } from 'express';
import { body, param } from 'express-validator';
import { CoachController } from '../controllers/coach.controller.js';
import { validateFields } from '../middlewares/validate-fields.middlewares.js';

const router = Router();

router.get(
  '/league/:leagueId',
  [param('leagueId', 'leagueId inválido').isInt(), validateFields],
  CoachController.getCoachesByLeague
);

router.post(
  '/',
  [
    body('league_id', 'league_id es requerido').isInt(),
    body('name', 'El nombre del entrenador es requerido').trim().notEmpty(),
    body('team_name', 'El nombre del equipo es requerido').trim().notEmpty(),
    validateFields
  ],
  CoachController.registerCoach
);

router.put(
  '/league/:leagueId/reorder',
  [
    param('leagueId', 'leagueId inválido').isInt(),
    body('coaches', 'Lista de entrenadores y órdenes requerida').isArray(),
    validateFields
  ],
  CoachController.reorderDraft
);

export default router;
