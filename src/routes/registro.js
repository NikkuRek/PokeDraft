const express = require('express');
const RegistroController = require('../controllers/registroController');

const router = express.Router();

// GET /api/registros - Get all registros
router.get('/registros', RegistroController.getRegistros);

// DELETE /api/registros - Delete all registros
router.delete('/registros', RegistroController.deleteRegistros);

module.exports = router;
