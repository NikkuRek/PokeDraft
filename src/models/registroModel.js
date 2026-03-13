const db = require('../config/database');

class RegistroModel {
  static async getAllRegistros() {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM registro ORDER BY created_at DESC'
      );
      return rows;
    } catch (error) {
      console.error('Error fetching registros from DB:', error);
      throw error;
    }
  }

  static async deleteAllRegistros() {
    try {
      const [result] = await db.execute('TRUNCATE TABLE registro');
      return result;
    } catch (error) {
      console.error('Error deleting registros from DB:', error);
      throw error;
    }
  }
}

module.exports = RegistroModel;
