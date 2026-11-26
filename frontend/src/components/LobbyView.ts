import { api } from '../services/api.js';
import { ILeague } from '../types/index.js';
import { escapeHtml, getLeagueStatusMeta } from '../utils/format.js';
import { icon } from '../utils/icons.js';
import { openLeagueAdminModal } from './LeagueAdminModal.js';

export const renderLobbyView = async (
  container: HTMLElement,
  onSelectLeague: (leagueId: number) => void,
  showToast: (msg: string, isError?: boolean) => void
) => {
  container.innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">${icon('leagues')}<span>Ligas de PokeDraft</span></h1>
        <p class="subtitle">Formato NatDex Gen 9, Draft Asíncrono y tabla tipo Premier League Ida y Vuelta</p>
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

  let loadedLeagues: ILeague[] = [];

  const openCreateModal = () => {
    const modalBackdrop = document.getElementById('modal-container');
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove('hidden');
    modalBackdrop.innerHTML = `
      <div class="modal-content modal-content--wide">
        <div class="modal-header">
          <h2>Crear Nueva Liga NatDex Gen 9</h2>
          <button type="button" id="btn-close-create-league" class="btn btn-ghost btn-icon" aria-label="Cerrar ventana">
            ${icon('close')}
          </button>
        </div>
        <form id="form-create-league" style="display: flex; flex-direction: column; gap: 0.9rem;">
          <div class="form-grid-2">
            <div class="field-group">
              <label class="field-label" for="league-name">Nombre de la Liga</label>
              <input type="text" id="league-name" class="input-well" required placeholder="Ej. Premier NatDex Season 1" enterkeyhint="next" />
            </div>
            <div class="field-group">
              <label class="field-label" for="league-format">Formato Competitivo</label>
              <input type="text" id="league-format" class="input-well" value="NatDex Gen 9" required />
            </div>
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
              <input type="number" id="league-budget" class="input-well mono-num" value="100" min="1" inputmode="numeric" />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="field-group">
              <label class="field-label" for="league-roster-size">Tamaño de Plantilla</label>
              <input type="number" id="league-roster-size" class="input-well mono-num" value="10" min="1" max="20" inputmode="numeric" />
            </div>
            <div class="field-group">
              <label class="field-label" for="league-timer">Ritmo de Draft (Tiempo por Pick)</label>
              <select id="league-timer" class="select-well">
                <option value="43200" selected>Asíncrono · 12 horas</option>
                <option value="86400">Asíncrono · 24 horas</option>
                <option value="21600">Asíncrono · 6 horas</option>
                <option value="3600">Semi-rápido · 1 hora</option>
                <option value="120">En vivo · 2 minutos</option>
              </select>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="field-group">
              <label class="field-label" for="league-max-megas">Máx. Megas (Selección Directa)</label>
              <input type="number" id="league-max-megas" class="input-well mono-num" value="1" min="0" max="6" inputmode="numeric" />
            </div>
            <div class="field-group">
              <label class="field-label" for="league-max-z">Máx. Portador Cristal Z</label>
              <input type="number" id="league-max-z" class="input-well mono-num" value="1" min="0" max="6" inputmode="numeric" />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="field-group">
              <label class="field-label" for="league-max-tera">Máx. Tera Captains</label>
              <input type="number" id="league-max-tera" class="input-well mono-num" value="0" min="0" max="6" inputmode="numeric" />
            </div>
            <div class="field-group">
              <label class="field-label" for="league-max-fa">Límite Free Agency (0 = sin límite)</label>
              <input type="number" id="league-max-fa" class="input-well mono-num" value="6" min="0" max="50" inputmode="numeric" />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="field-group">
              <label class="field-label" for="league-timeout-action">Si vence el turno asíncrono</label>
              <select id="league-timeout-action" class="select-well">
                <option value="AUTO_PICK" selected>Auto-pick (Cola o menor coste)</option>
                <option value="PAUSE">Pausar Draft automáticamente</option>
              </select>
            </div>
            <div class="field-group" style="justify-content: flex-end;">
              <label class="toggle-chip" for="league-trade-approval">
                <input type="checkbox" id="league-trade-approval" />
                <span>Aprobación de Trades por Comisionado</span>
              </label>
            </div>
          </div>

          <div class="neo-well" style="padding: 0.65rem 0.85rem; font-size: 0.8rem; color: var(--ink-secondary);">
            Reglas NatDex Gen 9 por defecto: <strong>Sin Dynamax</strong> · <strong>Sin Z-Moves adicionales</strong> · <strong>Premier Bo1 Ida y Vuelta</strong>.
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
        const format_name = (document.getElementById('league-format') as HTMLInputElement).value.trim();
        const draft_mode = (document.getElementById('league-mode') as HTMLSelectElement).value as 'POINTS' | 'TIERS';
        const total_budget = parseInt((document.getElementById('league-budget') as HTMLInputElement).value, 10);
        const roster_size = parseInt((document.getElementById('league-roster-size') as HTMLInputElement).value, 10);
        const time_per_pick_seconds = parseInt((document.getElementById('league-timer') as HTMLSelectElement).value, 10);
        const max_megas = parseInt((document.getElementById('league-max-megas') as HTMLInputElement).value, 10);
        const max_z_crystals = parseInt((document.getElementById('league-max-z') as HTMLInputElement).value, 10);
        const max_tera_captains = parseInt((document.getElementById('league-max-tera') as HTMLInputElement).value, 10);
        const max_free_agency_moves = parseInt((document.getElementById('league-max-fa') as HTMLInputElement).value, 10);
        const timeout_action = (document.getElementById('league-timeout-action') as HTMLSelectElement).value as
          | 'AUTO_PICK'
          | 'PAUSE';
        const require_trade_approval = Boolean(
          (document.getElementById('league-trade-approval') as HTMLInputElement).checked
        );

        const newLeague = await api.createLeague({
          name,
          format_name,
          draft_mode,
          total_budget,
          roster_size,
          time_per_pick_seconds,
          max_megas,
          max_z_crystals,
          max_tera_captains,
          max_free_agency_moves,
          timeout_action,
          require_trade_approval,
          allow_dynamax: false,
          allow_z_moves: false
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
            <input type="text" id="coach-name" class="input-well" required placeholder="Ej. Red" enterkeyhint="next" />
          </div>
          <div class="field-group">
            <label class="field-label" for="coach-team-name">Nombre del Equipo</label>
            <input type="text" id="coach-team-name" class="input-well" required placeholder="Ej. Kanto Apex" enterkeyhint="done" />
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

  const formatTimerShort = (sec?: number) => {
    const s = sec || 43200;
    if (s >= 3600) return `${Math.round(s / 3600)}h / turno`;
    return `${Math.round(s / 60)}m / turno`;
  };

  const refreshLeagues = async () => {
    try {
      const leagues = await api.getLeagues();
      loadedLeagues = leagues;
      const listContainer = document.getElementById('leagues-list');
      if (!listContainer) return;

      const authUser = api.getAuthUser();

      if (leagues.length === 0) {
        listContainer.innerHTML = `
          <div class="card empty-panel" style="grid-column: 1 / -1;">
            <div class="empty-panel-icon">${icon('leagues')}</div>
            <h2>No hay ligas activas todavía</h2>
            <p class="subtitle">Crea tu primera liga competitiva NatDex Gen 9 para inscribir entrenadores y abrir el Draft Asíncrono.</p>
            <button type="button" id="btn-create-first-league" class="btn btn-primary">
              ${icon('plus')}
              <span>Crear Primera Liga</span>
            </button>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = leagues
        .map((l: ILeague) => {
          const statusMeta = getLeagueStatusMeta(l.status);
          const coachCount = l.Coaches ? l.Coaches.length : 0;
          const modeLabel = l.draft_mode === 'POINTS' ? 'Puntos' : 'Tiers';
          const canManage = Boolean(authUser && (authUser.role === 'ADMIN' || l.admin_id === authUser.id));

          return `
            <article class="card league-card">
              <div class="league-card-head">
                <h2 class="league-name">${escapeHtml(l.name)}</h2>
                <span class="status-pill ${statusMeta.cls}">
                  <span class="status-dot" aria-hidden="true"></span>
                  <span>${statusMeta.label}</span>
                </span>
              </div>

              <div class="rules-chip-strip">
                <span class="rule-chip">${escapeHtml(l.format_name || 'NatDex Gen 9')}</span>
                <span class="rule-chip">${l.max_megas ?? 1} Mega · ${l.max_z_crystals ?? 1} Cristal Z</span>
                <span class="rule-chip">${formatTimerShort(l.time_per_pick_seconds)}</span>
                <span class="rule-chip">Premier Bo1</span>
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
                  <span>Entrar</span>
                </button>
                <button type="button" class="btn btn-secondary btn-sm btn-add-coach" data-id="${l.id}">
                  ${icon('plus')}
                  <span>Coach</span>
                </button>
                ${
                  canManage
                    ? `<button type="button" class="btn btn-secondary btn-sm btn-icon btn-admin-league" data-id="${l.id}" aria-label="Configurar liga como comisionado" title="Panel de Comisionado">
                        ${icon('crown')}
                      </button>`
                    : ''
                }
              </div>
            </article>
          `;
        })
        .join('');
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

  document.getElementById('leagues-list')?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const enterBtn = target.closest<HTMLButtonElement>('.btn-enter-league');
    if (enterBtn) {
      const id = parseInt(enterBtn.getAttribute('data-id') || '', 10);
      if (!isNaN(id)) onSelectLeague(id);
      return;
    }

    const addCoachBtn = target.closest<HTMLButtonElement>('.btn-add-coach');
    if (addCoachBtn) {
      const id = parseInt(addCoachBtn.getAttribute('data-id') || '', 10);
      if (!isNaN(id)) openAddCoachModal(id);
      return;
    }

    const adminBtn = target.closest<HTMLButtonElement>('.btn-admin-league');
    if (adminBtn) {
      const id = parseInt(adminBtn.getAttribute('data-id') || '', 10);
      const league = loadedLeagues.find((l) => l.id === id);
      if (league) {
        openLeagueAdminModal(league, showToast, refreshLeagues);
      }
      return;
    }

    if (target.closest('#btn-create-first-league')) {
      openCreateModal();
    }
  });

  document.getElementById('btn-create-league-modal')?.addEventListener('click', openCreateModal);

  await refreshLeagues();
};
