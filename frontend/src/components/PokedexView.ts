import { api } from '../services/api.js';
import {
  fetchPokeApiByType,
  fetchPokeApiCatalogPage,
  fetchPokeApiPokemon
} from '../services/pokeapi.js';
import { IPokeApiDetail } from '../types/index.js';
import {
  ALL_TYPES_ES,
  escapeHtml,
  formatDexNumber,
  renderPokemonSprite,
  renderTypeBadge
} from '../utils/format.js';
import { icon } from '../utils/icons.js';
import { openPokemonDetailModal } from './PokemonDetailModal.js';

const PAGE_SIZE = 24;

function suggestCompetitiveCost(bst: number): number {
  if (bst >= 600) return 18;
  if (bst >= 550) return 15;
  if (bst >= 500) return 12;
  if (bst >= 450) return 9;
  return 6;
}

export const renderPokedexView = async (
  container: HTMLElement,
  showToast: (msg: string, isError?: boolean) => void
) => {
  container.innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">${icon('book')}<span>Pokédex Nacional en Vivo</span></h1>
        <p class="subtitle">Fotos oficiales, estadísticas base, habilidades y descripciones en tiempo real desde PokeAPI con sincronización directa a tu liga</p>
      </div>
    </div>

    <div class="filter-dock">
      <form id="pokedex-search-form" class="pokedex-search-form">
        <div class="search-field-wrap">
          <span class="search-icon">${icon('search')}</span>
          <input
            type="text"
            id="pokedex-search-input"
            class="input-search"
            placeholder="Buscar cualquier Pokémon en PokeAPI (ej. garchomp, ogerpon-wellspring, 150)..."
            aria-label="Buscar especie en PokeAPI por nombre o número"
          />
        </div>
        <button type="submit" class="btn btn-primary btn-sm">
          ${icon('search')}
          <span>Buscar</span>
        </button>
      </form>

      <select id="pokedex-type-select" class="select-input" aria-label="Filtrar Pokédex por tipo elemental">
        <option value="">Todos los Tipos</option>
        ${ALL_TYPES_ES.map((t) => `<option value="${t.value}">${t.label}</option>`).join('')}
      </select>

      <button type="button" id="btn-pokedex-reset" class="btn btn-secondary btn-sm">
        ${icon('undo')}
        <span>Restablecer</span>
      </button>
    </div>

    <div class="draft-catalog-meta">
      <span id="pokedex-status-label">Conectando con PokeAPI...</span>
      <span id="pokedex-page-indicator" class="mono-num"></span>
    </div>

    <div id="pokedex-grid" class="pokemon-grid">
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
    </div>

    <div id="pokedex-pagination" class="pokedex-pagination hidden">
      <button type="button" id="btn-pokedex-prev" class="btn btn-secondary btn-sm">
        ${icon('chevronLeft')}
        <span>Anterior</span>
      </button>
      <span id="pokedex-pagination-info" class="mono-num" style="font-size: 0.84rem; color: var(--ink-secondary);"></span>
      <button type="button" id="btn-pokedex-next" class="btn btn-secondary btn-sm">
        <span>Siguiente</span>
        ${icon('chevronRight')}
      </button>
    </div>
  `;

  let currentPage = 0;
  let totalCount = 0;
  let activeType = '';
  let activeSearch = '';
  let currentItems: IPokeApiDetail[] = [];

  const syncToLeagueCatalog = async (nameOrId: string, cost: number) => {
    const synced = await api.syncPokemonFromPokeApi(nameOrId, cost);
    showToast(`${synced.name} sincronizado al catálogo de la liga (${cost} pts).`);
  };

  const renderCards = (items: IPokeApiDetail[]) => {
    const grid = document.getElementById('pokedex-grid');
    const statusLabel = document.getElementById('pokedex-status-label');
    const pageIndicator = document.getElementById('pokedex-page-indicator');
    const pagination = document.getElementById('pokedex-pagination');
    const paginationInfo = document.getElementById('pokedex-pagination-info');
    const prevBtn = document.getElementById('btn-pokedex-prev') as HTMLButtonElement | null;
    const nextBtn = document.getElementById('btn-pokedex-next') as HTMLButtonElement | null;

    if (!grid) return;
    currentItems = items;

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="card empty-panel" style="grid-column: 1 / -1;">
          <div class="empty-panel-icon">${icon('search')}</div>
          <h3>Especie no encontrada en PokeAPI</h3>
          <p class="subtitle">Verifica el nombre en inglés o el número de Pokédex nacional (ej. <code>dragapult</code>, <code>ogerpon-wellspring</code>, <code>445</code>).</p>
        </div>
      `;
      if (statusLabel) statusLabel.textContent = '0 resultados en PokeAPI';
      if (pageIndicator) pageIndicator.textContent = '';
      pagination?.classList.add('hidden');
      return;
    }

    if (statusLabel) {
      statusLabel.textContent = activeSearch
        ? `Resultado directo desde PokeAPI para "${activeSearch}"`
        : activeType
          ? `Mostrando ${items.length} de ${totalCount} especies de este tipo (PokeAPI)`
          : `Mostrando ${items.length} de ${totalCount} entradas oficiales en PokeAPI`;
    }

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    if (pageIndicator) {
      pageIndicator.textContent = activeSearch ? 'Búsqueda directa' : `Página ${currentPage + 1} / ${totalPages}`;
    }

    if (pagination) {
      if (activeSearch || totalPages <= 1) {
        pagination.classList.add('hidden');
      } else {
        pagination.classList.remove('hidden');
        if (paginationInfo) paginationInfo.textContent = `Página ${currentPage + 1} de ${totalPages}`;
        if (prevBtn) prevBtn.disabled = currentPage <= 0;
        if (nextBtn) nextBtn.disabled = currentPage + 1 >= totalPages;
      }
    }

    grid.innerHTML = items
      .map((p) => {
        const suggestedCost = suggestCompetitiveCost(p.base_bst);
        return `
          <article class="pokemon-card">
            <div class="pokemon-card-top">
              <span class="dex-number">${formatDexNumber(p.dex_number)}</span>
              <span class="pokemon-cost-badge">${suggestedCost} pts sug.</span>
            </div>

            <div class="poke-slot-well">
              ${renderPokemonSprite(p)}
            </div>

            <button type="button" class="pokemon-name-btn btn-pokedex-inspect" data-slug="${escapeHtml(p.slug)}">
              <span>${escapeHtml(p.name)}</span>
            </button>

            <div class="pokemon-types-row">
              ${renderTypeBadge(p.type1)}
              ${p.type2 ? renderTypeBadge(p.type2) : ''}
            </div>

            <div class="pokemon-telemetry-strip">
              <span>BST <strong>${p.base_bst}</strong></span>
              <span>SPE <strong>${p.base_spe}</strong></span>
            </div>

            <div class="pokemon-card-actions">
              <button type="button" class="btn btn-secondary btn-sm btn-pokedex-inspect" data-slug="${escapeHtml(p.slug)}" style="flex: 1;">
                ${icon('info')}
                <span>Ficha</span>
              </button>
              <button type="button" class="btn btn-primary btn-sm btn-pokedex-sync" data-slug="${escapeHtml(p.slug)}" data-cost="${suggestedCost}" title="Importar a la base de datos de ligas">
                ${icon('plus')}
                <span>Liga</span>
              </button>
            </div>
          </article>
        `;
      })
      .join('');

    grid.querySelectorAll('.btn-pokedex-inspect').forEach((btn) => {
      btn.addEventListener('click', () => {
        const slug = btn.getAttribute('data-slug') || '';
        const item = currentItems.find((x) => x.slug === slug);
        if (!item) return;
        openPokemonDetailModal({
          pokemon: item,
          mode: 'pokedex',
          syncAction: {
            defaultCost: suggestCompetitiveCost(item.base_bst),
            onSync: syncToLeagueCatalog
          },
          showToast
        });
      });
    });

    grid.querySelectorAll('.btn-pokedex-sync').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const slug = btn.getAttribute('data-slug') || '';
        const cost = parseInt(btn.getAttribute('data-cost') || '10', 10) || 10;
        try {
          await syncToLeagueCatalog(slug, cost);
        } catch (err: any) {
          showToast(err.message, true);
        }
      });
    });
  };

  const loadPokedexPage = async () => {
    const grid = document.getElementById('pokedex-grid');
    if (grid) {
      grid.innerHTML = `
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      `;
    }

    try {
      if (activeSearch) {
        const item = await fetchPokeApiPokemon(activeSearch);
        totalCount = item ? 1 : 0;
        renderCards(item ? [item] : []);
        return;
      }

      if (activeType) {
        const res = await fetchPokeApiByType(activeType, PAGE_SIZE, currentPage * PAGE_SIZE);
        totalCount = res.count;
        renderCards(res.items);
        return;
      }

      const res = await fetchPokeApiCatalogPage(PAGE_SIZE, currentPage * PAGE_SIZE);
      totalCount = res.count;
      renderCards(res.items);
    } catch (err: any) {
      showToast(err.message || 'Error al consultar PokeAPI.', true);
    }
  };

  document.getElementById('pokedex-search-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('pokedex-search-input') as HTMLInputElement | null;
    activeSearch = (input?.value || '').trim();
    currentPage = 0;
    await loadPokedexPage();
  });

  document.getElementById('pokedex-type-select')?.addEventListener('change', async (e) => {
    activeType = (e.target as HTMLSelectElement).value;
    activeSearch = '';
    const input = document.getElementById('pokedex-search-input') as HTMLInputElement | null;
    if (input) input.value = '';
    currentPage = 0;
    await loadPokedexPage();
  });

  document.getElementById('btn-pokedex-reset')?.addEventListener('click', async () => {
    activeSearch = '';
    activeType = '';
    currentPage = 0;
    const input = document.getElementById('pokedex-search-input') as HTMLInputElement | null;
    const select = document.getElementById('pokedex-type-select') as HTMLSelectElement | null;
    if (input) input.value = '';
    if (select) select.value = '';
    await loadPokedexPage();
  });

  document.getElementById('btn-pokedex-prev')?.addEventListener('click', async () => {
    if (currentPage > 0) {
      currentPage--;
      await loadPokedexPage();
    }
  });

  document.getElementById('btn-pokedex-next')?.addEventListener('click', async () => {
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    if (currentPage + 1 < totalPages) {
      currentPage++;
      await loadPokedexPage();
    }
  });

  await loadPokedexPage();
};
