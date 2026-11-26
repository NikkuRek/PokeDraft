import { fetchPokeApiPokemon, fetchPokeApiSpecies } from '../services/pokeapi.js';
import { IPokeApiDetail, IPokemon } from '../types/index.js';
import {
  escapeHtml,
  formatAbilityName,
  formatDexNumber,
  formatGenerationEs,
  renderPokemonSprite,
  renderTypeBadge,
  statBarPercent,
  statTierClass
} from '../utils/format.js';
import { icon } from '../utils/icons.js';

export interface PokemonDetailModalOptions {
  pokemon: IPokemon | IPokeApiDetail;
  mode: 'draft' | 'pokedex' | 'roster';
  draftAction?: {
    isDrafted: boolean;
    canAfford: boolean;
    canDraftNow: boolean;
    cost: number;
    onDraft: () => Promise<void>;
  };
  syncAction?: {
    defaultCost?: number;
    onSync: (nameOrId: string, cost: number) => Promise<void>;
  };
  showToast: (msg: string, isError?: boolean) => void;
}

let activeModalRequestToken = 0;

function renderStatsRows(p: {
  base_hp: number;
  base_atk: number;
  base_def: number;
  base_spa: number;
  base_spd: number;
  base_spe: number;
}): string {
  const stats = [
    { key: 'HP', val: p.base_hp },
    { key: 'ATK', val: p.base_atk },
    { key: 'DEF', val: p.base_def },
    { key: 'SPA', val: p.base_spa },
    { key: 'SPD', val: p.base_spd },
    { key: 'SPE', val: p.base_spe }
  ];

  return stats
    .map(
      (s) => `
      <div class="stat-row">
        <span class="stat-label">${s.key}</span>
        <div class="stat-track">
          <div class="stat-fill ${statTierClass(s.val)}" style="width: ${statBarPercent(s.val)}%;"></div>
        </div>
        <span class="stat-val">${s.val}</span>
      </div>
    `
    )
    .join('');
}

export const openPokemonDetailModal = async (options: PokemonDetailModalOptions) => {
  const { pokemon, mode, draftAction, syncAction, showToast } = options;
  const modalBackdrop = document.getElementById('modal-container');
  if (!modalBackdrop) return;

  const requestToken = ++activeModalRequestToken;
  modalBackdrop.classList.remove('hidden');

  const costBadge =
    mode === 'draft' && draftAction
      ? `<span class="pokemon-cost-badge">${draftAction.cost} pts</span>`
      : 'cost' in pokemon && typeof pokemon.cost === 'number'
        ? `<span class="pokemon-cost-badge">${pokemon.cost} pts</span>`
        : '';

  const tierBadge =
    'tier' in pokemon && pokemon.tier
      ? `<span class="status-pill status-finished">${escapeHtml(pokemon.tier)}</span>`
      : '';

  modalBackdrop.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
          <span class="dex-number">${formatDexNumber(pokemon.dex_number)}</span>
          <h2>${escapeHtml(pokemon.name)}</h2>
          ${costBadge}
          ${tierBadge}
        </div>
        <button type="button" id="btn-close-spec" class="btn btn-ghost btn-icon" aria-label="Cerrar ficha técnica">
          ${icon('close')}
        </button>
      </div>

      <div class="dex-modal-hero">
        <div class="dex-photo-stage">
          <div class="poke-slot-well poke-slot-well--lg" id="dex-modal-photo-well">
            ${renderPokemonSprite(pokemon)}
          </div>
          <div id="dex-photo-switcher" class="photo-mode-dock segmented-dock hidden" role="group" aria-label="Modo de foto"></div>
        </div>

        <div class="dex-modal-summary">
          <div style="display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap;">
            ${renderTypeBadge(pokemon.type1)}
            ${pokemon.type2 ? renderTypeBadge(pokemon.type2) : ''}
          </div>

          <div id="dex-species-entry" class="neo-well dex-entry-box">
            <span style="color: var(--ink-muted); font-size: 0.84rem;">Consultando ficha oficial en PokeAPI...</span>
          </div>

          <div id="dex-physical-meta" class="dex-meta-grid">
            <div class="neo-well dex-meta-cell">
              <span>BST Total</span>
              <strong id="dex-bst-value" class="mono-num">${pokemon.base_bst}</strong>
            </div>
            <div class="neo-well dex-meta-cell">
              <span>Altura</span>
              <strong id="dex-height-value" class="mono-num">—</strong>
            </div>
            <div class="neo-well dex-meta-cell">
              <span>Peso</span>
              <strong id="dex-weight-value" class="mono-num">—</strong>
            </div>
          </div>

          <div id="dex-abilities-row" class="abilities-row"></div>
        </div>
      </div>

      <div id="dex-stats-container" class="stat-bars-grid" style="margin-top: 1rem;">
        ${renderStatsRows(pokemon)}
      </div>

      <div class="modal-actions">
        <button type="button" id="btn-dex-cry" class="btn btn-secondary btn-sm hidden">
          ${icon('volume')}
          <span>Grito</span>
        </button>
        <div style="flex: 1;"></div>
        ${
          mode === 'pokedex' && syncAction
            ? `
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <label for="dex-sync-cost" class="field-label" style="white-space: nowrap;">Coste (pts):</label>
            <input type="number" id="dex-sync-cost" class="input-well mono-num" style="width: 72px; padding: 0.42rem 0.55rem;" value="${syncAction.defaultCost ?? 10}" min="1" max="50" />
            <button type="button" id="btn-modal-sync-poke" class="btn btn-primary btn-sm">
              ${icon('download')}
              <span>Sincronizar a Liga</span>
            </button>
          </div>
        `
            : ''
        }
        ${
          mode === 'draft' && draftAction
            ? `
          <button
            type="button"
            id="btn-modal-draft-poke"
            class="btn btn-primary"
            ${!draftAction.canDraftNow || draftAction.isDrafted || !draftAction.canAfford ? 'disabled' : ''}
          >
            ${
              draftAction.isDrafted
                ? 'Ya Drafteado'
                : !draftAction.canAfford
                  ? 'Sin Presupuesto'
                  : !draftAction.canDraftNow
                    ? 'Draft Inactivo'
                    : `Draftear (${draftAction.cost} pts)`
            }
          </button>
        `
            : ''
        }
        <button type="button" id="btn-close-spec-foot" class="btn btn-secondary">Cerrar</button>
      </div>
    </div>
  `;

  const closeModal = () => {
    activeModalRequestToken++;
    modalBackdrop.classList.add('hidden');
  };

  document.getElementById('btn-close-spec')?.addEventListener('click', closeModal);
  document.getElementById('btn-close-spec-foot')?.addEventListener('click', closeModal);

  if (mode === 'draft' && draftAction) {
    document.getElementById('btn-modal-draft-poke')?.addEventListener('click', async () => {
      try {
        await draftAction.onDraft();
        closeModal();
      } catch (err: any) {
        showToast(err.message, true);
      }
    });
  }

  if (mode === 'pokedex' && syncAction) {
    document.getElementById('btn-modal-sync-poke')?.addEventListener('click', async () => {
      const costInput = document.getElementById('dex-sync-cost') as HTMLInputElement | null;
      const costVal = Math.max(1, parseInt(costInput?.value || '10', 10) || 10);
      const slug = 'slug' in pokemon ? pokemon.slug : pokemon.name;
      try {
        await syncAction.onSync(slug, costVal);
        closeModal();
      } catch (err: any) {
        showToast(err.message, true);
      }
    });
  }

  // Hydrate live Pokédex artwork, abilities, cry, and Spanish flavor text from PokeAPI
  const query = 'slug' in pokemon && pokemon.slug ? pokemon.slug : pokemon.dex_number || pokemon.name;
  const detail = await fetchPokeApiPokemon(query);
  if (requestToken !== activeModalRequestToken || modalBackdrop.classList.contains('hidden')) {
    return;
  }

  if (!detail) {
    const entryEl = document.getElementById('dex-species-entry');
    if (entryEl) {
      entryEl.innerHTML = `<span style="color: var(--ink-muted); font-size: 0.84rem;">No se pudo obtener información adicional desde PokeAPI para esta especie.</span>`;
    }
    return;
  }

  // Update stats & physical data
  const statsContainer = document.getElementById('dex-stats-container');
  if (statsContainer) statsContainer.innerHTML = renderStatsRows(detail);
  const bstEl = document.getElementById('dex-bst-value');
  if (bstEl) bstEl.textContent = String(detail.base_bst);
  const heightEl = document.getElementById('dex-height-value');
  if (heightEl) heightEl.textContent = `${detail.height_m} m`;
  const weightEl = document.getElementById('dex-weight-value');
  if (weightEl) weightEl.textContent = `${detail.weight_kg} kg`;

  // Abilities
  const abilitiesRow = document.getElementById('dex-abilities-row');
  if (abilitiesRow && detail.abilities.length > 0) {
    abilitiesRow.innerHTML = detail.abilities
      .map(
        (ab) => `
        <span class="ability-chip ${ab.is_hidden ? 'ability-chip--hidden' : ''}">
          <span>${escapeHtml(formatAbilityName(ab.name))}</span>
          ${ab.is_hidden ? '<span class="ability-tag">Oculta</span>' : ''}
        </span>
      `
      )
      .join('');
  }

  // Photo mode switcher (Oficial / Shiny / Animado)
  const switcher = document.getElementById('dex-photo-switcher');
  const photoWell = document.getElementById('dex-modal-photo-well');
  if (switcher && photoWell) {
    const modes: Array<{ id: string; label: string; src: string; pixelated: boolean }> = [
      { id: 'official', label: 'Oficial', src: detail.sprite_url, pixelated: false }
    ];
    if (detail.sprite_shiny_url) {
      modes.push({ id: 'shiny', label: 'Shiny', src: detail.sprite_shiny_url, pixelated: false });
    }
    if (detail.sprite_animated_url) {
      modes.push({ id: 'animated', label: 'Animado', src: detail.sprite_animated_url, pixelated: true });
    }

    if (modes.length > 1) {
      switcher.classList.remove('hidden');
      switcher.innerHTML = modes
        .map(
          (m, idx) => `
          <button type="button" class="btn btn-sm ${idx === 0 ? 'btn-primary' : 'btn-ghost'}" data-photo-mode="${m.id}">
            ${m.label}
          </button>
        `
        )
        .join('');

      switcher.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', () => {
          const modeId = btn.getAttribute('data-photo-mode');
          const chosen = modes.find((m) => m.id === modeId);
          if (!chosen) return;
          photoWell.innerHTML = `<img src="${escapeHtml(chosen.src)}" alt="${escapeHtml(detail.name)}" class="pokemon-sprite ${chosen.pixelated ? 'is-pixelated' : ''}" />`;
          switcher.querySelectorAll('button').forEach((b) => {
            b.className = b === btn ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm';
          });
        });
      });
    }
  }

  // Cry audio button
  const cryBtn = document.getElementById('btn-dex-cry');
  if (cryBtn && detail.cry_url) {
    cryBtn.classList.remove('hidden');
    cryBtn.addEventListener('click', () => {
      const audio = new Audio(detail.cry_url!);
      audio.volume = 0.45;
      audio.play().catch(() => {
        showToast('No se pudo reproducir el grito de Pokédex.', true);
      });
    });
  }

  // Species flavor text & genus in Spanish
  const species = await fetchPokeApiSpecies(detail.species_url || detail.dex_number);
  if (requestToken !== activeModalRequestToken || modalBackdrop.classList.contains('hidden')) {
    return;
  }

  const entryEl = document.getElementById('dex-species-entry');
  if (entryEl) {
    if (species) {
      const genText = formatGenerationEs(species.generation);
      entryEl.innerHTML = `
        <div class="dex-entry-meta">
          <strong>${escapeHtml(species.genus_es)}</strong>
          ${genText ? `<span class="mono-num" style="color: var(--dex-cyan); font-size: 0.74rem;">${escapeHtml(genText)}</span>` : ''}
        </div>
        <p class="dex-entry-text">${escapeHtml(species.flavor_text_es)}</p>
      `;
    } else {
      entryEl.innerHTML = `<span style="color: var(--ink-muted); font-size: 0.84rem;">Entrada descriptiva no disponible.</span>`;
    }
  }
};
