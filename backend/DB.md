# 🗄️ PokeDraft Database Schema (Sequelize / MySQL Aiven)

Diccionario de datos del modelo relacional para MySQL alojado en Aiven.

---

## 1. Tabla `users`
| Campo | Tipo | Nulo | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | INT AUTO_INCREMENT | NO | Clave primaria |
| `email` | VARCHAR(150) | NO | Email único |
| `password` | VARCHAR(255) | NO | Contraseña hasheada (bcrypt) |
| `role` | ENUM('ADMIN', 'COACH') | NO | Rol de permisos |
| `created_at` | TIMESTAMP | NO | Fecha de creación |
| `updated_at` | TIMESTAMP | NO | Fecha de actualización |

---

## 2. Tabla `leagues`
| Campo | Tipo | Nulo | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | INT AUTO_INCREMENT | NO | Clave primaria |
| `admin_id` | INT | NO | FK a `users.id` |
| `name` | VARCHAR(100) | NO | Nombre de la liga |
| `draft_mode` | ENUM('POINTS', 'TIERS') | NO | Modo de draft |
| `total_budget` | INT | NO | Presupuesto por coach (ej. 100) |
| `roster_size` | INT | NO | Cantidad de Pokémon por plantilla (ej. 10) |
| `time_per_pick_seconds` | INT | NO | Temporizador de turno |
| `status` | ENUM('SETUP', 'DRAFTING', 'IN_PROGRESS', 'FINISHED') | NO | Estado actual |
| `current_pick_turn` | INT | NO | Contador de turno global del draft |

---

## 3. Tabla `coaches`
| Campo | Tipo | Nulo | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | INT AUTO_INCREMENT | NO | Clave primaria |
| `league_id` | INT | NO | FK a `leagues.id` |
| `user_id` | INT | SI | FK opcional a `users.id` |
| `name` | VARCHAR(100) | NO | Nombre del entrenador |
| `team_name` | VARCHAR(100) | NO | Nombre del equipo |
| `draft_order` | INT | NO | Posición en el orden de draft |
| `remaining_budget` | INT | NO | Presupuesto restante |

---

## 4. Tabla `pokemons`
| Campo | Tipo | Nulo | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | INT AUTO_INCREMENT | NO | Clave primaria |
| `dex_number` | INT | NO | Número en la Pokédex nacional |
| `name` | VARCHAR(100) | NO | Nombre formateado |
| `type1` | VARCHAR(30) | NO | Tipo elemental primario |
| `type2` | VARCHAR(30) | SI | Tipo elemental secundario |
| `base_hp` | INT | NO | HP base |
| `base_atk` | INT | NO | Ataque físico base |
| `base_def` | INT | NO | Defensa física base |
| `base_spa` | INT | NO | Ataque especial base |
| `base_spd` | INT | NO | Defensa especial base |
| `base_spe` | INT | NO | Velocidad base |
| `base_bst` | INT | NO | Total de estadísticas base (BST) |
| `sprite_url` | VARCHAR(255) | NO | Artwork oficial de alta resolución |
| `sprite_animated_url` | VARCHAR(255) | SI | Sprite animado (Showdown/Gen 5) |
| `default_cost` | INT | NO | Coste en puntos sugerido |
| `default_tier` | VARCHAR(20) | SI | Tier sugerido |

---

## 5. Tabla `roster_entries`
| Campo | Tipo | Nulo | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | INT AUTO_INCREMENT | NO | Clave primaria |
| `coach_id` | INT | NO | FK a `coaches.id` |
| `pokemon_id` | INT | NO | FK a `pokemons.id` |
| `cost_paid` | INT | NO | Coste pagado en el pick |
| `is_tera_captain` | BOOLEAN | NO | Si es Capitán Teracristal |
| `status` | ENUM('ACTIVE', 'DROPPED', 'TRADED') | NO | Estado en la plantilla |

---

## 6. Tabla `draft_picks`
| Campo | Tipo | Nulo | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | INT AUTO_INCREMENT | NO | Clave primaria |
| `league_id` | INT | NO | FK a `leagues.id` |
| `coach_id` | INT | NO | FK a `coaches.id` |
| `pokemon_id` | INT | NO | FK a `pokemons.id` |
| `round` | INT | NO | Número de ronda |
| `overall_pick` | INT | NO | Número de pick global |
| `picked_at` | TIMESTAMP | NO | Fecha y hora del pick |

---

## 7. Tabla `matches`
| Campo | Tipo | Nulo | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | INT AUTO_INCREMENT | NO | Clave primaria |
| `league_id` | INT | NO | FK a `leagues.id` |
| `week` | INT | NO | Número de jornada / semana |
| `home_coach_id` | INT | NO | FK a `coaches.id` (Local) |
| `away_coach_id` | INT | NO | FK a `coaches.id` (Visitante) |
| `home_score` | INT | NO | Marcador local |
| `away_score` | INT | NO | Marcador visitante |
| `replay_url` | VARCHAR(255) | SI | Enlace al Replay de Pokémon Showdown |
| `status` | ENUM('PENDING', 'COMPLETED') | NO | Estado del encuentro |

---

## 8. Tabla `match_pokemon_stats`
| Campo | Tipo | Nulo | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | INT AUTO_INCREMENT | NO | Clave primaria |
| `match_id` | INT | NO | FK a `matches.id` |
| `coach_id` | INT | NO | FK a `coaches.id` |
| `pokemon_id` | INT | NO | FK a `pokemons.id` |
| `kills` | INT | NO | Bajas provocadas en el partido |
| `died` | BOOLEAN | NO | Si fue debilitado en el partido |
