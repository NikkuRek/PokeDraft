import { api } from '../services/api.js';
import { ILeague } from '../types/index.js';
import { escapeHtml, getLeagueStatusMeta } from '../utils/format.js';
import { icon } from '../utils/icons.js';

export const renderLobbyView = async (
  container: HTMLElement,
  onSelectLeague: (leagueId: number) => void,
  showToast: (msg: string, isError?: boolean) => void
) => {
  container.innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">${icon('leagues')}<span>Ligas de PokeDraft</span></h1>
        <p class="subtitle">Crea, configura o únete a una liga competitiva de Pokémon Draft</p>
      </div>
      <div class="section-actions">
        <button type="button" id="btn-create-league-modal" class="btn btn-primary">
          ${icon('plus')}
          <span>Nueva Liga</span>
        </button>
      </div>
    </div>

    <div id="leagues-list" class="leagues-grid">
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
    </div>
  `;

  const openCreateModal = () => {
    const modalBackdrop = document.getElementById('modal-container');
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove('hidden');
    modalBackdrop.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Crear Nueva Liga PokeDraft</h2>
          <button type="button" id="btn-close-create-league" class="btn btn-ghost btn-icon" aria-label="Cerrar ventana">
            ${icon('close')}
          </button>
        </div>
        <form id="form-create-league" style="display: flex; flex-direction: column; gap: 1rem;">
          <div class="field-group">
            <label class="field-label" for="league-name">Nombre de la Liga</label>
            <input type="text" id="league-name" class="input-well" required placeholder="Ej. Liga Nacional Season 1" />
          </div>
          <div class="form-grid-2">
            <div class="field-group">
              <label class="field-label" for="league-mode">Modo de Selección</label>
              <select id="league-mode" class="select-well">
                <option value="POINTS">Por Puntos (Presupuesto)</option>
                <option value="TIERS">Por Tiers (Rondas)</option>
              </select>
            </div>
            <div class="field-group">
              <label class="field-label" for="league-budget">Presupuesto Total (Pts)</label>
              <input type="number" id="league-budget" class="input-well mono-num" value="100" min="1" />
            </div>
          </div>
          <div class="form-grid-2">
            <div class="field-group">
              <label class="field-label" for="league-roster-size">Tamaño de Plantilla</label>
              <input type="number" id="league-roster-size" class="input-well mono-num" value="10" min="1" max="20" />
            </div>
            <div class="field-group">
              <label class="field-label" for="league-timer">Segundos por Turno</label>
              <input type="number" id="league-timer" class="input-well mono-num" value="120" min="15" />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" id="btn-cancel-modal" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary">${icon('plus')}<span>Crear Liga</span></button>
          </div>
        </form>
      </div>
    `;

    const closeModal = () => modalBackdrop.classList.add('hidden');
    document.getElementById('btn-cancel-modal')?.addEventListener('click', closeModal);
    document.getElementById('btn-close-create-league')?.addEventListener('click', closeModal);

    document.getElementById('form-create-league')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const name = (document.getElementById('league-name') as HTMLInputElement).value.trim();
        const draft_mode = (document.getElementById('league-mode') as HTMLSelectElement).value as 'POINTS' | 'TIERS';
        const total_budget = parseInt((document.getElementById('league-budget') as HTMLInputElement).value, 10);
        const roster_size = parseInt((document.getElementById('league-roster-size') as HTMLInputElement).value, 10);
        const time_per_pick_seconds = parseInt((document.getElementById('league-timer') as HTMLInputElement).value, 10);

        const newLeague = await api.createLeague({
          name,
          draft_mode,
          total_budget,
          roster_size,
          time_per_pick_seconds
        });
        showToast(`Liga "${name}" creada con éxito.`);
        closeModal();
        await refreshLeagues();
        onSelectLeague(newLeague.id);
      } catch (err: any) {
        showToast(err.message, true);
      }
    });
  };

  const openAddCoachModal = (leagueId: number) => {
    const modalBackdrop = document.getElementById('modal-container');
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove('hidden');
    modalBackdrop.innerHTML = `
      <div class="modal-content modal-content--compact">
        <div class="modal-header">
          <h2>Inscribir Entrenador</h2>
          <button type="button" id="btn-close-coach-modal" class="btn btn-ghost btn-icon" aria-label="Cerrar ventana">
            ${icon('close')}
          </button>
        </div>
        <form id="form-add-coach" style="display: flex; flex-direction: column; gap: 1rem;">
          <div class="field-group">
            <label class="field-label" for="coach-name">Nombre del Entrenador</label>
            <input type="text" id="coach-name" class="input-well" required placeholder="Ej. Red" />
          </div>
          <div class="field-group">
            <label class="field-label" for="coach-team-name">Nombre del Equipo</label>
            <input type="text" id="coach-team-name" class="input-well" required placeholder="Ej. Kanto Apex" />
          </div>
          <div class="modal-actions">
            <button type="button" id="btn-cancel-coach-modal" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary">${icon('check')}<span>Inscribir</span></button>
          </div>
        </form>
      </div>
    `;

    const closeModal = () => modalBackdrop.classList.add('hidden');
    document.getElementById('btn-cancel-coach-modal')?.addEventListener('click', closeModal);
    document.getElementById('btn-close-coach-modal')?.addEventListener('click', closeModal);

    document.getElementById('form-add-coach')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const name = (document.getElementById('coach-name') as HTMLInputElement).value.trim();
        const team_name = (document.getElementById('coach-team-name') as HTMLInputElement).value.trim();
        await api.registerCoach({ league_id: leagueId, name, team_name });
        showToast(`Entrenador ${name} registrado con éxito.`);
        closeModal();
        await refreshLeagues();
      } catch (err: any) {
        showToast(err.message, true);
      }
    });
  };

  const refreshLeagues = async () => {
    try {
      const leagues = await api.getLeagues();
      const listContainer = document.getElementById('leagues-list');
      if (!listContainer) return;

      if (leagues.length === 0) {
        listContainer.innerHTML = `
          <div class="card empty-panel" style="grid-column: 1 / -1;">
            <div class="empty-panel-icon">${icon('leagues')}</div>
            <h2>No hay ligas activas todavía</h2>
            <p class="subtitle">Crea tu primera liga competitiva para inscribir entrenadores y abrir la sala de Draft Snake.</p>
            <button type="button" id="btn-create-first-league" class="btn btn-primary">
              ${icon('plus')}
              <span>Crear Primera Liga</span>
            </button>
          </div>
        `;
        document.getElementById('btn-create-first-league')?.addEventListener('click', openCreateModal);
        return;
      }

      listContainer.innerHTML = leagues
        .map((l: ILeague) => {
          const statusMeta = getLeagueStatusMeta(l.status);
          const coachCount = l.Coaches ? l.Coaches.length : 0;
          const modeLabel = l.draft_mode === 'POINTS' ? 'Puntos' : 'Tiers';
          return `
            <article class="card league-card">
              <div class="league-card-head">
                <h2 class="league-name">${escapeHtml(l.name)}</h2>
                <span class="status-pill ${statusMeta.cls}">
                  <span class="status-dot" aria-hidden="true"></span>
                  <span>${statusMeta.label}</span>
                </span>
              </div>

              <div class="league-metrics-grid">
                <div class="neo-well league-metric-well">
                  <span class="league-metric-label">Modo Draft</span>
                  <span class="league-metric-val">${modeLabel}</span>
                </div>
                <div class="neo-well league-metric-well">
                  <span class="league-metric-label">Presupuesto</span>
                  <span class="league-metric-val" style="color: var(--dex-gold);">${l.total_budget} pts</span>
                </div>
                <div class="neo-well league-metric-well">
                  <span class="league-metric-label">Plantilla</span>
                  <span class="league-metric-val">${l.roster_size} Pokémon</span>
                </div>
                <div class="neo-well league-metric-well">
                  <span class="league-metric-label">Entrenadores</span>
                  <span class="league-metric-val" style="color: var(--dex-cyan);">${coachCount}</span>
                </div>
              </div>

              <div class="league-card-actions">
                <button type="button" class="btn btn-primary btn-sm btn-enter-league" data-id="${l.id}" style="flex: 1;">
                  ${icon('draft')}
                  <span>Entrar a la Liga</span>
                </button>
                <button type="button" class="btn btn-secondary btn-sm btn-add-coach" data-id="${l.id}">
                  ${icon('plus')}
                  <span>Coach</span>
                </button>
              </div>
            </article>
          `;
        })
        .join('');

      listContainer.querySelectorAll('.btn-enter-league').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-id')!, 10);
          onSelectLeague(id);
        });
      });

      listContainer.querySelectorAll('.btn-add-coach').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-id')!, 10);
          openAddCoachModal(id);
        });
      });
    } catch (error: any) {
      const listContainer = document.getElementById('leagues-list');
      if (listContainer) {
        listContainer.innerHTML = `
          <div class="card empty-panel" style="grid-column: 1 / -1;">
            <div class="empty-panel-icon" style="color: var(--dex-crimson);">${icon('alert')}</div>
            <h2>No se pudieron cargar las ligas</h2>
            <p class="subtitle">${escapeHtml(error.message || 'Verifica la conexión con el servidor API.')}</p>
          </div>
        `;
      }
      showToast(error.message, true);
    }
  };

  document.getElementById('btn-create-league-modal')?.addEventListener('click', openCreateModal);

  await refreshLeagues();
};
