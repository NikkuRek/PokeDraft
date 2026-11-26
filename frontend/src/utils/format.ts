import { getOfficialArtworkUrl } from '../services/pokeapi.js';

const TYPE_LABELS_ES: Record<string, string> = {
  normal: 'Normal',
  fire: 'Fuego',
  water: 'Agua',
  electric: 'Eléctrico',
  grass: 'Planta',
  ice: 'Hielo',
  fighting: 'Lucha',
  poison: 'Veneno',
  ground: 'Tierra',
  flying: 'Volador',
  psychic: 'Psíquico',
  bug: 'Bicho',
  rock: 'Roca',
  ghost: 'Fantasma',
  dragon: 'Dragón',
  dark: 'Siniestro',
  steel: 'Acero',
  fairy: 'Hada'
};

export const ALL_TYPES_ES: Array<{ value: string; label: string }> = Object.entries(TYPE_LABELS_ES).map(
  ([value, label]) => ({ value, label })
);

export function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatDexNumber(dex?: number | null): string {
  const num = Number.isFinite(Number(dex)) ? Math.max(0, Number(dex)) : 0;
  return `#${String(num).padStart(4, '0')}`;
}

export function getTypeLabelEs(type: string): string {
  const slug = type.trim().toLowerCase();
  return TYPE_LABELS_ES[slug] || type;
}

export function renderTypeBadge(type: string, fullWidth = false): string {
  const slug = type.trim().toLowerCase();
  const label = escapeHtml(getTypeLabelEs(slug));
  return `<span class="type-badge type-${escapeHtml(slug)}${fullWidth ? ' type-badge--full' : ''}"><span class="type-dot" aria-hidden="true"></span><span>${label}</span></span>`;
}

export function renderPokemonSprite(
  pokemon: { dex_number?: number; name?: string; sprite_url?: string; sprite_animated_url?: string | null },
  className = 'pokemon-sprite',
  preferAnimated = false,
  options?: { eager?: boolean; size?: number }
): string {
  const artwork = pokemon.sprite_url || (pokemon.dex_number ? getOfficialArtworkUrl(pokemon.dex_number) : '');
  const animated = pokemon.sprite_animated_url || '';
  const src = preferAnimated ? animated || artwork : artwork || animated;
  const fallback = preferAnimated ? artwork : animated || (pokemon.dex_number ? getOfficialArtworkUrl(pokemon.dex_number) : '');
  const alt = escapeHtml(pokemon.name || 'Pokémon');
  const isPixelated = Boolean(preferAnimated && animated);
  const pixelCls = isPixelated ? ' is-pixelated' : '';
  const size = options?.size ?? (className.includes('mini-sprite') ? 32 : 74);
  const loadingAttr = options?.eager ? 'eager' : 'lazy';
  const priorityAttr = options?.eager ? ' fetchpriority="high"' : '';
  const fallbackAttr =
    fallback && fallback !== src
      ? ` onerror="if(this.dataset.fb!=='1'){this.dataset.fb='1';this.classList.remove('is-pixelated');this.src='${escapeHtml(fallback)}';}"`
      : '';

  return `<img src="${escapeHtml(src)}" alt="${alt}" width="${size}" height="${size}" loading="${loadingAttr}" decoding="async"${priorityAttr} class="${escapeHtml(className)}${pixelCls}"${fallbackAttr} />`;
}

export function formatAbilityName(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatGenerationEs(slug: string): string {
  const raw = slug.replace('generation-', '').toUpperCase();
  return raw ? `Gen ${raw}` : '';
}

export function getLeagueStatusMeta(status: string): { label: string; cls: string } {
  switch (status) {
    case 'SETUP':
      return { label: 'Preparación', cls: 'status-setup' };
    case 'DRAFTING':
      return { label: 'Draft en Vivo', cls: 'status-drafting' };
    case 'IN_PROGRESS':
      return { label: 'En Curso', cls: 'status-active' };
    case 'FINISHED':
      return { label: 'Finalizada', cls: 'status-finished' };
    default:
      return { label: status, cls: 'status-setup' };
  }
}

export function statBarPercent(val: number): number {
  const clamped = Math.max(0, Math.min(180, Number(val) || 0));
  return Math.round((clamped / 180) * 100);
}

export function statTierClass(val: number): string {
  const n = Number(val) || 0;
  if (n >= 120) return 'stat-elite';
  if (n >= 90) return 'stat-high';
  if (n >= 60) return 'stat-mid';
  return 'stat-low';
}
