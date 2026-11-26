import { IPokeApiDetail, IPokeApiSpecies, IPokemon } from '../types/index.js';

const BASE_URL = 'https://pokeapi.co/api/v2';
const STORAGE_PREFIX = 'pokedraft_pokeapi_v1:';

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

const pokemonCache = new Map<string, IPokeApiDetail>();
const speciesCache = new Map<string, IPokeApiSpecies>();
const typeListCache = new Map<string, string[]>();

export function normalizePokeApiSlug(nameOrId: string | number): string {
  const raw = String(nameOrId).trim().toLowerCase();
  if (/^\d+$/.test(raw)) {
    return String(parseInt(raw, 10));
  }
  const clean = raw.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return POKEAPI_FORM_ALIASES[clean] || clean;
}

export function getOfficialArtworkUrl(dexNumber: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexNumber}.png`;
}

function formatDisplayName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function readSessionCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeSessionCache(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

export async function fetchPokeApiPokemon(nameOrId: string | number): Promise<IPokeApiDetail | null> {
  const slug = normalizePokeApiSlug(nameOrId);
  if (!slug) return null;

  const memHit = pokemonCache.get(slug);
  if (memHit) return memHit;

  const storageHit = readSessionCache<IPokeApiDetail>(`poke:${slug}`);
  if (storageHit) {
    pokemonCache.set(slug, storageHit);
    pokemonCache.set(String(storageHit.dex_number), storageHit);
    return storageHit;
  }

  try {
    const res = await fetch(`${BASE_URL}/pokemon/${encodeURIComponent(slug)}`);
    if (!res.ok) return null;

    const data: any = await res.json();
    const statsMap: Record<string, number> = {};
    let totalBst = 0;

    (data.stats || []).forEach((s: any) => {
      const val = Number(s.base_stat) || 0;
      statsMap[s.stat?.name] = val;
      totalBst += val;
    });

    const type1 = data.types?.[0]?.type?.name || 'normal';
    const type2 = data.types?.[1]?.type?.name || null;

    const officialArtwork =
      data.sprites?.other?.['official-artwork']?.front_default ||
      data.sprites?.other?.home?.front_default ||
      data.sprites?.front_default ||
      getOfficialArtworkUrl(data.id);

    const officialShiny =
      data.sprites?.other?.['official-artwork']?.front_shiny ||
      data.sprites?.other?.home?.front_shiny ||
      data.sprites?.front_shiny ||
      null;

    const homeSprite = data.sprites?.other?.home?.front_default || null;

    const animatedSprite =
      data.sprites?.other?.showdown?.front_default ||
      data.sprites?.versions?.['generation-v']?.['black-white']?.animated?.front_default ||
      null;

    const abilities = (data.abilities || []).map((a: any) => ({
      name: String(a.ability?.name || ''),
      is_hidden: Boolean(a.is_hidden)
    }));

    const detail: IPokeApiDetail = {
      dex_number: Number(data.id),
      slug: String(data.name),
      name: formatDisplayName(String(data.name)),
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
      sprite_shiny_url: officialShiny,
      sprite_home_url: homeSprite,
      sprite_animated_url: animatedSprite,
      height_m: Number(((Number(data.height) || 0) / 10).toFixed(1)),
      weight_kg: Number(((Number(data.weight) || 0) / 10).toFixed(1)),
      abilities,
      cry_url: data.cries?.latest || data.cries?.legacy || null,
      species_url: data.species?.url || null
    };

    pokemonCache.set(slug, detail);
    pokemonCache.set(detail.slug, detail);
    pokemonCache.set(String(detail.dex_number), detail);
    writeSessionCache(`poke:${slug}`, detail);

    return detail;
  } catch (err) {
    console.warn(`[PokeAPI] Error consultando "${slug}":`, err);
    return null;
  }
}

export async function fetchPokeApiSpecies(speciesUrlOrId: string | number): Promise<IPokeApiSpecies | null> {
  const url = String(speciesUrlOrId).startsWith('http')
    ? String(speciesUrlOrId)
    : `${BASE_URL}/pokemon-species/${normalizePokeApiSlug(speciesUrlOrId)}`;

  const cacheKey = url;
  const memHit = speciesCache.get(cacheKey);
  if (memHit) return memHit;

  const storageHit = readSessionCache<IPokeApiSpecies>(`species:${cacheKey}`);
  if (storageHit) {
    speciesCache.set(cacheKey, storageHit);
    return storageHit;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: any = await res.json();

    const genera: any[] = data.genera || [];
    const genusObj = genera.find((g) => g.language?.name === 'es') || genera.find((g) => g.language?.name === 'en');

    const entries: any[] = data.flavor_text_entries || [];
    const esEntries = entries.filter((f) => f.language?.name === 'es');
    const enEntries = entries.filter((f) => f.language?.name === 'en');
    const chosenEntry =
      (esEntries.length > 0 ? esEntries[esEntries.length - 1] : null) ||
      (enEntries.length > 0 ? enEntries[enEntries.length - 1] : null);

    const flavorText = chosenEntry?.flavor_text
      ? String(chosenEntry.flavor_text).replace(/[\f\n\r]+/g, ' ').replace(/\s+/g, ' ').trim()
      : 'Sin descripción de Pokédex disponible.';

    const species: IPokeApiSpecies = {
      genus_es: genusObj?.genus || 'Especie Pokémon',
      flavor_text_es: flavorText,
      generation: String(data.generation?.name || '')
    };

    speciesCache.set(cacheKey, species);
    writeSessionCache(`species:${cacheKey}`, species);
    return species;
  } catch {
    return null;
  }
}

export async function fetchPokeApiCatalogPage(
  limit = 24,
  offset = 0
): Promise<{ count: number; items: IPokeApiDetail[] }> {
  const res = await fetch(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
  if (!res.ok) {
    throw new Error('No se pudo cargar el catálogo desde PokeAPI.');
  }
  const data: any = await res.json();
  const entries: Array<{ name: string }> = data.results || [];
  const resolved = await Promise.all(entries.map((entry) => fetchPokeApiPokemon(entry.name)));
  return {
    count: Number(data.count) || 0,
    items: resolved.filter((item): item is IPokeApiDetail => item !== null)
  };
}

export async function fetchPokeApiByType(
  type: string,
  limit = 24,
  offset = 0
): Promise<{ count: number; items: IPokeApiDetail[] }> {
  const slug = type.trim().toLowerCase();
  let names = typeListCache.get(slug);

  if (!names) {
    const res = await fetch(`${BASE_URL}/type/${encodeURIComponent(slug)}`);
    if (!res.ok) {
      throw new Error(`No se pudo consultar el tipo "${type}" en PokeAPI.`);
    }
    const data: any = await res.json();
    names = (data.pokemon || [])
      .map((entry: any) => String(entry.pokemon?.name || ''))
      .filter(Boolean);
    typeListCache.set(slug, names!);
  }

  const slice = names!.slice(offset, offset + limit);
  const resolved = await Promise.all(slice.map((n) => fetchPokeApiPokemon(n)));
  return {
    count: names!.length,
    items: resolved.filter((item): item is IPokeApiDetail => item !== null)
  };
}

export async function enrichPokemonListFromPokeApi(
  pokemons: IPokemon[],
  concurrency = 6
): Promise<IPokemon[]> {
  if (pokemons.length === 0) return pokemons;

  const result = [...pokemons];
  const needsEnrichment = result
    .map((p, idx) => ({ p, idx }))
    .filter(({ p }) => !p.sprite_url || !p.sprite_url.includes('pokeapi') || !p.base_bst);

  if (needsEnrichment.length === 0) return result;

  let cursor = 0;
  const workerCount = Math.min(concurrency, needsEnrichment.length);

  const workers = Array.from({ length: workerCount }, async () => {
    while (cursor < needsEnrichment.length) {
      const current = needsEnrichment[cursor++];
      const query = current.p.name || current.p.dex_number;
      const detail = await fetchPokeApiPokemon(query);
      if (detail) {
        result[current.idx] = {
          ...current.p,
          dex_number: detail.dex_number || current.p.dex_number,
          type1: current.p.type1 || detail.type1,
          type2: current.p.type2 !== undefined ? current.p.type2 : detail.type2,
          base_hp: current.p.base_hp || detail.base_hp,
          base_atk: current.p.base_atk || detail.base_atk,
          base_def: current.p.base_def || detail.base_def,
          base_spa: current.p.base_spa || detail.base_spa,
          base_spd: current.p.base_spd || detail.base_spd,
          base_spe: current.p.base_spe || detail.base_spe,
          base_bst: current.p.base_bst || detail.base_bst,
          sprite_url: detail.sprite_url,
          sprite_animated_url: detail.sprite_animated_url || current.p.sprite_animated_url
        };
      }
    }
  });

  await Promise.all(workers);
  return result;
}
