import { IPokemon } from '../interfaces/index.js';

const POKEAPI_FORM_ALIASES: Record<string, string> = {
  'ogerpon-wellspring': 'ogerpon-wellspring-mask',
  'ogerpon-hearthflame': 'ogerpon-hearthflame-mask',
  'ogerpon-cornerstone': 'ogerpon-cornerstone-mask',
  urshifu: 'urshifu-single-strike',
  landorus: 'landorus-incarnate',
  tornadus: 'tornadus-incarnate',
  thundurus: 'thundurus-incarnate',
  enamorus: 'enamorus-incarnate',
  mimikyu: 'mimikyu-disguised',
  aegislash: 'aegislash-shield',
  toxtricity: 'toxtricity-amped',
  palafin: 'palafin-zero',
  indeedee: 'indeedee-male',
  basculegion: 'basculegion-male',
  maushold: 'maushold-family-of-four',
  dudunsparce: 'dudunsparce-two-segment',
  giratina: 'giratina-altered',
  shaymin: 'shaymin-land',
  keldeo: 'keldeo-ordinary',
  meloetta: 'meloetta-aria',
  lycanroc: 'lycanroc-midday',
  darmanitan: 'darmanitan-standard',
  wishiwashi: 'wishiwashi-solo',
  eiscue: 'eiscue-ice',
  morpeko: 'morpeko-full-belly',
  deoxys: 'deoxys-normal'
};

export class PokeApiService {
  private static readonly BASE_URL = 'https://pokeapi.co/api/v2/pokemon';

  /**
   * Obtiene la información enriquecida de un Pokémon desde PokeAPI
   * @param nameOrId Nombre o ID del Pokémon en Pokédex
   * @param defaultCost Coste en puntos asignado (por defecto o desde Excel)
   * @param defaultTier Tier asignado
   */
  public static async fetchPokemonDetails(
    nameOrId: string | number,
    defaultCost: number = 10,
    defaultTier: string = 'Tier 3'
  ): Promise<Partial<IPokemon> | null> {
    const cleanQuery = String(nameOrId).toLowerCase().trim().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
    if (!cleanQuery) return null;
    const resolvedSlug = POKEAPI_FORM_ALIASES[cleanQuery] || cleanQuery;

    try {
      const response = await fetch(`${this.BASE_URL}/${resolvedSlug}`);
      if (!response.ok) {
        console.warn(`[PokeApiService] No se encontró el Pokémon: "${resolvedSlug}" en PokeAPI`);
        return null;
      }

      const data: any = await response.json();

      // Stats map
      const statsMap: Record<string, number> = {};
      let totalBst = 0;
      data.stats.forEach((s: any) => {
        const val = s.base_stat;
        statsMap[s.stat.name] = val;
        totalBst += val;
      });

      // Types
      const type1 = data.types[0]?.type?.name || 'normal';
      const type2 = data.types[1]?.type?.name || null;

      // Sprites: Official artwork + Showdown animated sprite + default pixel sprite
      const officialArtwork =
        data.sprites?.other?.['official-artwork']?.front_default ||
        data.sprites?.other?.home?.front_default ||
        data.sprites?.front_default ||
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.id}.png`;

      const animatedShowdown =
        data.sprites?.other?.showdown?.front_default ||
        data.sprites?.versions?.['generation-v']?.['black-white']?.animated?.front_default ||
        null;

      // Format clean display name (capitalize words)
      const formattedName = data.name
        .split('-')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      return {
        dex_number: data.id,
        name: formattedName,
        type1,
        type2,
        base_hp: statsMap['hp'] || 50,
        base_atk: statsMap['attack'] || 50,
        base_def: statsMap['defense'] || 50,
        base_spa: statsMap['special-attack'] || 50,
        base_spd: statsMap['special-defense'] || 50,
        base_spe: statsMap['speed'] || 50,
        base_bst: totalBst,
        sprite_url: officialArtwork,
        sprite_animated_url: animatedShowdown,
        default_cost: defaultCost,
        default_tier: defaultTier
      };
    } catch (error) {
      console.error(`[PokeApiService] Error consultando PokeAPI para "${cleanQuery}":`, error);
      return null;
    }
  }
}
