import { Router } from 'express';
import { body, param } from 'express-validator';
import { DraftController } from '../controllers/draft.controller.js';
import { validateFields } from '../middlewares/validate-fields.middlewares.js';
import { requireLeagueCommissioner } from '../middlewares/validate-token.middlewares.js';

const router = Router();

router.get(
  '/league/:leagueId/stream',
  [param('leagueId', 'leagueId inválido').isInt(), validateFields],
  DraftController.streamDraftEvents
);

router.post(
  '/league/:leagueId/start',
  [param('leagueId', 'leagueId inválido').isInt(), validateFields, requireLeagueCommissioner],
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
  [param('leagueId', 'leagueId inválido').isInt(), validateFields, requireLeagueCommissioner],
  DraftController.undoLastPick
);

router.post(
  '/league/:leagueId/pause',
  [param('leagueId', 'leagueId inválido').isInt(), validateFields, requireLeagueCommissioner],
  DraftController.pauseDraft
);

router.post(
  '/league/:leagueId/resume',
  [param('leagueId', 'leagueId inválido').isInt(), validateFields, requireLeagueCommissioner],
  DraftController.resumeDraft
);

router.post(
  '/league/:leagueId/force-pick',
  [
    param('leagueId', 'leagueId inválido').isInt(),
    body('pokemon_id', 'pokemon_id es requerido').isInt(),
    validateFields,
    requireLeagueCommissioner
  ],
  DraftController.forcePick
);

router.post(
  '/league/:leagueId/skip-turn',
  [param('leagueId', 'leagueId inválido').isInt(), validateFields, requireLeagueCommissioner],
  DraftController.skipTurn
);

router.get(
  '/league/:leagueId/queue/:coachId',
  [param('leagueId', 'leagueId inválido').isInt(), param('coachId', 'coachId inválido').isInt(), validateFields],
  DraftController.getCoachQueue
);

router.post(
  '/league/:leagueId/queue/:coachId',
  [
    param('leagueId', 'leagueId inválido').isInt(),
    param('coachId', 'coachId inválido').isInt(),
    body('pokemon_id', 'pokemon_id es requerido').isInt(),
    validateFields
  ],
  DraftController.addToQueue
);

router.put(
  '/league/:leagueId/queue/:coachId/reorder',
  [
    param('leagueId', 'leagueId inválido').isInt(),
    param('coachId', 'coachId inválido').isInt(),
    body('pokemon_ids', 'pokemon_ids debe ser un arreglo').isArray(),
    validateFields
  ],
  DraftController.reorderQueue
);

router.delete(
  '/league/:leagueId/queue/:coachId/:pokemonId',
  [
    param('leagueId', 'leagueId inválido').isInt(),
    param('coachId', 'coachId inválido').isInt(),
    param('pokemonId', 'pokemonId inválido').isInt(),
    validateFields
  ],
  DraftController.removeFromQueue
);

export default router;
