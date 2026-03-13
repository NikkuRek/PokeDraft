# PokéDraft

A web application to select 5 Pokémon from the Pokédex and save the selection to a SQLite database.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Initialize the database:
   ```
   node init-db.js
   ```

3. Start the server:
   ```
   npm start
   ```

4. Open `http://localhost:3000` in your browser.

5. If no Pokémon data is loaded, the app will automatically fetch from PokeAPI (this may take time due to rate limits).

## Features

- Display list of Pokémon with images.
- Real-time search.
- Select up to 5 Pokémon in order.
- Save selection with user name to database.