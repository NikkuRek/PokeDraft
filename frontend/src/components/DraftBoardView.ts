import { api } from '../services/api.js';
import { enrichPokemonListFromPokeApi, fetchPokeApiPokemon } from '../services/pokeapi.js';
import { IDraftState, IPokeApiDetail, IPokemon } from '../types/index.js';
import {
  ALL_TYPES_ES,
  escapeHtml,
  formatDexNumber,
  renderPokemonSprite,
  renderTypeBadge
} from '../utils/format.js';
import { icon } from '../utils/icons.js';
import { openPokemonDetailModal } from './PokemonDetailModal.js';

export const renderDraftBoardView = async (
  container: HTMLElement,
  leagueId: number | null,
  showToast: (msg: string, isError?: boolean) => void
) => {
  if (!leagueId) {
    container.innerHTML = `
      <div class="card empty-panel">
        <div class="empty-panel-icon">${icon('draft')}</div>
        <h2>Selecciona una Liga</h2>
        <p class="subtitle">Elige una liga desde el selector superior o crea una nueva en la vista de Ligas para acceder a la sala de draft.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div id="draft-turn-container">
      <div class="skeleton-card" style="height: 112px; margin-bottom: 1.35rem;"></div>
    </div>

    <div class="mobile-draft-tabs segmented-dock" role="tablist" aria-label="Paneles de la sala de draft">
      <button type="button" id="btn-mobile-pane-catalog" class="btn btn-primary btn-sm" role="tab" aria-selected="true">
        ${icon('draft')}
        <span>Catálogo</span>
      </button>
      <button type="button" id="btn-mobile-pane-sidebar" class="btn btn-ghost btn-sm" role="tab" aria-selected="false">
        ${icon('rosters')}
        <span>Entrenadores & Picks</span>
      </button>
    </div>

    <div class="draft-layout">
      <section id="draft-catalog-pane" aria-label="Catálogo de Pokémon del Draft">
        <div class="filter-dock">
          <div class="search-field-wrap">
            <span class="search-icon">${icon('search')}</span>
            <input
              type="text"
              id="poke-search"
              class="input-search"
              placeholder="Buscar por nombre o # Pokédex..."
              aria-label="Buscar Pokémon por nombre o número de Pokédex"
            />
          </div>

          <select id="poke-type-filter" class="select-input" aria-label="Filtrar por tipo elemental">
            <option value="">Todos los Tipos</option>
            ${ALL_TYPES_ES.map((t) => `<option value="${t.value}">${t.label}</option>`).join('')}
          </select>

          <select id="poke-sort" class="select-input" aria-label="Ordenar catálogo">
            <option value="cost-desc">Mayor coste</option>
            <option value="cost-asc">Menor coste</option>
            <option value="bst-desc">Mayor BST</option>
            <option value="spe-desc">Mayor Velocidad</option>
            <option value="dex-asc">Orden Pokédex</option>
          </select>

          <label class="toggle-chip" for="poke-only-available">
            <input type="checkbox" id="poke-only-available" />
            <span>Solo fichables</span>
          </label>

          <button type="button" id="btn-import-pokeapi" class="btn btn-secondary btn-sm">
            ${icon('download')}
            <span>Importar PokeAPI</span>
          </button>
        </div>

        <div class="draft-catalog-meta">
          <span id="draft-results-count">Cargando catálogo Pokédex...</span>
          <span id="draft-league-mode" class="mono-num"></span>
        </div>

        <div id="pokemon-grid" class="pokemon-grid">
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
        </div>
      </section>

      <aside id="draft-sidebar-pane" class="draft-sidebar is-mobile-hidden" aria-label="Estado de entrenadores e historial">
        <div class="card">
          <h3 class="panel-heading">
            <span class="panel-heading-left">${icon('rosters')}<span>Entrenadores & Presupuesto</span></span>
          </h3>
          <div id="coaches-status-list" class="coaches-stack"></div>
        </div>

        <div class="card picks-history-panel">
          <h3 class="panel-heading">
            <span class="panel-heading-left">${icon('clock')}<span>Historial de Picks</span></span>
            <span id="picks-total-count" class="mono-num" style="font-size: 0.78rem; color: var(--ink-muted);">0</span>
          </h3>
          <div id="picks-history-list" class="picks-history-list"></div>
        </div>
      </aside>
    </div>
  `;

  let currentDraftState: IDraftState | null = null;
  let allPokemons: IPokemon[] = [];

  const openSpecModal = (pokemon: IPokemon, isDrafted: boolean, canAfford: boolean, canDraftNow: boolean) => {
    openPokemonDetailModal({
      pokemon,
      mode: 'draft',
      draftAction: {
        isDrafted,
        canAfford,
        canDraftNow,
        cost: pokemon.cost,
        onDraft: async () => {
          const activeCoach = currentDraftState?.active_turn?.coach;
          if (!activeCoach) return;
          await api.makeDraftPick(leagueId, activeCoach.id, pokemon.id);
          showToast(`${pokemon.name} incorporado a ${activeCoach.team_name}.`);
          await loadDraftData();
        }
      },
      showToast
    });
  };

  const openImportPokeApiModal = () => {
    const modalBackdrop = document.getElementById('modal-container');
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove('hidden');

    let previewPokemon: IPokeApiDetail | null = null;

    modalBackdrop.innerHTML = `
      <div class="modal-content modal-content--compact">
        <div class="modal-header">
          <h2>Importar Especie desde PokeAPI</h2>
          <button type="button" id="btn-close-import-top" class="btn btn-ghost btn-icon" aria-label="Cerrar ventana">
            ${icon('close')}
          </button>
        </div>
        <p class="subtitle" style="margin-bottom: 1rem;">
          Busca cualquier Pokémon por nombre o número de Pokédex para obtener su foto y estadísticas oficiales e incorporarlo al catálogo.
        </p>

        <form id="form-import-search" class="pokedex-search-form" style="margin-bottom: 1rem;">
          <div class="search-field-wrap">
            <span class="search-icon">${icon('search')}</span>
            <input type="text" id="import-pokeapi-query" class="input-search" required placeholder="Ej. garchomp, ogerpon-wellspring, 150" />
          </div>
          <button type="submit" class="btn btn-secondary btn-sm">Consultar</button>
        </form>

        <div id="import-pokeapi-preview" class="neo-well" style="padding: 1rem; margin-bottom: 1rem; text-align: center; color: var(--ink-muted); font-size: 0.86rem;">
          Ingresa un nombre o # Dex para previsualizar.
        </div>

        <form id="form-import-confirm" style="display: flex; flex-direction: column; gap: 1rem;">
          <div class="field-group">
            <label class="field-label" for="import-pokeapi-cost">Coste en Puntos</label>
            <input type="number" id="import-pokeapi-cost" class="input-well mono-num" value="12" min="1" max="50" />
          </div>
          <div class="modal-actions" style="margin-top: 0;">
            <button type="button" id="btn-cancel-import" class="btn btn-secondary">Cancelar</button>
            <button type="submit" id="btn-confirm-import" class="btn btn-primary" disabled>
              ${icon('download')}
              <span>Sincronizar Pokémon</span>
            </button>
          </div>
        </form>
      </div>
    `;

    const closeModal = () => modalBackdrop.classList.add('hidden');
    document.getElementById('btn-close-import-top')?.addEventListener('click', closeModal);
    document.getElementById('btn-cancel-import')?.addEventListener('click', closeModal);

    document.getElementById('form-import-search')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = (document.getElementById('import-pokeapi-query') as HTMLInputElement).value.trim();
      const previewEl = document.getElementById('import-pokeapi-preview');
      const confirmBtn = document.getElementById('btn-confirm-import') as HTMLButtonElement | null;
      if (!query || !previewEl) return;

      previewEl.innerHTML = `<span style="color: var(--ink-secondary);">Consultando PokeAPI...</span>`;
      previewPokemon = await fetchPokeApiPokemon(query);

      if (!previewPokemon) {
        previewEl.innerHTML = `<span style="color: var(--dex-crimson);">No se encontró "${escapeHtml(query)}" en PokeAPI.</span>`;
        if (confirmBtn) confirmBtn.disabled = true;
        return;
      }

      previewEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem; text-align: left;">
          <div class="poke-slot-well" style="margin: 0; width: 76px; height: 76px; flex-shrink: 0;">
            ${renderPokemonSprite(previewPokemon)}
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.35rem;">
            <div style="display: flex; align-items: center; gap: 0.45rem;">
              <span class="dex-number">${formatDexNumber(previewPokemon.dex_number)}</span>
              <strong>${escapeHtml(previewPokemon.name)}</strong>
            </div>
            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
              ${renderTypeBadge(previewPokemon.type1)}
              ${previewPokemon.type2 ? renderTypeBadge(previewPokemon.type2) : ''}
            </div>
            <div class="mono-num" style="font-size: 0.78rem; color: var(--ink-secondary);">
              BST ${previewPokemon.base_bst} · SPE ${previewPokemon.base_spe}
            </div>
          </div>
        </div>
      `;
      if (confirmBtn) confirmBtn.disabled = false;
    });

    document.getElementById('form-import-confirm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!previewPokemon) return;
      const cost = parseInt((document.getElementById('import-pokeapi-cost') as HTMLInputElement).value, 10) || 10;
      try {
        await api.syncPokemonFromPokeApi(previewPokemon.slug, cost);
        showToast(`${previewPokemon.name} importado desde PokeAPI.`);
        closeModal();
        await loadDraftData();
      } catch (err: any) {
        showToast(err.message, true);
      }
    });
  };

  const renderTurnBanner = (state: IDraftState) => {
    const turnContainer = document.getElementById('draft-turn-container');
    if (!turnContainer) return;

    if (state.league.status === 'SETUP') {
      turnContainer.innerHTML = `
        <div class="turn-deck turn-deck--setup">
          <div class="turn-deck-top">
            <div>
              <h1 style="font-size: 1.45rem; color: var(--dex-gold);">Fase de Preparación — ${escapeHtml(state.league.name)}</h1>
              <p class="subtitle">Verifica los entrenadores inscritos y pulsa iniciar cuando la sala esté lista para el Snake Draft.</p>
            </div>
            <button type="button" id="btn-start-draft-now" class="btn btn-primary">
              ${icon('bolt')}
              <span>Iniciar Draft Snake</span>
            </button>
          </div>
        </div>
      `;
      document.getElementById('btn-start-draft-now')?.addEventListener('click', async () => {
        try {
          await api.startDraft(leagueId);
          showToast('El Draft Snake ha comenzado.');
          await loadDraftData();
        } catch (e: any) {
          showToast(e.message, true);
        }
      });
      return;
    }

    if (state.league.status === 'IN_PROGRESS' || state.league.status === 'FINISHED') {
      turnContainer.innerHTML = `
        <div class="turn-deck turn-deck--done">
          <div class="turn-deck-top">
            <div>
              <h1 style="font-size: 1.4rem; color: #6ee7b7;">Fase de Draft Completada — ${escapeHtml(state.league.name)}</h1>
              <p class="subtitle">Todas las plantillas han quedado cerradas. Consulta coberturas, exporta a Showdown o genera el calendario.</p>
            </div>
            <span class="status-pill status-active">
              <span class="status-dot" aria-hidden="true"></span>
              <span>Plantillas Listas</span>
            </span>
          </div>
        </div>
      `;
      return;
    }

    if (state.active_turn) {
      const { coach, round, pickInRound } = state.active_turn;
      const upcoming = (state.schedule || []).filter((s) => !s.isCompleted).slice(0, 6);

      turnContainer.innerHTML = `
        <div class="turn-deck">
          <div class="turn-deck-top">
            <div class="turn-identity">
              <span class="turn-beacon" aria-hidden="true"></span>
              <div>
                <h1 class="turn-coach-title">
                  Turno Activo: ${escapeHtml(coach.name)}
                  <span class="turn-team-sub">(${escapeHtml(coach.team_name)})</span>
                </h1>
              </div>
            </div>

            <div class="turn-telemetry-row">
              <div class="neo-well telemetry-well">
                <span>Ronda</span>
                <strong>R${round}</strong>
              </div>
              <div class="neo-well telemetry-well">
                <span>Pick</span>
                <strong>#${pickInRound} (${state.league.current_pick_turn} Global)</strong>
              </div>
              <div class="neo-well telemetry-well telemetry-well--gold">
                <span>Presupuesto</span>
                <strong>${coach.remaining_budget} pts</strong>
              </div>
              <button
                type="button"
                id="btn-undo-pick"
                class="btn btn-secondary btn-sm"
                ${state.picks.length === 0 ? 'disabled' : ''}
              >
                ${icon('undo')}
                <span>Deshacer Pick</span>
              </button>
            </div>
          </div>

          ${
            upcoming.length > 0
              ? `
            <div class="snake-strip" aria-label="Próximos turnos Snake">
              <span class="snake-strip-label">Orden Snake</span>
              ${upcoming
                .map(
                  (slot, idx) => `
                  <div class="snake-node ${idx === 0 ? 'is-current' : ''}">
                    <span class="snake-node-code">R${slot.round}·P${slot.overallPick}</span>
                    <span>${escapeHtml(slot.coachName)}</span>
                  </div>
                `
                )
                .join('')}
            </div>
          `
              : ''
          }
        </div>
      `;

      document.getElementById('btn-undo-pick')?.addEventListener('click', async () => {
        try {
          await api.undoDraftPick(leagueId);
          showToast('Última elección deshecha.');
          await loadDraftData();
        } catch (err: any) {
          showToast(err.message, true);
        }
      });
    }
  };

  const renderCoachesStatus = (state: IDraftState) => {
    const list = document.getElementById('coaches-status-list');
    if (!list) return;

    const totalSlots = Math.max(1, state.league.roster_size || 10);

    list.innerHTML = state.coaches
      .map((c) => {
        const isActive = state.active_turn?.coach.id === c.id;
        const rosterCount = c.Roster ? c.Roster.length : 0;
        const pips = Array.from({ length: totalSlots }, (_, idx) => {
          return `<span class="poke-pip ${idx < rosterCount ? 'is-filled' : ''}"></span>`;
        }).join('');

        return `
          <div class="coach-row ${isActive ? 'is-active' : ''}">
            <div class="coach-row-top">
              <div>
                <div class="coach-name">
                  ${isActive ? '<span class="dex-led dex-led--red" aria-hidden="true"></span>' : ''}
                  <span>${escapeHtml(c.name)}</span>
                </div>
                <div class="coach-team">${escapeHtml(c.team_name)}</div>
              </div>
              <div>
                <div class="coach-budget">${c.remaining_budget} pts</div>
                <div class="coach-slots-count">${rosterCount}/${totalSlots} pokes</div>
              </div>
            </div>
            <div class="poke-slot-pips" aria-label="${rosterCount} de ${totalSlots} espacios ocupados">${pips}</div>
          </div>
        `;
      })
      .join('');
  };

  const renderPickHistory = (state: IDraftState) => {
    const list = document.getElementById('picks-history-list');
    const countBadge = document.getElementById('picks-total-count');
    if (!list) return;

    if (countBadge) {
      countBadge.textContent = `${state.picks.length} picks`;
    }

    if (state.picks.length === 0) {
      list.innerHTML = `<p style="color: var(--ink-muted); font-size: 0.85rem; padding: 0.5rem 0;">No se han realizado picks todavía.</p>`;
      return;
    }

    list.innerHTML = [...state.picks]
      .reverse()
      .map(
        (p) => `
        <div class="pick-history-item">
          <div class="mini-socket">
            ${p.Pokemon ? renderPokemonSprite(p.Pokemon, 'mini-sprite') : ''}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 700; font-size: 0.88rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${escapeHtml(p.Pokemon?.name || 'Pokémon')}
            </div>
            <div style="font-size: 0.74rem; color: var(--ink-muted);">
              ${escapeHtml(p.Coach?.name || '')} · <span class="mono-num">R${p.round} P${p.overall_pick}</span>
            </div>
          </div>
          <span class="pokemon-cost-badge">${p.Pokemon?.cost ?? p.Pokemon?.default_cost ?? 0} pts</span>
        </div>
      `
      )
      .join('');
  };

  const filterAndRenderPokemons = () => {
    const grid = document.getElementById('pokemon-grid');
    const countLabel = document.getElementById('draft-results-count');
    const modeLabel = document.getElementById('draft-league-mode');
    if (!grid || !currentDraftState) return;

    const query = ((document.getElementById('poke-search') as HTMLInputElement)?.value || '').trim().toLowerCase();
    const typeFilter = ((document.getElementById('poke-type-filter') as HTMLSelectElement)?.value || '').toLowerCase();
    const sortMode = (document.getElementById('poke-sort') as HTMLSelectElement)?.value || 'cost-desc';
    const onlyAvailable = Boolean((document.getElementById('poke-only-available') as HTMLInputElement)?.checked);

    const draftedSet = new Set(currentDraftState.drafted_pokemon_ids);
    const activeCoach = currentDraftState.active_turn?.coach;
    const isDrafting = currentDraftState.league.status === 'DRAFTING';

    if (modeLabel) {
      modeLabel.textContent = `Modo ${currentDraftState.league.draft_mode === 'POINTS' ? 'PUNTOS' : 'TIERS'} · ${currentDraftState.league.roster_size} Slots`;
    }

    const filtered = allPokemons
      .filter((p) => {
        const dexStr = String(p.dex_number);
        const matchQuery = !query || p.name.toLowerCase().includes(query) || dexStr.includes(query);
        const matchType =
          !typeFilter || p.type1.toLowerCase() === typeFilter || (p.type2 && p.type2.toLowerCase() === typeFilter);
        if (!matchQuery || !matchType) return false;
        if (onlyAvailable) {
          const isDrafted = draftedSet.has(p.id);
          const canAfford = activeCoach ? activeCoach.remaining_budget >= p.cost : true;
          return !isDrafted && canAfford;
        }
        return true;
      })
      .sort((a, b) => {
        const aDrafted = draftedSet.has(a.id) ? 1 : 0;
        const bDrafted = draftedSet.has(b.id) ? 1 : 0;
        if (aDrafted !== bDrafted) return aDrafted - bDrafted;
        switch (sortMode) {
          case 'cost-asc':
            return a.cost - b.cost || a.dex_number - b.dex_number;
          case 'bst-desc':
            return b.base_bst - a.base_bst || b.cost - a.cost;
          case 'spe-desc':
            return b.base_spe - a.base_spe || b.cost - a.cost;
          case 'dex-asc':
            return a.dex_number - b.dex_number;
          case 'cost-desc':
          default:
            return b.cost - a.cost || b.base_bst - a.base_bst;
        }
      });

    if (countLabel) {
      const availableCount = allPokemons.filter((p) => !draftedSet.has(p.id)).length;
      countLabel.textContent = `Mostrando ${filtered.length} de ${allPokemons.length} especies (${availableCount} disponibles)`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="card empty-panel" style="grid-column: 1 / -1;">
          <div class="empty-panel-icon">${icon('search')}</div>
          <h3>Sin resultados en la Pokédex</h3>
          <p class="subtitle">Ningún Pokémon coincide con el filtro actual. Prueba limpiando la búsqueda o el filtro de tipo.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered
      .map((p) => {
        const isDrafted = draftedSet.has(p.id);
        const canAfford = activeCoach ? activeCoach.remaining_budget >= p.cost : true;
        const disabled = isDrafted || !canAfford || !isDrafting;

        return `
          <article class="pokemon-card ${isDrafted ? 'drafted' : !canAfford ? 'unaffordable' : ''}" data-id="${p.id}">
            <div class="pokemon-card-top">
              <span class="dex-number">${formatDexNumber(p.dex_number)}</span>
              <span class="pokemon-cost-badge">${p.cost} pts</span>
            </div>

            <div class="poke-slot-well">
              ${renderPokemonSprite(p)}
            </div>

            <button type="button" class="pokemon-name-btn btn-inspect-poke" data-id="${p.id}" title="Ver ficha Pokédex de ${escapeHtml(p.name)}">
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
              <button
                type="button"
                class="btn btn-secondary btn-sm btn-icon btn-inspect-poke"
                data-id="${p.id}"
                aria-label="Inspeccionar estadísticas de ${escapeHtml(p.name)}"
                title="Ver stats base"
              >
                ${icon('info')}
              </button>
              <button
                type="button"
                class="btn btn-primary btn-sm btn-pick-poke"
                data-id="${p.id}"
                ${disabled ? 'disabled' : ''}
              >
                ${isDrafted ? 'Drafteado' : !canAfford ? 'Sin Pts' : !isDrafting ? 'Inactivo' : 'Draftear'}
              </button>
            </div>
          </article>
        `;
      })
      .join('');

    grid.querySelectorAll('.btn-pick-poke').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!activeCoach) return;
        const pokeId = parseInt(btn.getAttribute('data-id')!, 10);
        try {
          await api.makeDraftPick(leagueId, activeCoach.id, pokeId);
          showToast('Pick realizado con éxito.');
          await loadDraftData();
        } catch (err: any) {
          showToast(err.message, true);
        }
      });
    });

    grid.querySelectorAll('.btn-inspect-poke').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pokeId = parseInt(btn.getAttribute('data-id')!, 10);
        const pokemon = allPokemons.find((item) => item.id === pokeId);
        if (!pokemon) return;
        const isDrafted = draftedSet.has(pokemon.id);
        const canAfford = activeCoach ? activeCoach.remaining_budget >= pokemon.cost : true;
        openSpecModal(pokemon, isDrafted, canAfford, isDrafting);
      });
    });
  };

  const loadDraftData = async () => {
    try {
      const [state, pokemons] = await Promise.all([api.getDraftState(leagueId), api.getPokemons({ leagueId })]);
      currentDraftState = state;
      allPokemons = pokemons;
      renderTurnBanner(currentDraftState);
      renderCoachesStatus(currentDraftState);
      renderPickHistory(currentDraftState);
      filterAndRenderPokemons();

      // Silently hydrate any missing PokeAPI sprites/stats without blocking initial render
      const enriched = await enrichPokemonListFromPokeApi(pokemons);
      if (enriched.some((p, i) => p !== pokemons[i])) {
        allPokemons = enriched;
        filterAndRenderPokemons();
      }
    } catch (err: any) {
      const turnContainer = document.getElementById('draft-turn-container');
      if (turnContainer) {
        turnContainer.innerHTML = `
          <div class="card empty-panel">
            <div class="empty-panel-icon" style="color: var(--dex-crimson);">${icon('alert')}</div>
            <h2>Error al cargar la Sala de Draft</h2>
            <p class="subtitle">${escapeHtml(err.message || 'No se pudo obtener el estado de la liga.')}</p>
          </div>
        `;
      }
      showToast(err.message, true);
    }
  };

  document.getElementById('poke-search')?.addEventListener('input', filterAndRenderPokemons);
  document.getElementById('poke-type-filter')?.addEventListener('change', filterAndRenderPokemons);
  document.getElementById('poke-sort')?.addEventListener('change', filterAndRenderPokemons);
  document.getElementById('poke-only-available')?.addEventListener('change', filterAndRenderPokemons);
  document.getElementById('btn-import-pokeapi')?.addEventListener('click', openImportPokeApiModal);

  const btnPaneCatalog = document.getElementById('btn-mobile-pane-catalog');
  const btnPaneSidebar = document.getElementById('btn-mobile-pane-sidebar');
  const catalogPane = document.getElementById('draft-catalog-pane');
  const sidebarPane = document.getElementById('draft-sidebar-pane');

  btnPaneCatalog?.addEventListener('click', () => {
    catalogPane?.classList.remove('is-mobile-hidden');
    sidebarPane?.classList.add('is-mobile-hidden');
    btnPaneCatalog.className = 'btn btn-primary btn-sm';
    btnPaneCatalog.setAttribute('aria-selected', 'true');
    if (btnPaneSidebar) {
      btnPaneSidebar.className = 'btn btn-ghost btn-sm';
      btnPaneSidebar.setAttribute('aria-selected', 'false');
    }
  });

  btnPaneSidebar?.addEventListener('click', () => {
    sidebarPane?.classList.remove('is-mobile-hidden');
    catalogPane?.classList.add('is-mobile-hidden');
    btnPaneSidebar.className = 'btn btn-primary btn-sm';
    btnPaneSidebar.setAttribute('aria-selected', 'true');
    if (btnPaneCatalog) {
      btnPaneCatalog.className = 'btn btn-ghost btn-sm';
      btnPaneCatalog.setAttribute('aria-selected', 'false');
    }
  });

  await loadDraftData();
};
