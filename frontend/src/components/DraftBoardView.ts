import { api } from '../services/api.js';
import { IDraftState, IPokemon } from '../types/index.js';

export const renderDraftBoardView = async (
  container: HTMLElement,
  leagueId: number | null,
  showToast: (msg: string, isError?: boolean) => void
) => {
  if (!leagueId) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 4rem;">
        <h2>Selecciona una Liga</h2>
        <p style="color: var(--text-muted); margin: 1rem 0;">Por favor selecciona o crea una liga desde el menú superior para acceder a la sala de draft.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div id="draft-turn-container"></div>

    <div class="draft-layout">
      <!-- Left Column: Catalog & Selection -->
      <div>
        <div class="filter-bar">
          <input type="text" id="poke-search" class="input-search" placeholder="🔍 Buscar por nombre o # Pokédex..." style="flex: 1;" />
          <select id="poke-type-filter" class="select-input">
            <option value="">Todos los Tipos</option>
            <option value="normal">Normal</option>
            <option value="fire">Fuego</option>
            <option value="water">Agua</option>
            <option value="electric">Eléctrico</option>
            <option value="grass">Planta</option>
            <option value="ice">Hielo</option>
            <option value="fighting">Lucha</option>
            <option value="poison">Veneno</option>
            <option value="ground">Tierra</option>
            <option value="flying">Volador</option>
            <option value="psychic">Psíquico</option>
            <option value="bug">Bicho</option>
            <option value="rock">Roca</option>
            <option value="ghost">Fantasma</option>
            <option value="dragon">Dragón</option>
            <option value="dark">Siniestro</option>
            <option value="steel">Acero</option>
            <option value="fairy">Hada</option>
          </select>
          <button id="btn-undo-pick" class="btn btn-secondary btn-sm">↩️ Deshacer Último Pick</button>
        </div>

        <div id="pokemon-grid" class="pokemon-grid">
          <p style="color: var(--text-muted);">Cargando catálogo de Pokémon...</p>
        </div>
      </div>

      <!-- Right Column: Coaches Status & Live Picks -->
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div class="card">
          <h3 style="font-size: 1.1rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;">
            👥 Entrenadores & Presupuesto
          </h3>
          <div id="coaches-status-list" style="display: flex; flex-direction: column; gap: 0.75rem;"></div>
        </div>

        <div class="card" style="flex: 1; max-height: 400px; overflow-y: auto;">
          <h3 style="font-size: 1.1rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;">
            📜 Historial de Picks
          </h3>
          <div id="picks-history-list" style="display: flex; flex-direction: column; gap: 0.5rem;"></div>
        </div>
      </div>
    </div>
  `;

  let currentDraftState: IDraftState | null = null;
  let allPokemons: IPokemon[] = [];

  const loadDraftData = async () => {
    try {
      currentDraftState = await api.getDraftState(leagueId);
      renderTurnBanner(currentDraftState);
      renderCoachesStatus(currentDraftState);
      renderPickHistory(currentDraftState);

      allPokemons = await api.getPokemons({ leagueId });
      filterAndRenderPokemons();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const renderTurnBanner = (state: IDraftState) => {
    const turnContainer = document.getElementById('draft-turn-container');
    if (!turnContainer) return;

    if (state.league.status === 'SETUP') {
      turnContainer.innerHTML = `
        <div class="card" style="background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.3); margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="color: var(--accent-gold);">Fase de Preparación</h2>
            <p style="color: var(--text-muted);">La liga está lista para iniciar el draft.</p>
          </div>
          <button id="btn-start-draft-now" class="btn btn-primary">🚀 Iniciar Draft Snake</button>
        </div>
      `;
      document.getElementById('btn-start-draft-now')?.addEventListener('click', async () => {
        try {
          await api.startDraft(leagueId);
          showToast('¡El Draft ha comenzado!');
          await loadDraftData();
        } catch (e: any) {
          showToast(e.message, true);
        }
      });
      return;
    }

    if (state.league.status === 'IN_PROGRESS' || state.league.status === 'FINISHED') {
      turnContainer.innerHTML = `
        <div class="card" style="background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); margin-bottom: 1.5rem;">
          <h2 style="color: var(--accent-green);">🎉 ¡Fase de Draft Completada!</h2>
          <p style="color: var(--text-muted);">Todas las plantillas han sido seleccionadas. Ya puedes revisar los rosters y comenzar las jornadas.</p>
        </div>
      `;
      return;
    }

    if (state.active_turn) {
      const { coach, round, pickInRound } = state.active_turn;
      turnContainer.innerHTML = `
        <div class="turn-banner">
          <div>
            <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-primary);">
              TURNO ACTIVO DE DRAFT
            </div>
            <div class="turn-coach-name">${coach.name} <span style="font-weight: 400; color: var(--text-muted); font-size: 0.9em;">(${coach.team_name})</span></div>
          </div>
          <div class="turn-meta">
            <div>Ronda: <strong>#${round}</strong></div>
            <div>Pick: <strong>#${pickInRound} (${state.league.current_pick_turn} Global)</strong></div>
            <div>Presupuesto: <strong style="color: var(--accent-gold);">${coach.remaining_budget} pts</strong></div>
          </div>
        </div>
      `;
    }
  };

  const renderCoachesStatus = (state: IDraftState) => {
    const list = document.getElementById('coaches-status-list');
    if (!list) return;

    list.innerHTML = state.coaches
      .map((c) => {
        const isActive = state.active_turn?.coach.id === c.id;
        const rosterCount = c.Roster ? c.Roster.length : 0;
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); background: ${isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)'}; border: 1px solid ${isActive ? 'var(--accent-primary)' : 'transparent'};">
            <div>
              <div style="font-weight: 700; font-size: 0.9rem; ${isActive ? 'color: var(--accent-primary);' : ''}">${c.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-dim);">${c.team_name}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 800; color: var(--accent-gold); font-size: 0.85rem;">${c.remaining_budget} pts</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${rosterCount}/${state.league.roster_size} pokes</div>
            </div>
          </div>
        `;
      })
      .join('');
  };

  const renderPickHistory = (state: IDraftState) => {
    const list = document.getElementById('picks-history-list');
    if (!list) return;

    if (state.picks.length === 0) {
      list.innerHTML = `<p style="color: var(--text-dim); font-size: 0.85rem;">No se han realizado picks todavía.</p>`;
      return;
    }

    list.innerHTML = [...state.picks]
      .reverse()
      .map(
        (p) => `
        <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.4rem 0.6rem; border-radius: var(--radius-sm); background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); font-size: 0.85rem;">
          <img src="${p.Pokemon?.sprite_animated_url || p.Pokemon?.sprite_url}" style="width: 32px; height: 32px; object-fit: contain;" />
          <div style="flex: 1;">
            <div style="font-weight: 700;">${p.Pokemon?.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${p.Coach?.name} (R${p.round} P${p.overall_pick})</div>
          </div>
          <span class="pokemon-cost-badge" style="position: static;">${p.Pokemon?.cost || p.Pokemon?.default_cost} pts</span>
        </div>
      `
      )
      .join('');
  };

  const filterAndRenderPokemons = () => {
    const grid = document.getElementById('pokemon-grid');
    if (!grid || !currentDraftState) return;

    const query = ((document.getElementById('poke-search') as HTMLInputElement)?.value || '').toLowerCase();
    const typeFilter = ((document.getElementById('poke-type-filter') as HTMLSelectElement)?.value || '').toLowerCase();

    const draftedSet = new Set(currentDraftState.drafted_pokemon_ids);
    const activeCoach = currentDraftState.active_turn?.coach;

    const filtered = allPokemons.filter((p) => {
      const matchQuery = p.name.toLowerCase().includes(query) || String(p.dex_number) === query;
      const matchType = !typeFilter || p.type1.toLowerCase() === typeFilter || (p.type2 && p.type2.toLowerCase() === typeFilter);
      return matchQuery && matchType;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 3rem;">No se encontraron Pokémon con los filtros actuales.</p>`;
      return;
    }

    grid.innerHTML = filtered
      .map((p) => {
        const isDrafted = draftedSet.has(p.id);
        const canAfford = activeCoach ? activeCoach.remaining_budget >= p.cost : true;
        const disabled = isDrafted || !canAfford || currentDraftState?.league.status !== 'DRAFTING';

        return `
          <div class="pokemon-card ${isDrafted ? 'drafted' : ''}" data-id="${p.id}">
            <span class="pokemon-cost-badge">${p.cost} pts</span>
            <img src="${p.sprite_animated_url || p.sprite_url}" alt="${p.name}" class="pokemon-sprite" loading="lazy" />
            <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.25rem;">${p.name}</div>
            <div style="margin-bottom: 0.75rem;">
              <span class="type-badge type-${p.type1.toLowerCase()}">${p.type1}</span>
              ${p.type2 ? `<span class="type-badge type-${p.type2.toLowerCase()}">${p.type2}</span>` : ''}
            </div>
            <button class="btn btn-primary btn-sm btn-pick-poke" data-id="${p.id}" ${disabled ? 'disabled' : ''} style="width: 100%;">
              ${isDrafted ? 'Seleccionado' : !canAfford ? 'Sin Pts' : 'Draftear'}
            </button>
          </div>
        `;
      })
      .join('');

    grid.querySelectorAll('.btn-pick-poke').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!activeCoach) return;
        const pokeId = parseInt(btn.getAttribute('data-id')!, 10);
        try {
          await api.makeDraftPick(leagueId, activeCoach.id, pokeId);
          showToast(`¡Pick realizado con éxito!`);
          await loadDraftData();
        } catch (err: any) {
          showToast(err.message, true);
        }
      });
    });
  };

  // Event Listeners
  document.getElementById('poke-search')?.addEventListener('input', filterAndRenderPokemons);
  document.getElementById('poke-type-filter')?.addEventListener('change', filterAndRenderPokemons);
  document.getElementById('btn-undo-pick')?.addEventListener('click', async () => {
    try {
      await api.undoDraftPick(leagueId);
      showToast('Última elección deshecha.');
      await loadDraftData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  });

  await loadDraftData();
};
