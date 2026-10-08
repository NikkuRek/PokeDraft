# 📚 PokeDraft API Documentation

Documentación de los endpoints RESTful de la plataforma PokeDraft Manager.

Base URL local: `http://localhost:3000/api`
Swagger UI interactivo: `http://localhost:3000/api/docs`

---

## 🔐 1. Autenticación (`/api/auth`)

### `POST /api/auth/register`
Registra un nuevo usuario en la plataforma.
* **Body:**
  ```json
  {
    "email": "coach@pokedraft.com",
    "password": "password123",
    "role": "COACH" // "ADMIN" | "COACH"
  }
  ```
* **Respuesta (201):**
  ```json
  {
    "ok": true,
    "data": {
      "user": { "id": 1, "email": "coach@pokedraft.com", "role": "COACH" },
      "token": "eyJhbGciOi..."
    }
  }
  ```

### `POST /api/auth/login`
Inicia sesión y genera token JWT.
* **Body:**
  ```json
  {
    "email": "coach@pokedraft.com",
    "password": "password123"
  }
  ```

---

## 🏆 2. Ligas (`/api/leagues`)

### `GET /api/leagues`
Obtiene todas las ligas registradas con sus participantes.

### `POST /api/leagues`
Crea una nueva liga competitiva.
* **Body:**
  ```json
  {
    "name": "Liga Nacional PokeDraft S1",
    "draft_mode": "POINTS", // "POINTS" | "TIERS"
    "total_budget": 100,
    "roster_size": 10,
    "time_per_pick_seconds": 120
  }
  ```

### `POST /api/leagues/:id/tiers`
Personaliza el coste o tier de un Pokémon en una liga específica.
* **Body:**
  ```json
  {
    "pokemon_id": 445,
    "custom_cost": 20,
    "custom_tier": "Tier 1"
  }
  ```

---

## 👥 3. Entrenadores (`/api/coaches`)

### `POST /api/coaches`
Inscribe a un entrenador en una liga.
* **Body:**
  ```json
  {
    "league_id": 1,
    "name": "Red",
    "team_name": "Kanto Apex"
  }
  ```

---

## 🔍 4. Catálogo Pokémon & PokeAPI (`/api/pokemons`)

### `GET /api/pokemons`
Buscador avanzado con filtros reactivos.
* **Query Params:**
  * `query`: Nombre o número de Pokédex.
  * `type`: Tipo elemental (ej. `dragon`, `water`, `fire`).
  * `leagueId`: ID de liga para calcular los costes personalizados.

### `POST /api/pokemons/sync-pokeapi`
Sincroniza un Pokémon directamente desde PokeAPI obteniendo stats, tipos y sprites oficiales.
* **Body:**
  ```json
  {
    "nameOrId": "garchomp",
    "defaultCost": 19
  }
  ```

---

## 🎯 5. Sala de Draft (`/api/draft`)

### `GET /api/draft/league/:leagueId/state`
Obtiene el estado completo de la sala de draft (turno activo Snake, picks realizados, presupuestos restantes).

### `POST /api/draft/league/:leagueId/pick`
Ejecuta un pick bajo control atómico de turnos, presupuesto y exclusividad (*Unique Pick*).
* **Body:**
  ```json
  {
    "coach_id": 1,
    "pokemon_id": 445
  }
  ```

### `POST /api/draft/league/:leagueId/undo`
Deshace la última selección y devuelve los puntos al entrenador correspondiente.

---

## 🛡️ 6. Plantillas & Free Agency (`/api/rosters`)

### `GET /api/rosters/coach/:coachId`
Devuelve la plantilla del entrenador, la matriz de coberturas defensivas y el código exportable para Pokémon Showdown.

### `POST /api/rosters/coach/:coachId/free-agency`
Realiza un drop y add de Free Agency con ajuste de presupuesto.
* **Body:**
  ```json
  {
    "drop_pokemon_id": 25,
    "add_pokemon_id": 445
  }
  ```

---

## ⚔️ 7. Partidos & Leaderboard (`/api/matches` y `/api/leaderboard`)

### `POST /api/matches/league/:leagueId/generate-fixture`
Genera el calendario Round-Robin de todos contra todos.

### `POST /api/matches/:id/result`
Registra el marcador del partido y las bajas (*Kills*) y muertes (*Deaths*) por cada Pokémon individual.

### `GET /api/leaderboard/league/:leagueId/standings`
Obtiene la tabla de clasificación de entrenadores (PJ, V, D, Dif, Pts).

### `GET /api/leaderboard/league/:leagueId/mvp`
Obtiene el ranking individual de los Pokémon más letales con ratio K/D.
