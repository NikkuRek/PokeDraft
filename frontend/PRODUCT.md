# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Grupos de amigos y comunidades competitivas de Pokémon Draft League (entrenadores y administradores/comisionados de liga). Operan principalmente en escritorio durante la sesión de Draft Snake en vivo (habitualmente en llamada de Discord) y consultan plantillas, jornadas y estadísticas desde el móvil durante la semana.

## Product Purpose

PokeDraft Manager es una plataforma web en español para crear, configurar y administrar ligas competitivas de Pokémon Draft League de principio a fin: gestión de ligas (por puntos o por tiers), sala de Draft Snake en vivo con control atómico de turnos y presupuestos, inspección de plantillas con matriz de coberturas defensivas de 18 tipos y exportación a Pokémon Showdown, mercado de Free Agency (drop/add), calendario Round-Robin con registro de marcadores y bajas por Pokémon, y tabla de clasificación junto al ranking MVP (ratio K/D). El éxito consiste en que los entrenadores ejecuten sus picks en vivo sin ambigüedad sobre turnos, puntos restantes o legalidad, y auditen sus equipos y enfrentamientos con claridad durante toda la temporada.

## Positioning

Consola operativa especializada en Pokémon Draft League que reúne en una sola interfaz en español el control atómico de Draft Snake, análisis defensivo elemental de 18 tipos en tiempo real, exportación directa a Pokémon Showdown y telemetría individual K/D de MVP.

## Operating Context

- **Draft en vivo (escenario insignia):** escritorio junto a llamada de voz (Discord); lectura densa y rápida de número de Pokédex, tipos elementales, estadísticas base, coste en puntos, presupuesto restante por entrenador, orden Snake e historial de picks, con búsqueda/filtrado instantáneo y acción de deshacer pick.
- **Seguimiento semanal:** escritorio y móvil para revisar plantillas activas, debilidades defensivas, realizar cambios de Free Agency, registrar resultados y kills por Pokémon tras cada combate en Pokémon Showdown y consultar la clasificación y el ranking MVP.
- **Arquitectura técnica:** SPA en Vite + TypeScript vanilla (`frontend/`) conectada vía `/api` a una API REST Express + Sequelize + MySQL (`backend/`), preparada para despliegue en Vercel.

## Capabilities and Constraints

- Preservar el 100% de los contratos de la API REST existente (`/api/auth`, `/api/leagues`, `/api/coaches`, `/api/pokemons`, `/api/draft`, `/api/rosters`, `/api/matches`, `/api/leaderboard`), así como `frontend/src/services/api.ts` y `frontend/src/types/index.ts`.
- Mantener toda la interfaz, etiquetas, notificaciones toast y estados vacíos/de error en español.
- Cubrir en el rediseño las 5 vistas completas (`Ligas`, `Sala de Draft`, `Plantillas & Coberturas`, `Calendario / Batallas`, `Clasificación & MVP`), la barra de navegación global y todos los modales (`Crear Liga`, `Inscribir Coach`, `Cuenta/Auth`, `Exportar Showdown`, `Free Agency`, `Registrar Resultado`), priorizando la **Sala de Draft** como vista insignia.
- Mantener el stack actual (Vite + TypeScript vanilla sin migrar de framework).
- Los sprites de Pokémon se cargan dinámicamente desde las URLs provistas por el backend/PokeAPI (`sprite_url`, `sprite_animated_url`).

## Brand Commitments

- Nombre del producto: **PokeDraft Manager**.
- Compromiso visual vinculante definido por el usuario: deshacer por completo el apartado visual anterior y rehacerlo desde cero con un frontend acorde a la Pokédex del juego, con estilo neomorfismo moderno, negro y competitivo tipo gaming.

## Evidence on Hand

- Catálogo real y datos estructurados definidos en `backend/API.md`, `backend/DB.md` y `backend/src/data/custom-pokemon-costs.json` (50 Pokémon competitivos con costes/tiers, número de Pokédex nacional `dex_number`, 6 estadísticas base `base_hp`..`base_spe`, `base_bst`, tipos primarios/secundarios, sprites oficiales/animados, `is_tera_captain`, y estadísticas K/D por combate).
- No existen testimonios, métricas comerciales ni fotografía propia; nunca inventar reclamos comerciales ni datos promocionales ficticios.

## Product Principles

- **Claridad de turno inmediata:** En la Sala de Draft, el entrenador activo, la ronda/pick, el presupuesto restante y los Pokémon fichables deben leerse en el primer vistazo.
- **Datos competitivos útiles por encima del adorno:** Priorizar estadísticas reales de Pokédex (Dex `#`, tipos, stats base/BST, coberturas defensivas y ratio K/D) que aceleren la toma de decisiones tácticas.
- **Consola en escritorio, compañera ágil en móvil:** Soportar densidad informativa y flujos multipanel en escritorio durante el draft sin romper legibilidad ni operabilidad táctil en móvil.
- **Cero regresiones funcionales:** Cada flujo desde crear liga e inscribir entrenadores hasta exportar a Showdown y guardar estadísticas de jornada debe seguir funcionando de forma idéntica contra el backend.

## Accessibility & Inclusion

- Mantener contraste legible sobre superficies oscuras neomórficas, estados de foco visibles para teclado, indicadores de estado que no dependan únicamente del color y áreas táctiles cómodas en pantallas móviles.
