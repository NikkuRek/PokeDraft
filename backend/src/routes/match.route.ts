import { Router } from 'express';
import { body, param } from 'express-validator';
import { MatchController } from '../controllers/match.controller.js';
import { validateFields } from '../middlewares/validate-fields.middlewares.js';

const router = Router();

router.post(
  '/league/:leagueId/generate-fixture',
  [param('leagueId', 'leagueId inválido').isInt(), validateFields],
  MatchController.generateFixture
);

router.get(
  '/league/:leagueId',
  [param('leagueId', 'leagueId inválido').isInt(), validateFields],
  MatchController.getMatches
);

router.post(
  '/:id/result',
  [
    param('id', 'ID de partido inválido').isInt(),
    body('home_score', 'home_score debe ser un número').isInt({ min: 0 }),
    body('away_score', 'away_score debe ser un número').isInt({ min: 0 }),
    validateFields
  ],
  MatchController.recordResult
);

export default router;
