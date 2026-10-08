import { Router } from 'express';
import { body, param } from 'express-validator';
import { DraftController } from '../controllers/draft.controller.js';
import { validateFields } from '../middlewares/validate-fields.middlewares.js';

const router = Router();

router.post(
  '/league/:leagueId/start',
  [param('leagueId', 'leagueId inválido').isInt(), validateFields],
  DraftController.startDraft
);

router.get(
  '/league/:leagueId/state',
  [param('leagueId', 'leagueId inválido').isInt(), validateFields],
  DraftController.getDraftState
);

router.post(
  '/league/:leagueId/pick',
  [
    param('leagueId', 'leagueId inválido').isInt(),
    body('coach_id', 'coach_id es requerido').isInt(),
    body('pokemon_id', 'pokemon_id es requerido').isInt(),
    validateFields
  ],
  DraftController.makePick
);

router.post(
  '/league/:leagueId/undo',
  [param('leagueId', 'leagueId inválido').isInt(), validateFields],
  DraftController.undoLastPick
);

export default router;
