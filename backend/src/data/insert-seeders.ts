import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/sequelize.config.js';
import { User, League, Coach, Pokemon } from '../models/index.js';
import { PokeApiService } from '../services/pokeapi.service.js';

export const runSeeders = async () => {
  console.log('🌱 Iniciando ejecución de seeders de PokeDraft...');

  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✅ Esquema de base de datos sincronizado.');

    // 1. Create Default Users (Admin and Coach)
    let adminUser = await User.findOne({ where: { email: 'admin@pokedraft.com' } });
    if (!adminUser) {
      const salt = await bcrypt.genSalt(10);
      const adminPassword = await bcrypt.hash('admin123', salt);
      adminUser = await User.create({
        email: 'admin@pokedraft.com',
        password: adminPassword,
        role: 'ADMIN'
      });
    }

    let sampleCoachUser = await User.findOne({ where: { email: 'coach@pokedraft.com' } });
    if (!sampleCoachUser) {
      const salt = await bcrypt.genSalt(10);
      const coachPassword = await bcrypt.hash('coach123', salt);
      sampleCoachUser = await User.create({
        email: 'coach@pokedraft.com',
        password: coachPassword,
        role: 'COACH'
      });
    }

    console.log('✅ Usuarios maestros creados/verificados (admin@pokedraft.com / coach@pokedraft.com).');

    // 2. Load custom Pokémon names and costs from JSON (or Excel source)
    const costsPath = path.join(__dirname, 'custom-pokemon-costs.json');
    if (fs.existsSync(costsPath)) {
      const rawData = fs.readFileSync(costsPath, 'utf-8');
      const pokemonList: Array<{ name: string; cost: number; tier?: string }> = JSON.parse(rawData);

      console.log(`📡 Sincronizando catálogo con PokeAPI para ${pokemonList.length} Pokémon...`);

      for (const item of pokemonList) {
        const details = await PokeApiService.fetchPokemonDetails(item.name, item.cost, item.tier || 'Tier 3');
        if (details && details.name && details.dex_number) {
          const existing = await Pokemon.findOne({
            where: {
              dex_number: details.dex_number
            }
          });

          if (existing) {
            await existing.update({ default_cost: item.cost, default_tier: item.tier || 'Tier 3' });
          } else {
            await Pokemon.create(details as any);
            console.log(`  ✓ Insertado: #${details.dex_number} ${details.name} (${item.cost} pts)`);
          }
        }
      }
      console.log('✅ Catálogo de Pokémon poblado con éxito desde PokeAPI.');
    }

    // 3. Create a Demo League if none exists
    const leagueCount = await League.count();
    if (leagueCount === 0) {
      const demoLeague = await League.create({
        admin_id: adminUser.id,
        name: 'Liga PokeDraft Champions S1',
        draft_mode: 'POINTS',
        total_budget: 100,
        roster_size: 10,
        time_per_pick_seconds: 90,
        status: 'SETUP',
        current_pick_turn: 1
      });

      // Add 4 sample coaches
      const sampleCoaches = [
        { name: 'Red', team_name: 'Kanto Apex', draft_order: 1 },
        { name: 'Cynthia', team_name: 'Sinnoh Garchomps', draft_order: 2 },
        { name: 'Steven', team_name: 'Hoenn Metagrosses', draft_order: 3 },
        { name: 'Leon', team_name: 'Galar Invincibles', draft_order: 4 }
      ];

      for (const sc of sampleCoaches) {
        await Coach.create({
          league_id: demoLeague.id,
          user_id: sc.name === 'Red' ? sampleCoachUser.id : null,
          name: sc.name,
          team_name: sc.team_name,
          draft_order: sc.draft_order,
          remaining_budget: 100
        });
      }

      console.log('✅ Liga de demostración y 4 entrenadores creados exitosamente.');
    }

    console.log('🎉 Seeders completados con éxito.');
  } catch (error) {
    console.error('❌ Error ejecutando seeders:', error);
  } finally {
    process.exit(0);
  }
};

runSeeders();
