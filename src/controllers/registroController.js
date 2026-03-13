const RegistroModel = require('../models/registroModel');

class RegistroController {
  static async getRegistros(req, res) {
    try {
      const registros = await RegistroModel.getAllRegistros();
      res.json(registros);
    } catch (error) {
      console.error('Error getting registros:', error);
      res.status(500).json({ error: 'Failed to fetch registros data' });
    }
  }

  static async deleteRegistros(req, res) {
    try {
      await RegistroModel.deleteAllRegistros();
      res.json({ message: 'All records deleted successfully' });
    } catch (error) {
      console.error('Error deleting registros:', error);
      res.status(500).json({ error: 'Failed to delete registros' });
    }
  }
}

module.exports = RegistroController;
