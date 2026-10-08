# ⚔️ PokeDraft Manager (Monorepo)

Plataforma integral y moderna para la administración de ligas competitivas de **Pokémon Draft League** (PokeDraft).

---

## 🏛️ Estructura del Monorepo

```text
PokeDraft/
├── backend/                      # API RESTful (Node.js + TypeScript + Express + Sequelize + Aiven MySQL)
│   ├── src/
│   │   ├── config/               # Sequelize SSL Aiven & Swagger UI
│   │   ├── controllers/          # Controladores HTTP desacoplados
│   │   ├── services/             # Lógica de Draft Snake, PokeAPI, Coberturas y Leaderboards
│   │   ├── models/               # Modelos relacionales Sequelize
│   │   ├── routes/               # API Gateway modular
│   │   ├── middlewares/          # JWT, Roles, Validaciones y Turn Guard
│   │   ├── docs/                 # OpenAPI Swagger YAML
│   │   └── data/                 # Seeders con catálogo enriquecido desde PokeAPI
│   └── API.md / DB.md            # Documentación técnica de endpoints y base de datos
│
└── frontend/                     # Aplicación Web (Vite + TypeScript + Modern Esports UI)
    ├── src/
    │   ├── components/           # Lobby, Sala de Draft en vivo, Roster Hub, Partidos, Leaderboard
    │   ├── services/             # Cliente API tipado
    │   └── styles/               # CSS Variables con modo oscuro e insignias de tipos elementales
```

---

## 🚀 Inicio Rápido (Desarrollo Local)

### 1. Requisitos Previos
* **Node.js**: Versión `v22.11.0` (o compatible fijada vía `.nvmrc`).
* **MySQL**: Instancia local o conexión a **Aiven MySQL** (soporta SSL).

### 2. Instalación de Dependencias
```bash
npm install
```

### 3. Configuración de Variables de Entorno
Crea o revisa el archivo `backend/.env` (basado en `backend/.env.example`):
```env
PORT=3000
NODE_ENV=development

# Conexión MySQL Aiven
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pokedraft_db
DB_SSL=false

# Autenticación JWT
JWT_SECRET=super_secret_jwt_key_pokedraft_2026
JWT_EXPIRES_IN=7d
```

### 4. Población Inicial con PokeAPI (Seeders)
```bash
npm run seed
```
> **Nota:** El script de seeders lee tu lista de nombres y costes en `backend/src/data/custom-pokemon-costs.json` (que puedes reemplazar con los datos de tu Excel) y consulta automáticamente PokeAPI para descargar stats, tipos y sprites oficiales y animados.

### 5. Iniciar Servidores de Desarrollo
```bash
npm run dev
```
* **Frontend:** `http://localhost:5173`
* **Backend API:** `http://localhost:3000/api`
* **Swagger Docs:** `http://localhost:3000/api/docs`

---

## ☁️ Despliegue en Vercel

El proyecto incluye `vercel.json` configurado en la raíz para desplegar de forma serverless el backend en `/api` y el frontend estático generado por Vite.