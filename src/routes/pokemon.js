const express = require('express');
const PokemonController = require('../controllers/pokemonController');

const router = express.Router();

// GET /api/pokemon - Get all Pokémon
router.get('/pokemon', PokemonController.getPokemon);


// POST /api/registro - Save user selection
router.post('/registro', PokemonController.saveSelection);

module.exports = router;