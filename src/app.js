const express = require('express');
const cors = require('cors');
const path = require('path');
const pokemonRoutes = require('./routes/pokemon');
const registroRoutes = require('./routes/registro');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api', pokemonRoutes);
app.use('/api', registroRoutes);

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/index.html'));
});

// Serve the admin HTML page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin.html'));
});

module.exports = app;