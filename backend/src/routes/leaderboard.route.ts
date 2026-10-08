import { Router } from 'express';
import { param } from 'express-validator';
import { LeaderboardController } from '../controllers/leaderboard.controller.js';
import { validateFields } from '../middlewares/validate-fields.middlewares.js';

const router = Router();

router.get(
  '/league/:leagueId/standings',
  [param('leagueId', 'leagueId inválido').isInt(), validateFields],
  LeaderboardController.getStandings
);

router.get(
  '/league/:leagueId/mvp',
  [param('leagueId', 'leagueId inválido').isInt(), validateFields],
  LeaderboardController.getPokemonMvpRanking
);

export default router;
