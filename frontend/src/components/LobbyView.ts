import { api } from '../services/api.js';
import { ILeague } from '../types/index.js';

export const renderLobbyView = async (
  container: HTMLElement,
  onSelectLeague: (leagueId: number) => void,
  showToast: (msg: string, isError?: boolean) => void
) => {
  container.innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">Ligas de PokeDraft</h1>
        <p class="subtitle">Crea, configura o únete a una liga competitiva</p>
      </div>
      <button id="btn-create-league-modal" class="btn btn-primary">+ Nueva Liga</button>
    </div>

    <div id="leagues-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
      <div class="card" style="text-align: center; padding: 3rem;">
        <p style="color: var(--text-muted);">Cargando ligas disponibles...</p>
      </div>
    </div>
  `;

  const refreshLeagues = async () => {
    try {
      const leagues = await api.getLeagues();
      const listContainer = document.getElementById('leagues-list');
      if (!listContainer) return;

      if (leagues.length === 0) {
        listContainer.innerHTML = `
          <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
            <h3>No hay ligas activas todavía</h3>
            <p style="color: var(--text-muted); margin: 1rem 0;">Crea tu primera liga para comenzar la fase de Draft.</p>
            <button id="btn-create-first-league" class="btn btn-primary">+ Crear Primera Liga</button>
          </div>
        `;
        document.getElementById('btn-first-league')?.addEventListener('click', () => openCreateModal());
        return;
      }

      listContainer.innerHTML = leagues
        .map(
          (l: ILeague) => `
          <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                <h3 style="font-size: 1.25rem;">${l.name}</h3>
                <span class="type-badge" style="background: rgba(59, 130, 246, 0.2); color: var(--accent-primary); border: 1px solid var(--accent-primary);">
                  ${l.status}
                </span>
              </div>
              <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
                <p>⚙️ Modo: <strong>${l.draft_mode}</strong></p>
                <p>💰 Presupuesto: <strong>${l.total_budget} pts</strong></p>
                <p>👥 Tamaño Roster: <strong>${l.roster_size} Pokémon</strong></p>
                <p>🛡️ Entrenadores inscritos: <strong>${l.Coaches ? l.Coaches.length : 0}</strong></p>
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-primary btn-sm btn-enter-league" data-id="${l.id}" style="flex: 1;">Entrar a la Liga</button>
              <button class="btn btn-secondary btn-sm btn-add-coach" data-id="${l.id}">+ Coach</button>
            </div>
          </div>
        `
        )
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
      showToast(error.message, true);
    }
  };

  const openCreateModal = () => {
    const modalBackdrop = document.getElementById('modal-container')!;
    modalBackdrop.classList.remove('hidden');
    modalBackdrop.innerHTML = `
      <div class="modal-content">
        <h2 style="margin-bottom: 1rem;">Crear Nueva Liga PokeDraft</h2>
        <form id="form-create-league" style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label style="font-size: 0.85rem; color: var(--text-muted);">Nombre de la Liga</label>
            <input type="text" id="league-name" class="input-search" style="width: 100%;" required placeholder="Ej. Liga Nacional Season 1" />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="font-size: 0.85rem; color: var(--text-muted);">Modo de Selección</label>
              <select id="league-mode" class="select-input" style="width: 100%;">
                <option value="POINTS">Por Puntos (Budget)</option>
                <option value="TIERS">Por Tiers (Rondas)</option>
              </select>
            </div>
            <div>
              <label style="font-size: 0.85rem; color: var(--text-muted);">Presupuesto Total (Pts)</label>
              <input type="number" id="league-budget" class="input-search" style="width: 100%;" value="100" />
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="font-size: 0.85rem; color: var(--text-muted);">Tamaño de Plantilla</label>
              <input type="number" id="league-roster-size" class="input-search" style="width: 100%;" value="10" />
            </div>
            <div>
              <label style="font-size: 0.85rem; color: var(--text-muted);">Segundos por Turno</label>
              <input type="number" id="league-timer" class="input-search" style="width: 100%;" value="120" />
            </div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem;">
            <button type="button" id="btn-cancel-modal" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary">Crear Liga</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('btn-cancel-modal')?.addEventListener('click', () => {
      modalBackdrop.classList.add('hidden');
    });

    document.getElementById('form-create-league')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const name = (document.getElementById('league-name') as HTMLInputElement).value;
        const draft_mode = (document.getElementById('league-mode') as HTMLSelectElement).value as any;
        const total_budget = parseInt((document.getElementById('league-budget') as HTMLInputElement).value, 10);
        const roster_size = parseInt((document.getElementById('league-roster-size') as HTMLInputElement).value, 10);
        const time_per_pick_seconds = parseInt((document.getElementById('league-timer') as HTMLInputElement).value, 10);

        const newLeague = await api.createLeague({ name, draft_mode, total_budget, roster_size, time_per_pick_seconds });
        showToast(`Liga "${name}" creada con éxito.`);
        modalBackdrop.classList.add('hidden');
        await refreshLeagues();
        onSelectLeague(newLeague.id);
      } catch (err: any) {
        showToast(err.message, true);
      }
    });
  };

  const openAddCoachModal = (leagueId: number) => {
    const modalBackdrop = document.getElementById('modal-container')!;
    modalBackdrop.classList.remove('hidden');
    modalBackdrop.innerHTML = `
      <div class="modal-content">
        <h2 style="margin-bottom: 1rem;">Inscribir Entrenador</h2>
        <form id="form-add-coach" style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label style="font-size: 0.85rem; color: var(--text-muted);">Nombre del Entrenador</label>
            <input type="text" id="coach-name" class="input-search" style="width: 100%;" required placeholder="Ej. Red" />
          </div>
          <div>
            <label style="font-size: 0.85rem; color: var(--text-muted);">Nombre del Equipo</label>
            <input type="text" id="coach-team-name" class="input-search" style="width: 100%;" required placeholder="Ej. Kanto Apex" />
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem;">
            <button type="button" id="btn-cancel-coach-modal" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary">Inscribir</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('btn-cancel-coach-modal')?.addEventListener('click', () => {
      modalBackdrop.classList.add('hidden');
    });

    document.getElementById('form-add-coach')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const name = (document.getElementById('coach-name') as HTMLInputElement).value;
        const team_name = (document.getElementById('coach-team-name') as HTMLInputElement).value;
        await api.registerCoach({ league_id: leagueId, name, team_name });
        showToast(`Entrenador ${name} registrado con éxito.`);
        modalBackdrop.classList.add('hidden');
        await refreshLeagues();
      } catch (err: any) {
        showToast(err.message, true);
      }
    });
  };

  document.getElementById('btn-create-league-modal')?.addEventListener('click', openCreateModal);

  await refreshLeagues();
};
