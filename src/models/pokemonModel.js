const db = require('../config/database');
const apiClient = require('../utils/apiClient');

class PokemonModel {
  // Get all Pokémon directly from API
  static async getAllPokemon() {
    try {
      const response = await apiClient.get('');
      const results = response.results;
      
      return results.map(entry => {
        const urlParts = entry.url.split('/');
        const id = urlParts[urlParts.length - 2];
        return {
          id: parseInt(id, 10),
          name: entry.name
        };
      });
    } catch (error) {
      console.error('Error fetching from PokeAPI:', error);
      throw error;
    }
  }

  // Save user selection to Registro table
  static async saveSelection(userName, selectedPokemon) {
    if (selectedPokemon.length !== 5) {
      throw new Error('Must select exactly 5 Pokémon');
    }

    try {
      // Check if user already registered today
      const [existing] = await db.execute(
        'SELECT id FROM registro WHERE user_name = ? AND DATE(created_at) = CURDATE()',
        [userName]
      );

      if (existing.length > 0) {
        throw new Error('Únicamente puedes registrar 1 equipo por día.');
      }

      const [result] = await db.execute(
        'INSERT INTO registro (user_name, poke1, poke2, poke3, poke4, poke5) VALUES (?, ?, ?, ?, ?, ?)',
        [userName, ...selectedPokemon]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error saving selection to DB:', error);
      throw error;
    }
  }
}

module.exports = PokemonModel;