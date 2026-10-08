import { Router } from 'express';
import { body, param } from 'express-validator';
import { PokemonController } from '../controllers/pokemon.controller.js';
import { validateFields } from '../middlewares/validate-fields.middlewares.js';

const router = Router();

router.get('/', PokemonController.getAll);

router.get(
  '/:id',
  [param('id', 'ID de Pokémon inválido').isInt(), validateFields],
  PokemonController.getById
);

router.post(
  '/sync-pokeapi',
  [
    body('nameOrId', 'nameOrId es requerido').notEmpty(),
    validateFields
  ],
  PokemonController.syncPokeApi
);

export default router;
