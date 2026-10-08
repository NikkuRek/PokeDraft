import { Router } from 'express';
import authRoutes from './auth.route.js';
import leagueRoutes from './league.route.js';
import coachRoutes from './coach.route.js';
import pokemonRoutes from './pokemon.route.js';
import draftRoutes from './draft.route.js';
import rosterRoutes from './roster.route.js';
import matchRoutes from './match.route.js';
import leaderboardRoutes from './leaderboard.route.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/leagues', leagueRoutes);
router.use('/coaches', coachRoutes);
router.use('/pokemons', pokemonRoutes);
router.use('/draft', draftRoutes);
router.use('/rosters', rosterRoutes);
router.use('/matches', matchRoutes);
router.use('/leaderboard', leaderboardRoutes);

export default router;
