import { api } from '../services/api.js';
import { enrichPokemonListFromPokeApi, fetchPokeApiPokemon } from '../services/pokeapi.js';
import { IDraftQueueItem, IDraftState, IPokeApiDetail, IPokemon } from '../types/index.js';
import {
  ALL_TYPES_ES,
  escapeHtml,
  formatDexNumber,
  renderPokemonSprite,
  renderTypeBadge
} from '../utils/format.js';
import { icon } from '../utils/icons.js';
import { openLeagueAdminModal } from './LeagueAdminModal.js';
import { openPokemonDetailModal } from './PokemonDetailModal.js';

function formatCountdown(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined) return '--:--';
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hours > 0) {
    return `${hours}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const renderDraftBoardView = async (
  container: HTMLElement,
  leagueId: number | null,
  showToast: (msg: string, isError?: boolean) => void
): Promise<(() => void) | null> => {
  if (!leagueId) {
    container.innerHTML = `
      <div class="card empty-panel">
        <div class="empty-panel-icon">${icon('draft')}</div>
        <h2>Selecciona una Liga</h2>
        <p class="subtitle">Elige una liga desde el selector superior o crea una nueva en la vista de Ligas para acceder a la sala de draft.</p>
      </div>
    `;
    return null;
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
        <span>Cola & Entrenadores</span>
      </button>
    </div>

    <div class="draft-layout">
      <section id="draft-catalog-pane" class="draft-catalog-pane" aria-label="Catálogo de Pokémon del Draft">
        <div class="filter-dock">
          <div class="search-field-wrap">
            <span class="search-icon">${icon('search')}</span>
            <input
              type="search"
              id="poke-search"
              class="input-search"
              placeholder="Buscar por nombre o # Pokédex..."
              aria-label="Buscar Pokémon por nombre o número de Pokédex"
              enterkeyhint="search"
              autocapitalize="none"
              autocomplete="off"
              spellcheck="false"
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

      <aside id="draft-sidebar-pane" class="draft-sidebar is-mobile-hidden" aria-label="Estado de entrenadores, cola e historial">
        <div class="card">
          <h3 class="panel-heading">
            <span class="panel-heading-left">${icon('list')}<span>Cola Auto-Pick</span></span>
            <select id="queue-coach-select" class="select-input" style="min-height:34px; padding:0.25rem 0.5rem; font-size:0.78rem; max-width:155px;" aria-label="Coach de cola"></select>
          </h3>
          <div id="draft-queue-list" class="queue-list"></div>
        </div>

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
  let pokemonById = new Map<number, IPokemon>();
  let queueItems: IDraftQueueItem[] = [];
  let selectedQueueCoachId: number | null = null;
  let forcePickMode = false;
  let searchTimer: number | undefined;
  let remainingSecondsLocal: number | null = null;
  let isDisposed = false;
  let sseConnected = false;

  const setCatalog = (list: IPokemon[]) => {
    allPokemons = list;
    pokemonById = new Map(list.map((item) => [item.id, item]));
  };

  const isCommissioner = (): boolean => {
    if (!currentDraftState) return false;
    const authUser = api.getAuthUser();
    if (!authUser) return false;
    return authUser.role === 'ADMIN' || currentDraftState.league.admin_id === authUser.id;
  };

  const getActiveCoachMegaCount = (): number => {
    const activeCoachId = currentDraftState?.active_turn?.coach.id;
    if (!activeCoachId || !currentDraftState) return 0;
    const coach = currentDraftState.coaches.find((c) => c.id === activeCoachId);
    if (!coach?.Roster) return 0;
    return coach.Roster.filter((r) => Boolean(r.is_mega)).length;
  };

  const openSpecModal = (pokemon: IPokemon, isDrafted: boolean, canAfford: boolean, canDraftNow: boolean) => {
    openPokemonDetailModal({
      pokemon,
      mode: 'draft',
      draftAction: {
        isDrafted,
        canAfford,
        canDraftNow: canDraftNow && !pokemon.is_banned,
        cost: pokemon.cost,
        onDraft: async () => {
          if (forcePickMode && isCommissioner()) {
            await api.forceDraftPick(leagueId, pokemon.id);
            showToast(`Pick forzado: ${pokemon.name}.`);
          } else {
            const activeCoach = currentDraftState?.active_turn?.coach;
            if (!activeCoach) return;
            await api.makeDraftPick(leagueId, activeCoach.id, pokemon.id);
            showToast(`${pokemon.name} incorporado a ${activeCoach.team_name}.`);
          }
          await loadDraftData(false);
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
          Busca cualquier Pokémon (incluyendo Megas directas como <code>charizard-mega-x</code>) para incorporarlo al catálogo.
        </p>

        <form id="form-import-search" class="pokedex-search-form" style="margin-bottom: 1rem;">
          <div class="search-field-wrap">
            <span class="search-icon">${icon('search')}</span>
            <input
              type="search"
              id="import-pokeapi-query"
              class="input-search"
              required
              placeholder="Ej. garchomp, charizard-mega-x, 150"
              enterkeyhint="search"
              autocapitalize="none"
              autocomplete="off"
              spellcheck="false"
            />
          </div>
          <button type="submit" class="btn btn-secondary btn-sm">Consultar</button>
        </form>

        <div id="import-pokeapi-preview" class="neo-well" style="padding: 1rem; margin-bottom: 1rem; text-align: center; color: var(--ink-muted); font-size: 0.86rem;">
          Ingresa un nombre o # Dex para previsualizar.
        </div>

        <form id="form-import-confirm" style="display: flex; flex-direction: column; gap: 1rem;">
          <div class="field-group">
            <label class="field-label" for="import-pokeapi-cost">Coste en Puntos</label>
            <input type="number" id="import-pokeapi-cost" class="input-well mono-num" value="12" min="1" max="50" inputmode="numeric" />
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
        await loadDraftData(true);
      } catch (err: any) {
        showToast(err.message, true);
      }
    });
  };

  const renderQueuePanel = () => {
    const listEl = document.getElementById('draft-queue-list');
    if (!listEl) return;

    if (!selectedQueueCoachId) {
      listEl.innerHTML = `<p class="subtitle" style="margin:0;">Inscribe un entrenador para armar su cola.</p>`;
      return;
    }

    if (queueItems.length === 0) {
      listEl.innerHTML = `<p style="color: var(--ink-muted); font-size: 0.82rem;">Cola vacía. Pulsa <strong>+ Cola</strong> en cualquier Pokémon disponible para fijar tu prioridad de auto-pick.</p>`;
      return;
    }

    listEl.innerHTML = queueItems
      .map(
        (item, idx) => `
      <div class="queue-item" data-pokemon-id="${item.pokemon_id}">
        <span class="mono-num queue-rank">#${idx + 1}</span>
        <div class="mini-socket">
          ${item.Pokemon ? renderPokemonSprite(item.Pokemon, 'mini-sprite', false, { size: 30 }) : ''}
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 700; font-size: 0.84rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${escapeHtml(item.Pokemon?.name || `#${item.pokemon_id}`)}
          </div>
          <div class="mono-num" style="font-size: 0.7rem; color: var(--dex-gold);">
            ${item.Pokemon?.default_cost ?? 0} pts
          </div>
        </div>
        <div class="queue-actions">
          <button type="button" class="btn btn-ghost btn-icon btn-queue-up" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''} aria-label="Subir prioridad">${icon('arrowUp')}</button>
          <button type="button" class="btn btn-ghost btn-icon btn-queue-down" data-idx="${idx}" ${idx === queueItems.length - 1 ? 'disabled' : ''} aria-label="Bajar prioridad">${icon('arrowDown')}</button>
          <button type="button" class="btn btn-ghost btn-icon btn-queue-del" data-pokemon-id="${item.pokemon_id}" aria-label="Quitar de la cola">${icon('trash')}</button>
        </div>
      </div>
    `
      )
      .join('');
  };

  const loadCoachQueue = async () => {
    if (!selectedQueueCoachId) return;
    try {
      queueItems = await api.getDraftQueue(leagueId, selectedQueueCoachId);
      renderQueuePanel();
    } catch {
      queueItems = [];
      renderQueuePanel();
    }
  };

  const syncQueueSelector = (state: IDraftState) => {
    const select = document.getElementById('queue-coach-select') as HTMLSelectElement | null;
    if (!select) return;

    const authUser = api.getAuthUser();
    const myCoach = authUser ? state.coaches.find((c) => c.user_id === authUser.id) : undefined;
    if (!selectedQueueCoachId || !state.coaches.some((c) => c.id === selectedQueueCoachId)) {
      selectedQueueCoachId = myCoach?.id || state.active_turn?.coach.id || state.coaches[0]?.id || null;
    }

    select.innerHTML = state.coaches
      .map(
        (c) =>
          `<option value="${c.id}" ${c.id === selectedQueueCoachId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
      )
      .join('');
  };

  const renderTurnBanner = (state: IDraftState) => {
    const turnContainer = document.getElementById('draft-turn-container');
    if (!turnContainer) return;

    const league = state.league;
    const canAdmin = isCommissioner();
    const ruleSummary = `
      <div class="rules-chip-strip">
        <span class="rule-chip">${escapeHtml(league.format_name || 'NatDex Gen 9')}</span>
        <span class="rule-chip">${league.allow_dynamax ? 'Dynamax OK' : 'Sin Dynamax'}</span>
        <span class="rule-chip">${league.allow_z_moves ? 'Z-Moves OK' : 'Sin Z-Moves'}</span>
        <span class="rule-chip">Máx ${league.max_megas ?? 1} Mega · ${league.max_z_crystals ?? 1} Cristal Z</span>
        <span class="sse-badge ${sseConnected ? 'is-live' : ''}">${sseConnected ? 'SSE En Vivo' : 'Sincronizado'}</span>
      </div>
    `;

    if (league.status === 'SETUP') {
      turnContainer.innerHTML = `
        <div class="turn-deck turn-deck--setup">
          <div class="turn-deck-top">
            <div>
              <h1 style="font-size: 1.3rem; color: var(--dex-gold);">Preparación — ${escapeHtml(league.name)}</h1>
              <p class="subtitle">Verifica entrenadores, costos y baneos antes de iniciar el Snake Draft asíncrono.</p>
              ${ruleSummary}
            </div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
              ${
                canAdmin
                  ? `
                <button type="button" id="btn-open-admin-rules" class="btn btn-secondary btn-sm">
                  ${icon('crown')}<span>Reglas & Baneos</span>
                </button>
                <button type="button" id="btn-start-draft-now" class="btn btn-primary">
                  ${icon('bolt')}<span>Iniciar Draft Snake</span>
                </button>
              `
                  : `<span class="status-pill status-setup"><span class="status-dot"></span><span>Esperando Comisionado</span></span>`
              }
            </div>
          </div>
        </div>
      `;

      document.getElementById('btn-open-admin-rules')?.addEventListener('click', () => {
        openLeagueAdminModal(league, showToast, () => loadDraftData(true));
      });
      document.getElementById('btn-start-draft-now')?.addEventListener('click', async () => {
        try {
          await api.startDraft(leagueId);
          showToast('El Draft Snake ha comenzado.');
          await loadDraftData(false);
        } catch (e: any) {
          showToast(e.message, true);
        }
      });
      return;
    }

    if (league.status === 'IN_PROGRESS' || league.status === 'FINISHED') {
      turnContainer.innerHTML = `
        <div class="turn-deck turn-deck--done">
          <div class="turn-deck-top">
            <div>
              <h1 style="font-size: 1.3rem; color: #6ee7b7;">Draft Completado — ${escapeHtml(league.name)}</h1>
              <p class="subtitle">Plantillas listas. Gestiona designaciones Mega / Cristal Z, Trades y calendario Premier League.</p>
              ${ruleSummary}
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
      const paused = Boolean(league.is_paused);

      turnContainer.innerHTML = `
        <div class="turn-deck ${paused ? 'turn-deck--paused' : ''}">
          <div class="turn-deck-top">
            <div class="turn-identity">
              <span class="turn-beacon" aria-hidden="true"></span>
              <div>
                <h1 class="turn-coach-title">
                  Turno: ${escapeHtml(coach.name)}
                  <span class="turn-team-sub">(${escapeHtml(coach.team_name)})</span>
                </h1>
                ${ruleSummary}
              </div>
            </div>

            <div class="turn-telemetry-row">
              <div class="neo-well telemetry-well">
                <span>Ronda · Pick</span>
                <strong>R${round} · #${pickInRound}</strong>
              </div>
              <div class="neo-well telemetry-well telemetry-well--gold">
                <span>Presupuesto</span>
                <strong>${coach.remaining_budget} pts</strong>
              </div>
              <div class="neo-well telemetry-well timer-well ${paused ? 'is-paused' : ''}">
                <span>${paused ? 'Pausado' : 'Reloj Turno'}</span>
                <strong id="draft-timer-value">${formatCountdown(remainingSecondsLocal)}</strong>
              </div>
            </div>
          </div>

          ${
            canAdmin
              ? `
            <div class="commissioner-bar" aria-label="Controles del Comisionado">
              <span class="commissioner-badge">${icon('crown')}<span>Comisionado</span></span>
              <button type="button" id="btn-toggle-pause" class="btn btn-secondary btn-sm">
                ${icon(paused ? 'play' : 'pause')}
                <span>${paused ? 'Reanudar' : 'Pausar'}</span>
              </button>
              <button type="button" id="btn-undo-pick" class="btn btn-secondary btn-sm" ${state.picks.length === 0 ? 'disabled' : ''}>
                ${icon('undo')}<span>Deshacer</span>
              </button>
              <button type="button" id="btn-skip-autopick" class="btn btn-secondary btn-sm">
                ${icon('fastForward')}<span>Auto-pick</span>
              </button>
              <button type="button" id="btn-force-pick-mode" class="btn ${forcePickMode ? 'btn-primary' : 'btn-secondary'} btn-sm">
                ${icon('shield')}<span>${forcePickMode ? 'Forzar: ON' : 'Forzar Pick'}</span>
              </button>
              <button type="button" id="btn-open-admin-rules" class="btn btn-secondary btn-sm">
                ${icon('sliders')}<span>Costos & Baneos</span>
              </button>
            </div>
          `
              : ''
          }

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

      document.getElementById('btn-toggle-pause')?.addEventListener('click', async () => {
        try {
          if (paused) {
            await api.resumeDraft(leagueId);
            showToast('Draft reanudado.');
          } else {
            await api.pauseDraft(leagueId);
            showToast('Draft pausado.');
          }
          await loadDraftData(false);
        } catch (err: any) {
          showToast(err.message, true);
        }
      });

      document.getElementById('btn-undo-pick')?.addEventListener('click', async () => {
        try {
          await api.undoDraftPick(leagueId);
          showToast('Última elección deshecha.');
          await loadDraftData(false);
        } catch (err: any) {
          showToast(err.message, true);
        }
      });

      document.getElementById('btn-skip-autopick')?.addEventListener('click', async () => {
        try {
          await api.skipDraftTurn(leagueId);
          showToast('Turno avanzado mediante auto-pick.');
          await loadDraftData(false);
        } catch (err: any) {
          showToast(err.message, true);
        }
      });

      document.getElementById('btn-force-pick-mode')?.addEventListener('click', () => {
        forcePickMode = !forcePickMode;
        showToast(
          forcePickMode
            ? 'Modo Forzar Pick activo: pulsa Draftear en cualquier especie disponible.'
            : 'Modo Forzar Pick desactivado.'
        );
        renderTurnBanner(state);
        filterAndRenderPokemons();
      });

      document.getElementById('btn-open-admin-rules')?.addEventListener('click', () => {
        openLeagueAdminModal(league, showToast, () => loadDraftData(true));
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
        const megaCount = c.Roster ? c.Roster.filter((r) => r.is_mega).length : 0;
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
                <div class="coach-team">${escapeHtml(c.team_name)} · Mega ${megaCount}/${state.league.max_megas ?? 1}</div>
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
            ${p.Pokemon ? renderPokemonSprite(p.Pokemon, 'mini-sprite', false, { size: 32 }) : ''}
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
    const bannedSet = new Set(currentDraftState.banned_pokemon_ids || []);
    const activeCoach = currentDraftState.active_turn?.coach;
    const isDrafting = currentDraftState.league.status === 'DRAFTING';
    const paused = Boolean(currentDraftState.league.is_paused);
    const maxMegas = currentDraftState.league.max_megas ?? 1;
    const activeMegaCount = getActiveCoachMegaCount();

    if (modeLabel) {
      modeLabel.textContent = `${currentDraftState.league.draft_mode === 'POINTS' ? 'PUNTOS' : 'TIERS'} · ${currentDraftState.league.roster_size} Slots`;
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
          const isBanned = Boolean(p.is_banned || bannedSet.has(p.id));
          const canAfford = activeCoach ? activeCoach.remaining_budget >= p.cost : true;
          const megaBlocked = Boolean(p.is_mega && activeMegaCount >= maxMegas);
          return !isDrafted && !isBanned && canAfford && !megaBlocked;
        }
        return true;
      })
      .sort((a, b) => {
        const aDrafted = draftedSet.has(a.id) ? 1 : 0;
        const bDrafted = draftedSet.has(b.id) ? 1 : 0;
        if (aDrafted !== bDrafted) return aDrafted - bDrafted;
        const aBanned = a.is_banned || bannedSet.has(a.id) ? 1 : 0;
        const bBanned = b.is_banned || bannedSet.has(b.id) ? 1 : 0;
        if (aBanned !== bBanned) return aBanned - bBanned;
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
      const availableCount = allPokemons.filter(
        (p) => !draftedSet.has(p.id) && !p.is_banned && !bannedSet.has(p.id)
      ).length;
      countLabel.textContent = `Mostrando ${filtered.length} de ${allPokemons.length} especies (${availableCount} disponibles)`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="card empty-panel" style="grid-column: 1 / -1;">
          <div class="empty-panel-icon">${icon('search')}</div>
          <h3>Sin resultados en la Pokédex</h3>
          <p class="subtitle">Ningún Pokémon coincide con el filtro actual.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered
      .map((p, idx) => {
        const isDrafted = draftedSet.has(p.id);
        const isBanned = Boolean(p.is_banned || bannedSet.has(p.id));
        const canAfford = activeCoach ? activeCoach.remaining_budget >= p.cost : true;
        const megaLimitReached = Boolean(p.is_mega && activeMegaCount >= maxMegas);
        const blockedByPause = paused && !(forcePickMode && isCommissioner());
        const disabled = isDrafted || isBanned || !canAfford || megaLimitReached || !isDrafting || blockedByPause;

        const pickLabel = isBanned
          ? 'Baneado'
          : isDrafted
            ? 'Drafteado'
            : megaLimitReached
              ? 'Límite Mega'
              : !canAfford
                ? 'Sin Pts'
                : blockedByPause
                  ? 'Pausado'
                  : !isDrafting
                    ? 'Inactivo'
                    : forcePickMode && isCommissioner()
                      ? 'Forzar'
                      : 'Draftear';

        return `
          <article class="pokemon-card ${isDrafted ? 'drafted' : isBanned ? 'is-banned' : !canAfford ? 'unaffordable' : ''}" data-id="${p.id}">
            <div class="pokemon-card-top">
              <span class="dex-number">${formatDexNumber(p.dex_number)}</span>
              <div style="display:flex; align-items:center; gap:0.25rem;">
                ${p.is_mega ? '<span class="mega-pill">MEGA</span>' : ''}
                ${isBanned ? '<span class="banned-pill">BAN</span>' : `<span class="pokemon-cost-badge">${p.cost} pts</span>`}
              </div>
            </div>

            <div class="poke-slot-well">
              ${renderPokemonSprite(p, 'pokemon-sprite', false, { eager: idx < 6 })}
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
                title="Ver stats"
              >
                ${icon('info')}
              </button>
              <button
                type="button"
                class="btn btn-secondary btn-sm btn-icon btn-queue-add"
                data-id="${p.id}"
                ${isDrafted || isBanned ? 'disabled' : ''}
                aria-label="Añadir ${escapeHtml(p.name)} a cola auto-pick"
                title="Añadir a Cola"
              >
                ${icon('list')}
              </button>
              <button
                type="button"
                class="btn btn-primary btn-sm btn-pick-poke"
                data-id="${p.id}"
                ${disabled ? 'disabled' : ''}
              >
                ${pickLabel}
              </button>
            </div>
          </article>
        `;
      })
      .join('');
  };

  const loadDraftData = async (refreshCatalog = false) => {
    if (isDisposed) return;
    try {
      const shouldFetchCatalog = refreshCatalog || allPokemons.length === 0;
      if (shouldFetchCatalog) {
        const [state, pokemons] = await Promise.all([api.getDraftState(leagueId), api.getPokemons({ leagueId })]);
        if (isDisposed) return;
        currentDraftState = state;
        setCatalog(pokemons);
      } else {
        const state = await api.getDraftState(leagueId);
        if (isDisposed) return;
        currentDraftState = state;
      }

      remainingSecondsLocal = currentDraftState.remaining_seconds ?? null;
      syncQueueSelector(currentDraftState);
      renderTurnBanner(currentDraftState);
      renderCoachesStatus(currentDraftState);
      renderPickHistory(currentDraftState);
      filterAndRenderPokemons();
      void loadCoachQueue();

      if (shouldFetchCatalog) {
        const enriched = await enrichPokemonListFromPokeApi(allPokemons);
        if (!isDisposed && enriched.some((p, i) => p !== allPokemons[i])) {
          setCatalog(enriched);
          filterAndRenderPokemons();
        }
      }
    } catch (err: any) {
      if (isDisposed) return;
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

  // Single delegated click listener for Pokémon catalog
  document.getElementById('pokemon-grid')?.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;

    const queueBtn = target.closest<HTMLButtonElement>('.btn-queue-add');
    if (queueBtn && !queueBtn.disabled) {
      if (!selectedQueueCoachId) {
        showToast('Selecciona un entrenador en Cola Auto-Pick primero.', true);
        return;
      }
      const pokeId = parseInt(queueBtn.getAttribute('data-id') || '', 10);
      if (isNaN(pokeId)) return;
      try {
        queueItems = await api.addToDraftQueue(leagueId, selectedQueueCoachId, pokeId);
        renderQueuePanel();
        showToast('Añadido a la cola de auto-pick.');
      } catch (err: any) {
        showToast(err.message, true);
      }
      return;
    }

    const pickBtn = target.closest<HTMLButtonElement>('.btn-pick-poke');
    if (pickBtn && !pickBtn.disabled) {
      const pokeId = parseInt(pickBtn.getAttribute('data-id') || '', 10);
      if (isNaN(pokeId)) return;
      pickBtn.disabled = true;
      try {
        if (forcePickMode && isCommissioner()) {
          await api.forceDraftPick(leagueId, pokeId);
          showToast('Pick forzado por el comisionado.');
        } else {
          const activeCoach = currentDraftState?.active_turn?.coach;
          if (!activeCoach) return;
          await api.makeDraftPick(leagueId, activeCoach.id, pokeId);
          showToast('Pick realizado con éxito.');
        }
        await loadDraftData(false);
      } catch (err: any) {
        pickBtn.disabled = false;
        showToast(err.message, true);
      }
      return;
    }

    const inspectBtn = target.closest<HTMLElement>('.btn-inspect-poke');
    if (inspectBtn && currentDraftState) {
      const pokeId = parseInt(inspectBtn.getAttribute('data-id') || '', 10);
      const pokemon = pokemonById.get(pokeId);
      if (!pokemon) return;
      const isDrafted = currentDraftState.drafted_pokemon_ids.includes(pokemon.id);
      const activeCoach = currentDraftState.active_turn?.coach;
      const canAfford = activeCoach ? activeCoach.remaining_budget >= pokemon.cost : true;
      const isDrafting = currentDraftState.league.status === 'DRAFTING';
      openSpecModal(pokemon, isDrafted, canAfford, isDrafting);
    }
  });

  // Queue coach switch & single delegated listener for queue actions
  document.getElementById('queue-coach-select')?.addEventListener('change', (e) => {
    const val = parseInt((e.target as HTMLSelectElement).value, 10);
    if (!isNaN(val)) {
      selectedQueueCoachId = val;
      void loadCoachQueue();
    }
  });

  document.getElementById('draft-queue-list')?.addEventListener('click', async (e) => {
    if (!selectedQueueCoachId) return;
    const target = e.target as HTMLElement;
    const upBtn = target.closest<HTMLButtonElement>('.btn-queue-up');
    if (upBtn && !upBtn.disabled) {
      const idx = parseInt(upBtn.getAttribute('data-idx') || '-1', 10);
      if (idx > 0) {
        const ids = queueItems.map((q) => q.pokemon_id);
        [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
        queueItems = await api.reorderDraftQueue(leagueId, selectedQueueCoachId, ids);
        renderQueuePanel();
      }
      return;
    }

    const downBtn = target.closest<HTMLButtonElement>('.btn-queue-down');
    if (downBtn && !downBtn.disabled) {
      const idx = parseInt(downBtn.getAttribute('data-idx') || '-1', 10);
      if (idx >= 0 && idx < queueItems.length - 1) {
        const ids = queueItems.map((q) => q.pokemon_id);
        [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
        queueItems = await api.reorderDraftQueue(leagueId, selectedQueueCoachId, ids);
        renderQueuePanel();
      }
      return;
    }

    const delBtn = target.closest<HTMLButtonElement>('.btn-queue-del');
    if (delBtn) {
      const pokeId = parseInt(delBtn.getAttribute('data-pokemon-id') || '', 10);
      if (!isNaN(pokeId)) {
        queueItems = await api.removeFromDraftQueue(leagueId, selectedQueueCoachId, pokeId);
        renderQueuePanel();
      }
    }
  });

  document.getElementById('poke-search')?.addEventListener('input', () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(filterAndRenderPokemons, 140);
  });
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

  // Live SSE Subscription & Lightweight 1s Text-Node Timer
  let eventSource: EventSource | null = null;
  try {
    eventSource = api.createDraftEventSource(leagueId);
    eventSource.addEventListener('connected', () => {
      sseConnected = true;
      const badge = document.querySelector('.sse-badge');
      if (badge) {
        badge.classList.add('is-live');
        badge.textContent = 'SSE En Vivo';
      }
    });
    eventSource.addEventListener('draft:update', (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data || '{}');
        const refreshCatalog = data.action === 'tier_updated';
        void loadDraftData(refreshCatalog);
      } catch {
        void loadDraftData(false);
      }
    });
  } catch {
    // Ignore SSE unavailability in static preview
  }

  let expirySyncTriggered = false;
  const timerInterval = window.setInterval(() => {
    if (!currentDraftState || currentDraftState.league.status !== 'DRAFTING' || currentDraftState.league.is_paused) {
      return;
    }
    if (remainingSecondsLocal === null) return;
    if (remainingSecondsLocal > 0) {
      remainingSecondsLocal -= 1;
      expirySyncTriggered = false;
      const timerNode = document.getElementById('draft-timer-value');
      if (timerNode) timerNode.textContent = formatCountdown(remainingSecondsLocal);
    } else if (!expirySyncTriggered) {
      expirySyncTriggered = true;
      void loadDraftData(false);
    }
  }, 1000);

  await loadDraftData(true);

  return () => {
    isDisposed = true;
    if (eventSource) eventSource.close();
    window.clearInterval(timerInterval);
    window.clearTimeout(searchTimer);
  };
};
