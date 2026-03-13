const PokemonModel = require('../models/pokemonModel');

class PokemonController {
  // Get all Pokémon
  static async getPokemon(req, res) {
    try {
      const pokemon = await PokemonModel.getAllPokemon();
      res.json(pokemon);
    } catch (error) {
      console.error('Error getting Pokémon:', error);
      res.status(500).json({ error: 'Failed to fetch Pokémon data' });
    }
  }

  // Save user selection
  static async saveSelection(req, res) {
    try {
      const { userName, selectedPokemon } = req.body;

      if (!userName || !Array.isArray(selectedPokemon) || selectedPokemon.length !== 5) {
        return res.status(400).json({ error: 'Invalid input: userName and exactly 5 selectedPokemon required' });
      }

      const id = await PokemonModel.saveSelection(userName, selectedPokemon);
      res.json({ message: 'Selection saved successfully', id });
    } catch (error) {
      console.error('Error saving selection:', error.message);
      const isValidationError = error.message === 'Únicamente puedes registrar 1 equipo por día.' || error.message === 'Must select exactly 5 Pokémon';
      res.status(isValidationError ? 400 : 500).json({ error: error.message || 'Failed to save selection' });
    }
  }
}

module.exports = PokemonController;